#!/usr/bin/env python3
"""把 data/_inbox/raw/YYYY-MM-DD.json 渲染成一份 Issue body（Markdown）。

用法：
    # 默认渲染最新的 raw JSON
    python3 scripts/render_candidate_issue.py

    # 指定具体文件
    python3 scripts/render_candidate_issue.py data/_inbox/raw/2026-05-17.json

    # 写到文件而不是 stdout
    python3 scripts/render_candidate_issue.py --out issue-body.md

被 .github/workflows/daily-discover.yml 用 gh issue create --body-file 消费。
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW = ROOT / 'data' / '_inbox' / 'raw'

# 一个 issue 里最多展示的候选条数；剩余在末尾用文字汇总。
DETAIL_LIMIT = 30


def latest_raw() -> Path | None:
    if not RAW.exists():
        return None
    files = sorted(RAW.glob('*.json'))
    return files[-1] if files else None


def rel(path: Path) -> str:
    """返回相对 ROOT 的路径；source 不在 ROOT 子树内时降级用绝对路径。"""
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def fmt_int(n: int) -> str:
    """1234 → '1,234'（千分位，让 star 数好读）。"""
    return f'{n:,}'


def render_candidate(idx: int, c: dict) -> str:
    full = c.get('full_name') or f"{c.get('author','?')}/{c.get('repo','?')}"
    stars = fmt_int(int(c.get('stars') or 0))
    pushed = c.get('pushed_at') or '?'
    desc = (c.get('github_description') or '').strip()
    if len(desc) > 220:
        desc = desc[:217] + '…'
    topics = c.get('topics') or []
    matched = c.get('matched_query') or ''
    license_id = c.get('license') or '—'
    lang = c.get('language') or '—'

    topic_str = ' '.join(f'`{t}`' for t in topics[:8])

    lines = [
        f'### {idx}. [{full}]({c.get("url")})  '
        f'⭐ {stars} · last push `{pushed}` · `{license_id}` · {lang}',
        '',
        (desc or '_（无 GitHub description）_'),
        '',
    ]
    if topic_str:
        lines.append(f'topics: {topic_str}')
    lines.append(f'命中查询：`{matched}`')
    lines.append('')
    lines.append(
        '- [ ] ✅ 接受 → 提主库 PR\n'
        '- [ ] ❌ 拒绝 → 加 `data/_inbox/blocklist.yaml`\n'
        '- [ ] 🕐 推迟 → 下周再看'
    )
    lines.append('')
    return '\n'.join(lines)


def render_body(payload: dict, source_path: Path) -> str:
    candidates = payload.get('candidates') or []
    discovered_at = payload.get('discovered_at') or ''
    rejected = payload.get('rejected_summary') or {}
    truncated = bool(payload.get('truncated'))
    queries = payload.get('queries') or []

    today = discovered_at[:10] or datetime.utcnow().strftime('%Y-%m-%d')

    head = [
        f'# 🆕 {today} skill 候选 ({len(candidates)} 条)',
        '',
        '> 由 `daily-discover.yml` 自动生成。每条都需要人工审过才能进 `data/repositories.yaml`。',
        '',
        f'- 数据快照：[`{rel(source_path)}`]'
        f'(../blob/main/{rel(source_path)})',
        f'- 发现时间：`{discovered_at}`',
        f'- 命中后过滤已剔除：'
        + (', '.join(f'{k}={v}' for k, v in sorted(rejected.items(), key=lambda kv: -kv[1]))
           if rejected else '无'),
    ]
    if truncated:
        head.append(
            f'- ⚠️ 当日候选超过 daily_cap，已截断到 {len(candidates)} 条。'
            '剩余请等明天或翻 raw JSON 末尾。'
        )
    head.append('')

    if not candidates:
        head += [
            '## 没有新候选',
            '',
            '所有命中仓库都在已收录列表或 blocklist 里。无需处理。',
            '',
        ]
        return '\n'.join(head)

    body_parts: list[str] = head + ['## 候选清单（按 star 倒序）', '']

    for i, c in enumerate(candidates[:DETAIL_LIMIT], start=1):
        body_parts.append(render_candidate(i, c))

    if len(candidates) > DETAIL_LIMIT:
        rest = candidates[DETAIL_LIMIT:]
        body_parts += [
            f'<details><summary>剩余 {len(rest)} 条（折叠）</summary>',
            '',
            '| # | repo | ⭐ | last push | matched |',
            '|---|------|---:|-----------|---------|',
        ]
        for i, c in enumerate(rest, start=DETAIL_LIMIT + 1):
            body_parts.append(
                f'| {i} | [{c.get("full_name")}]({c.get("url")}) | '
                f'{fmt_int(int(c.get("stars") or 0))} | '
                f'`{c.get("pushed_at") or "?"}` | '
                f'`{c.get("matched_query") or ""}` |'
            )
        body_parts += ['', '</details>', '']

    body_parts += [
        '## 用到的查询',
        '',
        '<details><summary>展开</summary>',
        '',
    ]
    for q in queries:
        body_parts.append(f'- `{q.get("label")}` → `{q.get("template")}`')
    body_parts += ['', '</details>', '']

    return '\n'.join(body_parts)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('source', nargs='?', help='raw JSON 路径，默认取最新')
    ap.add_argument('--out', help='输出文件，默认写 stdout')
    ap.add_argument('--title-only', action='store_true',
                    help='只输出建议的 Issue 标题（给 CI 拼接用）')
    args = ap.parse_args()

    src = Path(args.source) if args.source else latest_raw()
    if not src or not src.exists():
        print('❌ 找不到 raw JSON 文件', file=sys.stderr)
        return 2

    with open(src, encoding='utf-8') as f:
        payload = json.load(f)

    if args.title_only:
        today = (payload.get('discovered_at') or '')[:10]
        n = len(payload.get('candidates') or [])
        print(f'[discover] {today} {n} 个候选 skill 仓库')
        return 0

    body = render_body(payload, src)
    if args.out:
        Path(args.out).write_text(body, encoding='utf-8')
        print(f'✅ wrote {args.out}', file=sys.stderr)
    else:
        sys.stdout.write(body)
    return 0


if __name__ == '__main__':
    sys.exit(main())
