#!/usr/bin/env python3
"""校验 data/*.yaml 数据完整性。

检查项：
  1. categories.yaml 里的 category id 必须唯一；每个 subcategory id 在自己 category 内唯一
  2. skills.yaml 里的 group id 必须唯一
  3. skills.yaml 里每个 group 引用的 category / subcategory 必须在 categories.yaml 存在
  4. skills.yaml 里每个 group 的 sources 必须在 repositories.yaml 存在
  5. repositories.yaml 里每个仓库的 url 必须是合法 GitHub URL

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
    skill_ids = [s['id'] for s in skills]
    if len(skill_ids) != len(set(skill_ids)):
        dup = [x for x in skill_ids if skill_ids.count(x) > 1]
        err(f'重复的 skill group id: {set(dup)}')

    # 3. skills.yaml 引用 category / subcategory 必须存在
    for s in skills:
        if s['category'] not in cat_subcat_map:
            err(f'skill {s["id"]}: 未知 category "{s["category"]}"')
        elif s['subcategory'] not in cat_subcat_map[s['category']]:
            err(f'skill {s["id"]}: category "{s["category"]}" '
                f'下未找到 subcategory "{s["subcategory"]}"')

    # 4. skills.yaml sources 必须在 repositories.yaml 里
    repo_ids = {r['id'] for r in repos}
    for s in skills:
        for src in s.get('sources', []):
            if src not in repo_ids:
                err(f'skill {s["id"]}: 未知 source "{src}"')

    # 5. repository url 合法
    url_re = re.compile(r'^https://github\.com/[^/]+/[^/]+/?$')
    for r in repos:
        if not url_re.match(r['url'].rstrip('/')):
            err(f'repo {r["id"]}: 非法 GitHub URL "{r["url"]}"')
        if not r.get('author') or not r.get('repo'):
            warn(f'repo {r["id"]}: 缺 author / repo 字段')

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
