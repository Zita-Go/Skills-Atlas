#!/usr/bin/env python3
"""Parse skills_by_function.md → 3 个结构化 YAML 文件。

输入：docs-md/skills_by_function.md
输出：
  - data/skills.yaml         每行 1 个 skill 条目
  - data/repositories.yaml   62 个源仓库元数据
  - data/categories.yaml     13 大类 / 74 子分组定义
"""
import re
import json
import yaml
import sys
import os
import unicodedata
from pathlib import Path

ROOT = Path(__file__).parent.parent
MD_FILE = ROOT / 'docs-md' / 'skills_by_function.md'

# 13 大类显示用 emoji
H1_ICONS = {
    '一、软件开发与工程': '⚙️',
    '二、文档与知识管理': '📄',
    '三、产品管理（PM）': '🎯',
    '四、营销 / 增长 / 销售': '📣',
    '五、设计 / 视觉 / 前端': '🎨',
    '六、媒体生产': '🎬',
    '七、数据 / 抓取 / 情报': '🔍',
    '八、求职 / 个人办公': '💼',
    '九、通信 / 工具集成': '🔗',
    '十、创业 / 财务 / 合规': '💰',
    '十一、学术 / 科研 / 长跑研究': '🔬',
    '十二、Agent 架构 / Context Engineering': '🧠',
    '十三、元能力 / Skill 治理': '🛠️',
}

H1_SLUG = {
    '一、软件开发与工程': 'software-engineering',
    '二、文档与知识管理': 'docs-knowledge',
    '三、产品管理（PM）': 'product-management',
    '四、营销 / 增长 / 销售': 'marketing-growth',
    '五、设计 / 视觉 / 前端': 'design-frontend',
    '六、媒体生产': 'media',
    '七、数据 / 抓取 / 情报': 'data-scraping',
    '八、求职 / 个人办公': 'jobsearch',
    '九、通信 / 工具集成': 'comms-integration',
    '十、创业 / 财务 / 合规': 'startup-finance',
    '十一、学术 / 科研 / 长跑研究': 'academic-research',
    '十二、Agent 架构 / Context Engineering': 'agent-architecture',
    '十三、元能力 / Skill 治理': 'meta-skill-mgmt',
}


def slugify(s):
    """生成纯 ASCII slug"""
    s = unicodedata.normalize('NFKD', s)
    s = re.sub(r'[^\w\s\-]+', '', s)
    s = re.sub(r'[\s_]+', '-', s).strip('-').lower()
    return s or 'untitled'


def subcat_slug(s):
    """子分组 slug：优先取前导数字 ID（如 "1.1 计划..." → "1-1"）"""
    m = re.match(r'^(\d+(?:\.\d+)?)\s', s)
    if m:
        return m.group(1).replace('.', '-')
    return slugify(s)


def parse_md(path):
    with open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')

    sections = []
    current_h1 = None
    current_h2 = None
    table_state = None
    skip_h1_titles = {'目录', '总览统计'}

    for raw in lines:
        line = raw.rstrip()
        # h1
        if line.startswith('## ') and not line.startswith('## 目录') and \
                not line.startswith('## 总览统计'):
            title = line[3:].strip()
            if not title or title in skip_h1_titles:
                continue
            current_h1 = {'title': title, 'subsections': []}
            sections.append(current_h1)
            current_h2 = None
            table_state = None
        elif line.startswith('### '):
            title = line[4:].strip()
            current_h2 = {'title': title, 'rows': []}
            if current_h1:
                current_h1['subsections'].append(current_h2)
            table_state = None
        elif re.match(r'^\|\s*Skill\s*名称\s*\|\s*分组\s*\|', line):
            table_state = 'header'
        elif re.match(r'^\|[\s\-\|:]+\|\s*$', line) and table_state == 'header':
            table_state = 'rows'
        elif line.startswith('|') and table_state == 'rows':
            m = re.match(
                r'^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$',
                line)
            if m:
                skills_str, group_str, desc, src_str = m.groups()
                skills = [s.strip() for s in skills_str.split('+') if s.strip()]
                chain = '⛓' in group_str
                group = group_str.replace('⛓', '').strip()
                sources = []
                for sm in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', src_str):
                    sources.append({
                        'vendor': sm.group(1),
                        'url': sm.group(2)
                    })
                if current_h2 is not None:
                    current_h2['rows'].append({
                        'skills': skills,
                        'group': group,
                        'chain': chain,
                        'description': desc,
                        'sources': sources,
                    })
        else:
            if line == '' or line.startswith('---'):
                table_state = None
            elif not line.startswith('|'):
                table_state = None
    return sections


def extract_categories(sections):
    """生成 categories.yaml 数据结构"""
    categories = []
    for h1 in sections:
        h1_title = h1['title']
        cat = dict()
        cat['id'] = H1_SLUG.get(h1_title, slugify(h1_title))
        cat['title'] = h1_title
        cat['icon'] = H1_ICONS.get(h1_title, '📌')
        cat['subcategories'] = []
        for h2 in h1['subsections']:
            sub = dict()
            sub['id'] = subcat_slug(h2['title'])
            sub['title'] = h2['title']
            cat['subcategories'].append(sub)
        categories.append(cat)
    return categories


