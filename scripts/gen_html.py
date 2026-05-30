#!/usr/bin/env python3
"""根据 data/*.yaml 重新生成 docs/index.html。

适合：以后只改 yaml，不动 HTML 源码时执行。
"""
import json
import yaml
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'data'
DOCS = ROOT / 'docs'
TEMPLATE = ROOT / 'scripts' / 'templates' / 'index.html.tmpl'


def load(name):
    with open(DATA / name, encoding='utf-8') as f:
        return yaml.safe_load(f)


def install_for(repo):
    """返回 {command, alt?, note?, kind}，前端直接用、不含分支逻辑。
    优先级：install_override > 按 type。

    默认 `npx skills add owner/repo`（Vercel skills CLI）：它会在仓库的
    root / skills/ / skills/.curated/ 等位置找 SKILL.md，找不到就优雅报
    "No skills found" 退出——所以对任何含 SKILL.md 的仓库都安全有效，哪怕
    它在 GitHub 上被归类为 cli / library / desktop-app。纯工具/框架（无
    SKILL.md，如 OpenSpec / get-shit-done）用 install_override 给真实命令。
    """
    if not repo:
        return None
    ov = repo.get('install_override')
    if isinstance(ov, dict) and ov.get('command'):
        return {'command': ov['command'], 'note': ov.get('note', ''), 'kind': 'override'}
    author, name = repo.get('author'), repo.get('repo')
    if not (author and name):
        return None
    typ = repo.get('type', 'skill')
    if typ in ('plugin', 'marketplace'):
        return {'command': f'/plugin marketplace add {author}/{name}', 'kind': typ}
    if typ == 'claude-md-template':
        return {'command': '# 把该仓库的 CLAUDE.md 复制到你的项目根目录', 'kind': typ}
    out = {'command': f'npx skills add {author}/{name}', 'kind': typ}
    if typ in ('skill', 'skill-pack', 'multi-skill-suite'):
        out['alt'] = f'git clone {repo.get("url", "")} ~/.claude/skills/{name}'
    return out


def build_sections(categories, skills, repos):
    """把扁平 skills 列表按 category / subcategory 重新组织成嵌套结构（前端消费）"""
    repo_map = {r['id']: r for r in repos}
    sections = []
    for cat in categories:
        h1 = {'title': cat['title'], 'icon': cat.get('icon', '📌'),
              'subsections': []}
        for sub in cat.get('subcategories', []):
            h2 = {'title': sub['title'], 'rows': []}
            for s in skills:
                if s['category'] == cat['id'] and s['subcategory'] == sub['id']:
                    sources_resolved = []
                    for src in s.get('sources', []):
                        repo = repo_map.get(src, {})
                        sources_resolved.append({
                            'name': src,
                            'url': repo.get('url', '#'),
                            'stars': repo.get('stars'),
                            'last_commit': repo.get('last_commit'),
                            'type': repo.get('type', 'skill'),
                            'author': repo.get('author'),
                            'repo': repo.get('repo'),
                            'default_branch': repo.get('default_branch', 'main'),
                            'license': repo.get('license'),
                            'doc_path': repo.get('doc_path'),
                            'install': install_for(repo),
                        })
                    h2['rows'].append({
                        'skills': s['skills'],
                        'group': s['group'],
                        'chain': s.get('chain', False),
                        'description': s['description'],
                        'sources': sources_resolved,
                    })
            if h2['rows']:
                h1['subsections'].append(h2)
        if h1['subsections']:
            sections.append(h1)
    return sections


def main():
    categories = load('categories.yaml')
    skills = load('skills.yaml')
    repos = load('repositories.yaml')

    sections = build_sections(categories, skills, repos)
    vendors = {r['id']: {
        'url': r['url'],
        'stars': r.get('stars'),
        'last_commit': r.get('last_commit'),
        'type': r.get('type', 'skill'),
        'author': r.get('author'),
        'repo': r.get('repo'),
        'default_branch': r.get('default_branch', 'main'),
        'license': r.get('license'),
        'doc_path': r.get('doc_path'),
        'install': install_for(r),
        'skill_docs': r.get('skill_docs'),  # Phase 2 富化后才有，否则 None
        'skill_licenses': r.get('skill_licenses'),  # 仓库内协议不统一时的逐 skill 协议
    } for r in repos}

    data = {'sections': sections, 'vendors': vendors}

    # 写 docs/data.json（前端可独立 fetch）
    with open(DOCS / 'data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Wrote docs/data.json ({len(sections)} sections, '
          f'{sum(len(h["subsections"]) for h in sections)} subs, '
          f'{sum(len(s["rows"]) for h in sections for s in h["subsections"])} groups)')

    # 写 docs/index.html（嵌入数据）
    if not TEMPLATE.exists():
        print(f'⚠️  template not found at {TEMPLATE}, skipping HTML render.')
        print(f'   docs/index.html 仍为旧版本（可手工编辑或 cp 现成 HTML）')
        return

    with open(TEMPLATE, encoding='utf-8') as f:
        template = f.read()
    rendered = template.replace('{{DATA_JSON}}',
                                json.dumps(data, ensure_ascii=False))
    with open(DOCS / 'index.html', 'w', encoding='utf-8') as f:
        f.write(rendered)
    print(f'Wrote docs/index.html ({len(rendered)/1024:.1f} KB)')


if __name__ == '__main__':
    main()
