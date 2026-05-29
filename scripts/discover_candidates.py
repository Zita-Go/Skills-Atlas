#!/usr/bin/env python3
"""每日扫 GitHub Search，发现新的 skill 候选仓库。

阶段 1（无 LLM）：
  - 跑多条 GitHub Search Query
  - 跟 data/repositories.yaml 已收录列表 diff
  - 跟 data/_inbox/blocklist.yaml diff（人审拒绝过的不再骚扰）
  - 输出当日候选到 data/_inbox/raw/YYYY-MM-DD.json

被 .github/workflows/daily-discover.yml 每天调用一次。
本地跑：
    GITHUB_TOKEN=ghp_xxx python3 scripts/discover_candidates.py
不带 token 也能跑（速率限制更紧 + 更慢）。
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote_plus
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

import yaml

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'data'
INBOX = DATA / '_inbox'
RAW = INBOX / 'raw'

GH_TOKEN = os.environ.get('GITHUB_TOKEN', '')
USER_AGENT = 'skills-atlas-discover-bot'

# --- 调参区 -----------------------------------------------------------------

# 一条查询最多取多少个结果（GitHub Search API 单次最大 100；多页累加）
PER_QUERY_MAX = int(os.environ.get('DISCOVER_PER_QUERY_MAX', '50'))

# 一次 daily 跑最多收多少个候选（防 LLM 账单失控）。超过则截断并在结果里标记 truncated
DAILY_CAP = int(os.environ.get('DISCOVER_DAILY_CAP', '60'))

# 最近多少天内有 push 才算"活跃"
PUSHED_WITHIN_DAYS = int(os.environ.get('DISCOVER_PUSHED_WITHIN_DAYS', '90'))

# star 阈值；不同查询可单独覆盖（见 QUERIES）
DEFAULT_MIN_STARS = int(os.environ.get('DISCOVER_MIN_STARS', '30'))


def _since_date() -> str:
    """GitHub Search 用的 ISO 日期（仅日期部分），用于 pushed:>since。"""
    d = datetime.now(timezone.utc) - timedelta(days=PUSHED_WITHIN_DAYS)
    return d.strftime('%Y-%m-%d')


# 查询模板。{since} 会被 _since_date() 替换。
# 每条 query 是一个 (描述标签, 查询字符串) 的元组——标签会跟到候选里，便于审稿时知道
# 这条候选是从哪个口子捞上来的。
QUERIES: list[tuple[str, str]] = [
    ('topic-claude-skills',     'topic:claude-skills stars:>{min_stars} pushed:>{since}'),
    ('topic-agent-skills',      'topic:agent-skills stars:>{min_stars} pushed:>{since}'),
    ('topic-claude-code',       'topic:claude-code-skills stars:>{min_stars} pushed:>{since}'),
    ('topic-codex-skills',      'topic:codex-skills stars:>{min_stars} pushed:>{since}'),
    ('topic-skill-marketplace', 'topic:skill-marketplace stars:>{min_stars} pushed:>{since}'),
    ('path-skill-md',           '"SKILL.md" in:path stars:>50 pushed:>{since}'),
    ('path-dotclaude-skills',   'path:.claude/skills stars:>{min_stars} pushed:>{since}'),
    ('name-agent-skills',       'agent-skills in:name stars:>{min_stars} pushed:>{since}'),
    ('name-claude-skills',      'claude-skills in:name stars:>{min_stars} pushed:>{since}'),
    # 中文关键词
    ('zh-skill-readme',         '技能 claude in:readme stars:>20 pushed:>{since}'),
]


# --- HTTP ------------------------------------------------------------------

def _gh_get(url: str) -> dict | None:
    headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/vnd.github+json',
    }
    if GH_TOKEN:
        headers['Authorization'] = f'token {GH_TOKEN}'
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except HTTPError as e:
        # 403 通常是 rate limit；429 是 secondary rate limit
        body = ''
        try:
            body = e.read().decode('utf-8', errors='replace')[:200]
        except Exception:
            pass
        print(f'  ⚠️ HTTP {e.code} {url} {body}', file=sys.stderr)
        return None
    except URLError as e:
        print(f'  ⚠️ URL error {url}: {e}', file=sys.stderr)
        return None


def search_repos(query: str, per_page: int = 50, max_items: int = 50) -> list[dict]:
    """跑一条 search query，返回原始 repo 字典列表（最多 max_items 条）。"""
    items: list[dict] = []
    page = 1
    while len(items) < max_items:
        page_size = min(per_page, max_items - len(items))
        url = (
            f'https://api.github.com/search/repositories'
            f'?q={quote_plus(query)}&sort=stars&order=desc'
            f'&per_page={page_size}&page={page}'
        )
        data = _gh_get(url)
        if not data or 'items' not in data:
            break
        batch = data['items']
        items.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
        # 速率限制：search API 已认证 30 req/min，未认证 10 req/min
        time.sleep(2.5 if not GH_TOKEN else 0.7)
    return items[:max_items]


# --- 数据读取 ---------------------------------------------------------------

def load_known_repos() -> set[tuple[str, str]]:
    """已收录仓库的 (author, repo) 集合，全部小写。"""
    with open(DATA / 'repositories.yaml', encoding='utf-8') as f:
        repos = yaml.safe_load(f) or []
    out: set[tuple[str, str]] = set()
    for r in repos:
        a = (r.get('author') or '').lower()
        n = (r.get('repo') or '').lower()
        if a and n:
            out.add((a, n))
    return out


def load_blocklist() -> set[tuple[str, str]]:
    """blocklist 里被人审拒绝过的仓库，避免反复刷屏。"""
    bl_path = INBOX / 'blocklist.yaml'
    if not bl_path.exists():
        return set()
    with open(bl_path, encoding='utf-8') as f:
        data = yaml.safe_load(f) or []
    out: set[tuple[str, str]] = set()
    for r in data:
        a = (r.get('author') or '').lower()
        n = (r.get('repo') or '').lower()
        if a and n:
            out.add((a, n))
    return out


# --- 候选构造 ---------------------------------------------------------------

def normalize_candidate(item: dict, matched_query_label: str) -> dict:
    """把 GitHub API 原始结构裁成轻量候选记录。"""
    full = item.get('full_name') or ''
    author, _, repo = full.partition('/')
    license_obj = item.get('license') or {}
    return {
        'author': author,
        'repo': repo,
        'full_name': full,
        'url': item.get('html_url') or f'https://github.com/{full}',
        'stars': int(item.get('stargazers_count') or 0),
        'forks': int(item.get('forks_count') or 0),
        'open_issues': int(item.get('open_issues_count') or 0),
        'pushed_at': (item.get('pushed_at') or '')[:10],
        'created_at': (item.get('created_at') or '')[:10],
        'default_branch': item.get('default_branch') or 'main',
        'github_description': item.get('description') or '',
        'topics': item.get('topics') or [],
        'language': item.get('language') or '',
        'license': (license_obj.get('spdx_id') if isinstance(license_obj, dict) else '') or '',
        'is_fork': bool(item.get('fork')),
        'archived': bool(item.get('archived')),
        'disabled': bool(item.get('disabled')),
        'matched_query': matched_query_label,
    }


def is_acceptable(c: dict) -> tuple[bool, str]:
    """轻量过滤：fork / archived / disabled / 太冷的都不进 inbox。返回 (accept, reason)。"""
    if c['is_fork']:
        return False, 'fork'
    if c['archived']:
        return False, 'archived'
    if c['disabled']:
        return False, 'disabled'
    if c['stars'] < DEFAULT_MIN_STARS:
        return False, f'stars<{DEFAULT_MIN_STARS}'
    return True, ''


# --- 主流程 -----------------------------------------------------------------

def main() -> int:
    if not GH_TOKEN:
        print('⚠️ 未设置 GITHUB_TOKEN，使用未认证模式（速率限制更紧）。', file=sys.stderr)

    known = load_known_repos()
    blocked = load_blocklist()
    print(f'已收录仓库: {len(known)} 条；blocklist: {len(blocked)} 条')

    since = _since_date()
    print(f'查询活跃度窗口: pushed:>{since}\n')

    # author/repo（小写）→ 候选记录。同一仓库被多条 query 命中只保留一份，但合并 query 标签。
    seen: dict[tuple[str, str], dict] = {}
    rejected_summary: dict[str, int] = {}

    for label, tmpl in QUERIES:
        q = tmpl.format(since=since, min_stars=DEFAULT_MIN_STARS)
        print(f'[{label}] {q}')
        items = search_repos(q, max_items=PER_QUERY_MAX)
        print(f'  → {len(items)} repos')

        for item in items:
            cand = normalize_candidate(item, label)
            key = (cand['author'].lower(), cand['repo'].lower())
            if not cand['author'] or not cand['repo']:
                continue
            if key in known:
                rejected_summary['already_in_repos_yaml'] = (
                    rejected_summary.get('already_in_repos_yaml', 0) + 1)
                continue
            if key in blocked:
                rejected_summary['blocklisted'] = (
                    rejected_summary.get('blocklisted', 0) + 1)
                continue
            ok, reason = is_acceptable(cand)
            if not ok:
                rejected_summary[reason] = rejected_summary.get(reason, 0) + 1
                continue

            if key in seen:
                # 同仓库被多条 query 命中：合并 matched_query 标签
                prev = seen[key]
                tags = set(prev['matched_query'].split(','))
                tags.add(cand['matched_query'])
                prev['matched_query'] = ','.join(sorted(tags))
            else:
                seen[key] = cand

    # 按 star 倒序
    candidates = sorted(seen.values(), key=lambda c: -c['stars'])

    truncated = False
    if len(candidates) > DAILY_CAP:
        truncated = True
        candidates = candidates[:DAILY_CAP]

    # 写盘
    RAW.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    out_path = RAW / f'{today}.json'
    payload = {
        'discovered_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'queries': [{'label': l, 'template': t} for l, t in QUERIES],
        'pushed_within_days': PUSHED_WITHIN_DAYS,
        'min_stars': DEFAULT_MIN_STARS,
        'daily_cap': DAILY_CAP,
        'truncated': truncated,
        'rejected_summary': rejected_summary,
        'candidate_count': len(candidates),
        'candidates': candidates,
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print()
    print(f'✅ 候选 {len(candidates)} 条写入 {out_path.relative_to(ROOT)}'
          f'{" (truncated)" if truncated else ""}')
    if rejected_summary:
        print('过滤统计:')
        for k, v in sorted(rejected_summary.items(), key=lambda kv: -kv[1]):
            print(f'  - {k}: {v}')

    # exit code 0 = 成功；候选为 0 时也算成功（只是没新东西）
    return 0


if __name__ == '__main__':
    sys.exit(main())
