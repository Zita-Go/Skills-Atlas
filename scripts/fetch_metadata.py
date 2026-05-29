#!/usr/bin/env python3
"""拉 GitHub star / last commit 等元数据，更新 repositories.yaml。

CI 中每周自动跑一次。本地跑需要 GITHUB_TOKEN（避免速率限制）。
"""
import os
import sys
import yaml
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'data'

GH_TOKEN = os.environ.get('GITHUB_TOKEN', '')


def fetch_repo(author, repo):
    url = f'https://api.github.com/repos/{author}/{repo}'
    headers = {'User-Agent': 'skills-atlas-bot'}
    if GH_TOKEN:
        headers['Authorization'] = f'token {GH_TOKEN}'
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=10) as resp:
            import json
            return json.loads(resp.read())
    except (HTTPError, URLError) as e:
        print(f'  ⚠️ {author}/{repo} - {e}', file=sys.stderr)
        return None


def main():
    with open(DATA / 'repositories.yaml', encoding='utf-8') as f:
        repos = yaml.safe_load(f)

    updated = 0
    failed = 0
    for r in repos:
        if not r.get('author') or not r.get('repo'):
            continue
        info = fetch_repo(r['author'], r['repo'])
        if info is None:
            failed += 1
            continue
        r['stars'] = info.get('stargazers_count', 0)
        r['last_commit'] = (info.get('pushed_at') or '')[:10]
        r['default_branch'] = info.get('default_branch', 'main')
        if info.get('description'):
            r['description'] = info['description']
        updated += 1
        # 简单速率限制
        time.sleep(0.3 if GH_TOKEN else 1.5)

    with open(DATA / 'repositories.yaml', 'w', encoding='utf-8') as f:
        f.write('# 源仓库元数据。type 字段：skill / skill-pack / plugin / cli /\n'
                '# cli-framework / cli-mcp / sdd-framework / python-library /\n'
                '# desktop-app / video-engine / extraction-engine / marketplace /\n'
                '# multi-skill-suite / claude-md-template\n')
        yaml.safe_dump(repos, f, allow_unicode=True, sort_keys=False,
                       default_flow_style=False, width=200)

    print(f'\n✅ Updated {updated} repos, {failed} failed.')
    if failed > 0:
        sys.exit(1 if failed > updated // 2 else 0)


if __name__ == '__main__':
    main()
