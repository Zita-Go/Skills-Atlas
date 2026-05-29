#!/usr/bin/env python3
"""每日扫 GitHub Search，发现新的 skill 候选仓库。

阶段 1（无 LLM）：
  - 跑多条 GitHub Search Query
  - 跟 data/repositories.yaml 已收录列表 diff
  - 跟 data/_inbox/blocklist.yaml diff（人审拒绝过的不再骚扰）
  - 输出当日候选到 data/_inbox/raw/YYYY-MM-DD.json

查询词 / 阈值 全部外置在 data/_inbox/discovery.config.yaml（公开可 PR）。
本脚本只是「执行器」：读配置 → 跑搜索 → 出候选。改发现策略改那份 yaml，不用动代码。
优先级：环境变量 > 配置文件 > 代码内置兜底（_FALLBACK，配置缺失时的安全网）。

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

# --- 配置 -------------------------------------------------------------------
# 调参全部走 data/_inbox/discovery.config.yaml。下面的 _FALLBACK 只是配置文件
# 缺失 / 损坏时的安全网，同时充当 schema 的事实文档——改默认值请改 yaml，别改这里。

CONFIG_PATH = INBOX / 'discovery.config.yaml'

_FALLBACK: dict = {
    'per_query_max': 50,        # 一条查询最多取多少结果（Search 单次最大 100，多页累加）
    'daily_cap': 60,            # 一次 daily 最多收多少候选（防 LLM 账单失控），超出截断
    'pushed_within_days': 90,   # 最近多少天内有 push 才算"活跃"
    'min_stars': 30,            # 默认 star 阈值，填模板里的 {min_stars}
    'queries': [
        {'label': 'topic-claude-skills',     'template': 'topic:claude-skills stars:>{min_stars} pushed:>{since}'},
        {'label': 'topic-agent-skills',      'template': 'topic:agent-skills stars:>{min_stars} pushed:>{since}'},
        {'label': 'topic-claude-code',       'template': 'topic:claude-code-skills stars:>{min_stars} pushed:>{since}'},
        {'label': 'topic-codex-skills',      'template': 'topic:codex-skills stars:>{min_stars} pushed:>{since}'},
        {'label': 'topic-skill-marketplace', 'template': 'topic:skill-marketplace stars:>{min_stars} pushed:>{since}'},
        {'label': 'path-skill-md',           'template': '"SKILL.md" in:path stars:>50 pushed:>{since}'},
        {'label': 'path-dotclaude-skills',   'template': 'path:.claude/skills stars:>{min_stars} pushed:>{since}'},
        {'label': 'name-agent-skills',       'template': 'agent-skills in:name stars:>{min_stars} pushed:>{since}'},
        {'label': 'name-claude-skills',      'template': 'claude-skills in:name stars:>{min_stars} pushed:>{since}'},
        {'label': 'zh-skill-readme',         'template': '技能 claude in:readme stars:>20 pushed:>{since}'},
    ],
}


def _env_int(name: str, default: int) -> int:
    """读整数型环境变量；缺失或非法则回落到 default（并提示）。"""
    raw = os.environ.get(name)
    if raw is None or raw == '':
        return default
    try:
        return int(raw)
    except ValueError:
        print(f'  ⚠️ 环境变量 {name}={raw!r} 不是整数，忽略', file=sys.stderr)
        return default


def _normalize_queries(raw_queries) -> list[tuple[str, str]]:
    """把配置里的 queries 规整成 [(label, template), ...]，丢弃残缺项。"""
    out: list[tuple[str, str]] = []
    for q in raw_queries or []:
        if isinstance(q, dict):
            label, tmpl = q.get('label'), q.get('template')
        elif isinstance(q, (list, tuple)) and len(q) == 2:
            label, tmpl = q
        else:
            continue
        if label and tmpl:
            out.append((str(label), str(tmpl)))
    return out


def load_config() -> dict:
    """读 discovery.config.yaml，套上 env 覆盖，缺啥补内置兜底。

    优先级：环境变量 > 配置文件 > _FALLBACK。返回带 queries=[(label,template)] 的 dict。
    """
    cfg = {k: _FALLBACK[k] for k in ('per_query_max', 'daily_cap', 'pushed_within_days', 'min_stars')}
    raw_queries = _FALLBACK['queries']

    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, encoding='utf-8') as f:
                loaded = yaml.safe_load(f) or {}
            if not isinstance(loaded, dict):
                print(f'  ⚠️ {CONFIG_PATH.name} 顶层不是映射，改用内置兜底', file=sys.stderr)
            else:
                for k in ('per_query_max', 'daily_cap', 'pushed_within_days', 'min_stars'):
                    if loaded.get(k) is not None:
                        cfg[k] = int(loaded[k])
                if loaded.get('queries'):
                    raw_queries = loaded['queries']
        except Exception as e:  # noqa: BLE001 — 配置坏不该让发现整个挂掉
            print(f'  ⚠️ 读取 {CONFIG_PATH.name} 失败（{e}），改用内置兜底', file=sys.stderr)
    else:
        print(f'  ⚠️ 未找到 {CONFIG_PATH.name}，改用内置兜底', file=sys.stderr)

    # 环境变量覆盖（CI 临时调参）
    cfg['per_query_max'] = _env_int('DISCOVER_PER_QUERY_MAX', cfg['per_query_max'])
    cfg['daily_cap'] = _env_int('DISCOVER_DAILY_CAP', cfg['daily_cap'])
    cfg['pushed_within_days'] = _env_int('DISCOVER_PUSHED_WITHIN_DAYS', cfg['pushed_within_days'])
    cfg['min_stars'] = _env_int('DISCOVER_MIN_STARS', cfg['min_stars'])

    queries = _normalize_queries(raw_queries)
    if not queries:
        print('  ⚠️ 配置里没有有效查询，改用内置兜底查询', file=sys.stderr)
        queries = _normalize_queries(_FALLBACK['queries'])
    cfg['queries'] = queries
    return cfg


def _since_date(pushed_within_days: int) -> str:
    """GitHub Search 用的 ISO 日期（仅日期部分），用于 pushed:>since。"""
    d = datetime.now(timezone.utc) - timedelta(days=pushed_within_days)
    return d.strftime('%Y-%m-%d')


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


def is_acceptable(c: dict, min_stars: int) -> tuple[bool, str]:
    """轻量过滤：fork / archived / disabled / 太冷的都不进 inbox。返回 (accept, reason)。"""
    if c['is_fork']:
        return False, 'fork'
    if c['archived']:
        return False, 'archived'
    if c['disabled']:
        return False, 'disabled'
    if c['stars'] < min_stars:
        return False, f'stars<{min_stars}'
    return True, ''


# --- 主流程 -----------------------------------------------------------------

def main() -> int:
    if not GH_TOKEN:
        print('⚠️ 未设置 GITHUB_TOKEN，使用未认证模式（速率限制更紧）。', file=sys.stderr)

    cfg = load_config()
    min_stars = cfg['min_stars']
    per_query_max = cfg['per_query_max']
    daily_cap = cfg['daily_cap']
    queries = cfg['queries']
    print(f'配置: {len(queries)} 条查询 · min_stars={min_stars} · '
          f'per_query_max={per_query_max} · daily_cap={daily_cap} · '
          f'pushed_within_days={cfg["pushed_within_days"]}')

    known = load_known_repos()
    blocked = load_blocklist()
    print(f'已收录仓库: {len(known)} 条；blocklist: {len(blocked)} 条')

    since = _since_date(cfg['pushed_within_days'])
    print(f'查询活跃度窗口: pushed:>{since}\n')

    # author/repo（小写）→ 候选记录。同一仓库被多条 query 命中只保留一份，但合并 query 标签。
    seen: dict[tuple[str, str], dict] = {}
    rejected_summary: dict[str, int] = {}

    for label, tmpl in queries:
        q = tmpl.format(since=since, min_stars=min_stars)
        print(f'[{label}] {q}')
        items = search_repos(q, max_items=per_query_max)
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
            ok, reason = is_acceptable(cand, min_stars)
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
    if len(candidates) > daily_cap:
        truncated = True
        candidates = candidates[:daily_cap]

    # 写盘
    RAW.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    out_path = RAW / f'{today}.json'
    payload = {
        'discovered_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'queries': [{'label': l, 'template': t} for l, t in queries],
        'pushed_within_days': cfg['pushed_within_days'],
        'min_stars': min_stars,
        'daily_cap': daily_cap,
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