def extract_skills(sections):
    """生成 skills.yaml 数据结构。每个 skill 一条；多 skill 合并行展开成多条但共享 group_id。"""
    skills = []
    seen_ids = {}
    group_counter = 0

    for h1 in sections:
        cat_id = H1_SLUG.get(h1['title'], slugify(h1['title']))
        for h2 in h1['subsections']:
            sub_id = subcat_slug(h2['title'])
            for row in h2['rows']:
                group_counter += 1
                group_id = f'{cat_id}--{sub_id}--{group_counter:03d}'
                # 该行的所有 skill 共用一个 group_id；他们之间的 vendor 来自 row['sources']
                # 一个 row 多 skill 时，没法机器分配每个 skill 对应哪个 vendor
                # 因此：skills 数组里一行 = 一个 group，sources 是该 group 集合
                skill_entry = dict()
                skill_entry['id'] = group_id
                skill_entry['skills'] = row['skills']
                skill_entry['group'] = row['group']
                skill_entry['category'] = cat_id
                skill_entry['subcategory'] = sub_id
                skill_entry['chain'] = row['chain']
                skill_entry['description'] = row['description']
                skill_entry['sources'] = [s['vendor'] for s in row['sources']]
                skills.append(skill_entry)
    return skills


def extract_repositories(sections):
    """生成 repositories.yaml 数据结构"""
    vendors = dict()
    for h1 in sections:
        for h2 in h1['subsections']:
            for row in h2['rows']:
                for s in row['sources']:
                    if s['vendor'] not in vendors:
                        vendors[s['vendor']] = {
                            'id': s['vendor'],
                            'url': s['url'],
                            'skill_groups': 0,
                        }
                    vendors[s['vendor']]['skill_groups'] += 1
    # 推断仓库 author / type
    out = []
    for vid, info in vendors.items():
        url = info['url']
        # 解析 author/repo
        m = re.match(r'https://github\.com/([^/]+)/([^/]+)', url)
        author = m.group(1) if m else None
        repo = m.group(2) if m else None
        entry = dict()
        entry['id'] = vid
        entry['author'] = author
        entry['repo'] = repo
        entry['url'] = url
        entry['type'] = 'skill'  # 默认；后面手工修正特殊条目
        entry['skill_group_count'] = info['skill_groups']
        out.append(entry)
    return out


# 已知非标准 SKILL.md 的 vendor —— 标记成 plugin / cli / app / suite / etc
NON_SKILL_TYPE = {
    'multica-ai': 'claude-md-template',
    'kenryu42': 'plugin',
    'anthropics-marketplace': 'marketplace',
    'Fission-AI': 'cli-framework',
    'gsd-build': 'sdd-framework',
    'vercel-labs': 'cli',  # agent-browser 部分
    'thedotmack': 'cli-mcp',
    'teng-lin': 'python-library',
    'Charlie85270': 'desktop-app',
    'calesthio': 'video-engine',
    'kreuzberg-dev': 'extraction-engine',
    'trailofbits': 'marketplace',
    'wanshuiyin': 'multi-skill-suite',
    'K-Dense-AI': 'multi-skill-suite',
    'imbad0202': 'multi-skill-suite',
}


def main():
    sections = parse_md(MD_FILE)
    print(f'Parsed: {len(sections)} h1, '
          f'{sum(len(h["subsections"]) for h in sections)} h2, '
          f'{sum(len(s["rows"]) for h in sections for s in h["subsections"])} rows')

    categories = extract_categories(sections)
    skills = extract_skills(sections)
    repositories = extract_repositories(sections)

    # 修正非标准 skill 的 type
    for r in repositories:
        if r['id'] in NON_SKILL_TYPE:
            r['type'] = NON_SKILL_TYPE[r['id']]

    # 写文件
    data_dir = ROOT / 'data'
    data_dir.mkdir(exist_ok=True)

    def dump_yaml(data, path, header=None):
        with open(path, 'w', encoding='utf-8') as f:
            if header:
                f.write(header + '\n')
            yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False,
                      default_flow_style=False, width=200)

    dump_yaml(categories, data_dir / 'categories.yaml',
              header='# 13 大类 / 74 子分组定义。\n# 每次新增分类需要在这里加，并同步到 skills.yaml。')
    dump_yaml(skills, data_dir / 'skills.yaml',
              header='# Skill 主数据。每条 = 一个功能分组（可含多个等价 skill）。\n'
                     '# 字段：id / skills / group / category / subcategory / chain / description / sources')
    dump_yaml(repositories, data_dir / 'repositories.yaml',
              header='# 源仓库元数据。type 字段：skill / skill-pack / plugin / cli / cli-framework /\n'
                     '# cli-mcp / sdd-framework / python-library / desktop-app / video-engine /\n'
                     '# extraction-engine / marketplace / multi-skill-suite / claude-md-template')

    # 同时写一份 JSON 给前端 fetch（更小，去掉注释）
    docs_dir = ROOT / 'docs'
    with open(docs_dir / 'data.json', 'w', encoding='utf-8') as f:
        json.dump({
            'categories': categories,
            'skills': skills,
            'repositories': repositories,
        }, f, ensure_ascii=False, indent=2)

    # 统计
    total_skills_unique = sum(len(s['skills']) for s in skills)
    chain_count = sum(1 for s in skills if s['chain'])
    print(f'\nWrote:')
    print(f'  data/categories.yaml    {len(categories)} categories')
    print(f'  data/skills.yaml        {len(skills)} groups, {total_skills_unique} skill names')
    print(f'  data/repositories.yaml  {len(repositories)} repositories')
    print(f'  docs/data.json          (frontend consume)')
    print(f'\n  ⛓ chain workflows: {chain_count}')


if __name__ == '__main__':
    main()
