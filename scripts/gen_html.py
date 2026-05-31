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


def load_opt(name):
    """可选数据文件，缺失返回 {}。"""
    try:
        return load(name) or {}
    except FileNotFoundError:
        return {}


try:
    from pypinyin import lazy_pinyin

    def to_pinyin(s):
        return ' '.join(lazy_pinyin(s or ''))
except ImportError:  # pypinyin 可选：没装则不生成拼音索引（搜索仍可用）
    def to_pinyin(s):
        return ''


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
        out = {'command': ov['command'], 'note': ov.get('note', ''), 'kind': 'override'}
        if ov.get('note_en'):
            out['note_en'] = ov['note_en']
        return out
    author, name = repo.get('author'), repo.get('repo')
    if not (author and name):
        return None
    typ = repo.get('type', 'skill')
    if typ in ('plugin', 'marketplace'):
        return {'command': f'/plugin marketplace add {author}/{name}', 'kind': typ}
    if typ == 'claude-md-template':
        return {'command': '# 把该仓库的 CLAUDE.md 复制到你的项目根目录', 'kind': typ}
    out = {'command': f'npx skills add {author}/{name}', 'kind': typ}
    # 仓库同时是 Claude Code 插件（含 .claude-plugin/marketplace.json）：备选给官方插件装法
    # （主命令仍 npx skills add 抓 skill 子集；插件装拿完整包：skills + agents + 命令）。
    if repo.get('plugin_marketplace'):
        out['alt'] = f'/plugin marketplace add {author}/{name}'
    elif typ in ('skill', 'skill-pack', 'multi-skill-suite'):
        out['alt'] = f'git clone {repo.get("url", "")} ~/.claude/skills/{name}'
    return out


def build_sections(categories, skills, repos, usecases):
    """把扁平 skills 列表按 category / subcategory 重新组织成嵌套结构（前端消费）"""
    repo_map = {r['id']: r for r in repos}
    sections = []
    for cat in categories:
        h1 = {'title': cat['title'], 'title_en': cat.get('title_en'),
              'icon': cat.get('icon', '📌'),
              'subsections': []}
        for sub in cat.get('subcategories', []):
            h2 = {'title': sub['title'], 'title_en': sub.get('title_en'),
                  'rows': []}
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
                    uc = usecases.get(s['id'], {}) or {}
                    h2['rows'].append({
                        'skills': s['skills'],
                        'group': s['group'],
                        'group_en': s.get('group_en'),
                        'chain': s.get('chain', False),
                        'description': s['description'],
                        'description_en': s.get('description_en'),
                        'sources': sources_resolved,
                        'use_case': uc.get('use_case', ''),
                        'use_case_en': uc.get('use_case_en', ''),
                        'personas': uc.get('personas', []),
                        'when_to_use': uc.get('when_to_use', ''),
                        'when_to_use_en': uc.get('when_to_use_en', ''),
                        'py': to_pinyin(s['group'] + ' ' + ' '.join(s['skills'])
                                        + ' ' + uc.get('use_case', '')),
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
    usecases = load_opt('usecases.yaml')

    sections = build_sections(categories, skills, repos, usecases)
    vendors = {r['id']: {
        'url': r['url'],
        'description': r.get('description'),
        'description_en': r.get('description_en'),
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
    # SEO：动态计数注入到模板占位符（避免 meta 数字写死后过期）
    n_groups = sum(len(s['rows']) for h in sections for s in h['subsections'])
    n_repos = len(repos)
    n_cats = len(sections)
    n_subcats = sum(len(h['subsections']) for h in sections)
    n_unique = len({sk for s in skills for sk in s['skills']})
    n_chains = sum(1 for s in skills if s.get('chain'))
    for ph, val in {'{{N_REPOS}}': n_repos, '{{N_GROUPS}}': n_groups,
                    '{{N_CATS}}': n_cats, '{{N_SUBCATS}}': n_subcats,
                    '{{N_UNIQUE}}': n_unique, '{{N_CHAINS}}': n_chains}.items():
        rendered = rendered.replace(ph, str(val))
    # SEO：注入 schema.org JSON-LD（无日期 → 确定性，parity 友好）
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'Dataset',
        'name': 'Skills Atlas',
        'alternateName': '按功能分类的 AI Agent Skills 全景',
        'description': f'A functional panorama of AI Agent Skills — {n_unique} skills in {n_groups} groups across {n_cats} categories.',
        'url': 'https://zita-go.github.io/Skills-Atlas/',
        'keywords': ['AI agent skills', 'Claude Code', 'Codex', 'SKILL.md', 'skill directory'],
        'license': 'https://opensource.org/licenses/MIT',
        'creator': {'@type': 'Organization', 'name': 'Skills Atlas contributors'},
        'distribution': {'@type': 'DataDownload', 'encodingFormat': 'application/json',
                         'contentUrl': 'https://zita-go.github.io/Skills-Atlas/data.json'},
    }, ensure_ascii=False)
    rendered = rendered.replace(
        '</head>', f'<script type="application/ld+json">{ld}</script>\n</head>', 1)
    with open(DOCS / 'index.html', 'w', encoding='utf-8') as f:
        f.write(rendered)
    print(f'Wrote docs/index.html ({len(rendered)/1024:.1f} KB)')

    # SEO：sitemap + robots（确定性）
    (DOCS / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '  <url><loc>https://zita-go.github.io/Skills-Atlas/</loc></url>\n'
        '  <url><loc>https://zita-go.github.io/Skills-Atlas/?lang=en</loc></url>\n'
        '</urlset>\n', encoding='utf-8')
    (DOCS / 'robots.txt').write_text(
        'User-agent: *\nAllow: /\n'
        'Sitemap: https://zita-go.github.io/Skills-Atlas/sitemap.xml\n', encoding='utf-8')
    print('Wrote docs/sitemap.xml + robots.txt')


if __name__ == '__main__':
    main()
