#!/usr/bin/env python3
"""Phase 2 富化：给 repositories.yaml 填
  - doc_path   仓库主文档相对路径（根 SKILL.md > 根 README.md > … ）
  - skill_docs {skill名: 仓库内 SKILL.md 路径} 映射（精确归一化匹配，不臆造）

按需 / 月度跑（见 .github/workflows/enrich-docs.yml），结果走人审 PR，
**不在 deploy 路径上**。需要 GITHUB_TOKEN（trees API 每仓库 1 次调用）。

匹配规则：某 SKILL.md 的紧邻父目录名归一化后 == skill 名归一化，才记录。
0 候选时打印近似目录供人审；>1 候选时跳过并打印。绝不写不确定的映射。
"""
import os
import re
import sys
import json
import time
import datetime
import yaml
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'data'
GH_TOKEN = os.environ.get('GITHUB_TOKEN', '')

HEADER = ('# 源仓库元数据。type 字段：skill / skill-pack / plugin / cli /\n'
          '# cli-framework / cli-mcp / sdd-framework / python-library /\n'
          '# desktop-app / video-engine / extraction-engine / marketplace /\n'
          '# multi-skill-suite / claude-md-template\n'
          '# 可选字段：\n'
          '#   license          —— SPDX id，本脚本自动采集（NOASSERTION/无则留空）\n'
          '#   doc_path         —— 仓库内主文档相对路径；缺省时前端回退 SKILL.md→README.md\n'
          '#   install_override —— {command, note}，按 type 生成的安装命令不对时覆盖\n'
          '#   skill_docs       —— Phase 2：{skill名: 仓库内路径} 映射\n')


def norm(s):
    return re.sub(r'[^a-z0-9]', '', str(s).lower())


def gh_get(url):
    headers = {'User-Agent': 'skills-atlas-bot',
               'Accept': 'application/vnd.github+json'}
    if GH_TOKEN:
        headers['Authorization'] = f'token {GH_TOKEN}'
    try:
        with urlopen(Request(url, headers=headers), timeout=15) as r:
            return json.loads(r.read())
    except (HTTPError, URLError) as e:
        print(f'  ⚠️ {url} - {e}', file=sys.stderr)
        return None


def get_tree(author, repo, branch):
    d = gh_get(f'https://api.github.com/repos/{author}/{repo}'
               f'/git/trees/{branch}?recursive=1')
    if not d or 'tree' not in d:
        return None
    if d.get('truncated'):
        print(f'  ⚠️ {author}/{repo} tree 被截断，可能漏 SKILL.md', file=sys.stderr)
    return [t['path'] for t in d['tree'] if t.get('type') == 'blob']


def pick_doc_path(paths):
    """仓库主文档：根 SKILL.md > 根 README.md > 顶层 README.* > 任意 */SKILL.md。"""
    lower = {p.lower(): p for p in paths}
    if 'skill.md' in lower:
        return lower['skill.md']
    if 'readme.md' in lower:
        return lower['readme.md']
    for p in paths:
        if '/' not in p and p.lower().startswith('readme'):
            return p
    for p in paths:
        if p.lower().endswith('/skill.md'):
            return p
    return None


def raw_get(author, repo, branch, path):
    """取 raw 文本（raw 域，不耗 API 配额）。"""
    try:
        url = f'https://raw.githubusercontent.com/{author}/{repo}/{branch}/{path}'
        with urlopen(Request(url, headers={'User-Agent': 'skills-atlas-bot'}),
                     timeout=15) as r:
            return r.read().decode('utf-8', 'ignore')
    except (HTTPError, URLError):
        return None


def classify_license(text):
    """从 LICENSE 文本粗判 SPDX id（覆盖常见协议；认不出返回 None）。"""
    if not text:
        return None
    t = text.lower()
    if 'apache license' in t and ('version 2' in t or '2.0' in t):
        return 'Apache-2.0'
    if 'permission is hereby granted, free of charge' in t or 'mit license' in t:
        return 'MIT'
    if 'gnu affero general public' in t:
        return 'AGPL-3.0'
    if 'gnu lesser general public' in t:
        return 'LGPL-3.0'
    if 'gnu general public license' in t:
        return 'GPL-3.0' if 'version 3' in t else 'GPL-2.0'
    if 'mozilla public license' in t and '2.0' in t:
        return 'MPL-2.0'
    if 'redistribution and use in source and binary' in t:
        return 'BSD-3-Clause' if 'neither the name' in t else 'BSD-2-Clause'
    if 'isc license' in t:
        return 'ISC'
    if 'this is free and unencumbered software released into the public domain' in t:
        return 'Unlicense'
    if 'elastic license' in t:
        return 'Elastic-2.0'
    if 'business source license' in t:
        return 'BUSL-1.1'
    if 'server side public license' in t:
        return 'SSPL-1.0'
    if 'polyform' in t and 'noncommercial' in t:
        return 'PolyForm-Noncommercial-1.0.0'
    # Creative Commons：NC（非商用）变体更具体，先判
    if 'noncommercial' in t and 'sharealike' in t:
        return 'CC-BY-NC-SA-4.0'
    if 'noncommercial' in t:
        return 'CC-BY-NC-4.0'
    if 'attribution-sharealike' in t or ('creative commons' in t and 'sharealike' in t):
        return 'CC-BY-SA-4.0'
    if 'creative commons' in t and 'attribution' in t:
        return 'CC-BY-4.0'
    return None


