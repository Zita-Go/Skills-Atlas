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
