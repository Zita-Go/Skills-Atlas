#!/usr/bin/env python3
"""校验 data/*.yaml 数据完整性。

检查项：
  1. categories.yaml 里的 category id 必须唯一；每个 subcategory id 在自己 category 内唯一
  2. skills.yaml 里的 group id 必须唯一
  3. skills.yaml 里每个 group 引用的 category / subcategory 必须在 categories.yaml 存在
  4. skills.yaml 里每个 group 的 sources 必须在 repositories.yaml 存在
  5. repositories.yaml 里每个仓库的 url 必须是合法 GitHub URL
  6. skills.yaml 里每个 group 必填字段完整（id/skills/group/category/
     subcategory/chain/description/sources），且 chain 为布尔值

退出码：0 全部通过；1 有错误。
"""
import sys
import re
import yaml
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'data'

errors = []
warnings = []


def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)


def load(name):
    with open(DATA / name, encoding='utf-8') as f:
        return yaml.safe_load(f)


def main():
    categories = load('categories.yaml')
    skills = load('skills.yaml')
    repos = load('repositories.yaml')

    # 1. category id 唯一
    cat_ids = [c['id'] for c in categories]
    if len(cat_ids) != len(set(cat_ids)):
        dup = [x for x in cat_ids if cat_ids.count(x) > 1]
        err(f'重复的 category id: {set(dup)}')

    # subcategory id 在 category 内唯一
    cat_subcat_map = {}
    for c in categories:
        sub_ids = [s['id'] for s in c.get('subcategories', [])]
        if len(sub_ids) != len(set(sub_ids)):
            dup = [x for x in sub_ids if sub_ids.count(x) > 1]
            err(f'category "{c["id"]}" 内有重复的 subcategory id: {set(dup)}')
        cat_subcat_map[c['id']] = set(sub_ids)

    # 2. skills.yaml 里 id 唯一
    skill_ids = [s['id'] for s in skills if 'id' in s]
    if len(skill_ids) != len(set(skill_ids)):
        dup = [x for x in skill_ids if skill_ids.count(x) > 1]
        err(f'重复的 skill group id: {set(dup)}')

    # 2b. 每个 group 必填字段完整 + 类型合理
    required = ['id', 'skills', 'group', 'category',
                'subcategory', 'chain', 'description', 'sources']
    for i, s in enumerate(skills):
        sid = s.get('id', f'<第 {i + 1} 条>')
        for field in required:
            if field == 'chain':
                # chain=False 是合法值，不能用真值判断，单独校验
                if 'chain' not in s:
                    err(f'skill {sid}: 缺少必填字段 "chain"')
                elif not isinstance(s['chain'], bool):
                    err(f'skill {sid}: chain 必须是布尔值，'
                        f'当前是 {type(s["chain"]).__name__}')
            elif field not in s or s[field] in (None, '', []):
                err(f'skill {sid}: 缺少必填字段 "{field}"')

    # 3. skills.yaml 引用 category / subcategory 必须存在
    for s in skills:
        cat = s.get('category')
        sub = s.get('subcategory')
        if cat is None:
            continue  # 已由 2b 报告
        if cat not in cat_subcat_map:
            err(f'skill {s.get("id")}: 未知 category "{cat}"')
        elif sub not in cat_subcat_map[cat]:
            err(f'skill {s.get("id")}: category "{cat}" '
                f'下未找到 subcategory "{sub}"')

    # 4. skills.yaml sources 必须在 repositories.yaml 里
    repo_ids = {r['id'] for r in repos}
    for s in skills:
        for src in s.get('sources', []):
            if src not in repo_ids:
                err(f'skill {s.get("id")}: 未知 source "{src}"')

    # 5. repository url 合法 + 新可选字段校验
    url_re = re.compile(r'^https://github\.com/[^/]+/[^/]+/?$')
    lic_re = re.compile(r'^[\w.\-+]+$')
    known_types = {'skill', 'skill-pack', 'plugin', 'cli', 'cli-framework',
                   'cli-mcp', 'sdd-framework', 'python-library', 'desktop-app',
                   'video-engine', 'extraction-engine', 'marketplace',
                   'multi-skill-suite', 'claude-md-template'}
    for r in repos:
        if not url_re.match(r['url'].rstrip('/')):
            err(f'repo {r["id"]}: 非法 GitHub URL "{r["url"]}"')
        if not r.get('author') or not r.get('repo'):
            warn(f'repo {r["id"]}: 缺 author / repo 字段')
        if r.get('type') not in known_types:
            warn(f'repo {r["id"]}: 未知 type "{r.get("type")}"')
        if 'license' in r and not lic_re.match(str(r['license'])):
            warn(f'repo {r["id"]}: license 格式可疑 "{r["license"]}"')
        ov = r.get('install_override')
        if ov is not None and (not isinstance(ov, dict) or not ov.get('command')):
            err(f'repo {r["id"]}: install_override 必须是含 command 的对象')
        dp = r.get('doc_path')
        if dp is not None and (not isinstance(dp, str) or dp.startswith('/')):
            warn(f'repo {r["id"]}: doc_path 应为仓库内相对路径')
        sd = r.get('skill_docs')
        if sd is not None and not isinstance(sd, dict):
            err(f'repo {r["id"]}: skill_docs 必须是 skill名→路径 映射')
        slic = r.get('skill_licenses')
        if slic is not None and not isinstance(slic, dict):
            err(f'repo {r["id"]}: skill_licenses 必须是 skill名→SPDX 映射')

    # 6. 反向：每个 repo 都被至少一个 skill 引用
    used_repos = {src for s in skills for src in s.get('sources', [])}
    unused = repo_ids - used_repos
    if unused:
        warn(f'有 {len(unused)} 个 repo 未被任何 skill 引用: {sorted(unused)}')

    # 输出
    print(f'Categories: {len(categories)}')
    print(f'Skill groups: {len(skills)}')
    print(f'Repositories: {len(repos)}')
    print()
    if warnings:
        print(f'⚠️  {len(warnings)} warnings:')
        for w in warnings:
            print(f'  - {w}')
        print()
    if errors:
        print(f'❌ {len(errors)} errors:')
        for e in errors:
            print(f'  - {e}')
        sys.exit(1)
    print('✅ All checks passed.')


if __name__ == '__main__':
    main()