def main():
    skills = yaml.safe_load(open(DATA / 'skills.yaml', encoding='utf-8'))
    repos = yaml.safe_load(open(DATA / 'repositories.yaml', encoding='utf-8'))
    today = os.environ.get('ENRICH_DATE') or datetime.date.today().isoformat()

    # 每个 repo 被哪些 skill 名引用（group 级 sources，故同组所有 skill 都算）
    refs = {}
    for g in skills:
        for src in g.get('sources', []):
            refs.setdefault(src, set()).update(g.get('skills', []))

    scanned = mapped = failed = 0
    lic_repo = lic_skill = 0
    for r in repos:
        a, name = r.get('author'), r.get('repo')
        if not a or not name:
            continue
        branch = r.get('default_branch', 'main')
        paths = get_tree(a, name, branch)
        time.sleep(0.25)
        if paths is None:
            failed += 1
            continue
        scanned += 1

        # 仓库级 doc_path（SKILL.md 是前端默认首选，无需显式存）
        dp = pick_doc_path(paths)
        if dp and dp != 'SKILL.md':
            r['doc_path'] = dp
        else:
            r.pop('doc_path', None)

        # SKILL.md 紧邻父目录名 → 路径
        dirmap = {}
        for p in paths:
            if p.lower().endswith('/skill.md'):
                parent = p.rsplit('/', 1)[0].rsplit('/', 1)[-1]
                dirmap.setdefault(norm(parent), []).append(p)

        sd = {}
        for sk in sorted(refs.get(r['id'], set())):
            cands = dirmap.get(norm(sk), [])
            if len(cands) == 1:
                sd[sk] = cands[0]
            elif len(cands) > 1:
                print(f'  多候选 {r["id"]}/{sk}: {cands}', file=sys.stderr)
            else:
                near = [d for d in dirmap if norm(sk) and (norm(sk) in d or d in norm(sk))]
                if near:
                    print(f'  未精确匹配 {r["id"]}/{sk} 近似: {near[:3]}（需人审）', file=sys.stderr)

        # Phase 2b：补 license（fetch_metadata 已取 GitHub SPDX；这里补 GitHub 认不出的）
        r.pop('skill_licenses', None)
        if not r.get('license'):
            # 先读根 LICENSE：ELv2 / CC-NC / BUSL 等 GitHub 不 SPDX 化的在这里抓
            lower0 = {p.lower(): p for p in paths}
            for cand in ('license', 'license.txt', 'license.md', 'copying'):
                if cand in lower0:
                    spdx = classify_license(raw_get(a, name, branch, lower0[cand]))
                    if spdx:
                        r['license'] = spdx
                    break
        if sd and not r.get('license'):
            lower = {p.lower(): p for p in paths}
            skill_lic = {}
            for sk, mdpath in sd.items():
                d = mdpath.rsplit('/', 1)[0]
                licpath = next((lower[c] for c in
                                (f'{d}/license.txt', f'{d}/license', f'{d}/license.md')
                                if c in lower), None)
                if not licpath:
                    continue
                spdx = classify_license(raw_get(a, name, branch, licpath))
                time.sleep(0.15)
                if spdx:
                    skill_lic[sk] = spdx
            if skill_lic:
                vals = set(skill_lic.values())
                if len(vals) == 1:
                    r['license'] = next(iter(vals))
                    lic_repo += 1
                else:
                    r['skill_licenses'] = skill_lic
                    lic_skill += len(skill_lic)

        if sd:
            r['skill_docs'] = sd
            r['skill_docs_generated_at'] = today
            mapped += len(sd)
        else:
            r.pop('skill_docs', None)
            r.pop('skill_docs_generated_at', None)

    with open(DATA / 'repositories.yaml', 'w', encoding='utf-8') as f:
        f.write(HEADER)
        yaml.safe_dump(repos, f, allow_unicode=True, sort_keys=False,
                       default_flow_style=False, width=200)

    print(f'\n✅ 扫描 {scanned} 个仓库（{failed} 失败），'
          f'映射 {mapped} 个 skill→SKILL.md；'
          f'per-skill LICENSE 补全 {lic_repo} 个仓库 + {lic_skill} 个逐 skill。')


if __name__ == '__main__':
    main()
