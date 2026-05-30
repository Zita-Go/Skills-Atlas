#!/usr/bin/env python3
"""把英文翻译 (_en) 合并进 data/*.yaml —— 双语数据的落地工具。

读取一批翻译结果 JSON（默认 /tmp/i18n_work/out/），按 id 匹配，在每个 zh
字段（title / group / description）后面就近插入对应的 *_en 字段。

设计要点：
  - ruamel 往返：保留注释 / 格式 / 行宽（width=4096 防止长中文行被重新折行，
    使 diff 只剩新增的 _en 键）。
  - 按 id 匹配，与顺序无关；data 漂移也安全（未知 id 跳过、缺失键跳过）。
  - 幂等：_en 已存在则原地覆盖、保持位置；重复跑同样输入是 no-op。
  - 仓库描述 copy-if-English：无中文的 description 直接复制到 description_en；
    含中文的用翻译结果覆盖。
  - 末尾打印覆盖率报告（filled/total + 缺失 id），退出码 0（除非文件 I/O 错）。

用法：python3 scripts/merge_i18n.py [翻译结果目录]
      默认目录 /tmp/i18n_work/out/，可含：
        skills_*.json      -> [{id, group_en, description_en}]
        categories.json    -> {categories:[{id,title_en}], subcategories:[{cat_id,id,title_en}]}
        repos.json         -> [{id, description_en}]   （只需含需翻译的中文仓库）
"""
import json
import re
import sys
from pathlib import Path
from ruamel.yaml import YAML

ROOT = Path(__file__).parent.parent
DATA = ROOT / 'data'
OUTDIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/i18n_work/out')
CJK = re.compile(r'[一-鿿]')

yaml = YAML()                      # round-trip
yaml.preserve_quotes = True
yaml.width = 4096                  # 关键：不重新折行
yaml.allow_unicode = True          # 中文按字面写，不转 \uXXXX
yaml.indent(mapping=2, sequence=2, offset=0)


def load_yaml(name):
    with open(DATA / name, encoding='utf-8') as f:
        return yaml.load(f)


def dump_yaml(name, doc):
    with open(DATA / name, 'w', encoding='utf-8') as f:
        yaml.dump(doc, f)


def load_json(path):
    if not path.exists():
        return None
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def put_after(node, base_key, en_key, value):
    """在 base_key 后就近插入 en_key=value。幂等、漂移安全。返回是否写入。"""
    if value is None or value == '':
        return False
    if en_key in node:                       # 幂等：原地覆盖，保持位置
        node[en_key] = value
        return True
    if base_key not in node:                 # 漂移安全：基准键没了就跳过
        return False
    pos = list(node.keys()).index(base_key) + 1
    node.insert(pos, en_key, value)
    return True


def coverage(label, filled, total, missing):
    miss = '' if not missing else f"  缺失: {missing[:8]}{'…' if len(missing) > 8 else ''}"
    print(f'  {label}: {filled}/{total}{miss}')


def main():
    # ---- 收集翻译 ----
    skills_map = {}                          # id -> {group_en, description_en}
    for p in sorted(OUTDIR.glob('skills_*.json')):
        for row in (load_json(p) or []):
            if row.get('id'):
                skills_map[row['id']] = row

    cat_data = load_json(OUTDIR / 'categories.json') or {}
    cat_map = {c['id']: c.get('title_en') for c in cat_data.get('categories', [])}
    sub_map = {f"{s['cat_id']}::{s['id']}": s.get('title_en')
               for s in cat_data.get('subcategories', [])}

    repo_tr = {r['id']: r.get('description_en')
               for r in (load_json(OUTDIR / 'repos.json') or [])}

    print(f'读取翻译: skills={len(skills_map)}  cats={len(cat_map)}  subs={len(sub_map)}  repos(译)={len(repo_tr)}')

    # ---- categories.yaml ----
    cats = load_yaml('categories.yaml')
    c_fill = c_tot = 0
    s_fill = s_tot = 0
    c_miss, s_miss = [], []
    for c in cats:
        c_tot += 1
        if put_after(c, 'title', 'title_en', cat_map.get(c['id'])):
            c_fill += 1
        else:
            c_miss.append(c['id'])
        for sub in c.get('subcategories', []):
            s_tot += 1
            key = f"{c['id']}::{sub['id']}"
            if put_after(sub, 'title', 'title_en', sub_map.get(key)):
                s_fill += 1
            else:
                s_miss.append(key)
    dump_yaml('categories.yaml', cats)

    # ---- skills.yaml ----
    skills = load_yaml('skills.yaml')
    g_fill = d_fill = tot = 0
    g_miss = []
    for s in skills:
        tot += 1
        tr = skills_map.get(s['id'], {})
        gok = put_after(s, 'group', 'group_en', tr.get('group_en'))
        dok = put_after(s, 'description', 'description_en', tr.get('description_en'))
        if gok:
            g_fill += 1
        if dok:
            d_fill += 1
        if not (gok and dok):
            g_miss.append(s['id'])
    dump_yaml('skills.yaml', skills)

    # ---- repositories.yaml （copy-if-English + 译文覆盖）----
    repos = load_yaml('repositories.yaml')
    r_fill = r_tot = 0
    for r in repos:
        desc = r.get('description')
        if not desc:
            continue
        r_tot += 1
        en = repo_tr.get(r['id'])
        if not en and not CJK.search(desc):
            en = desc                        # 已是英文 -> 直接复制
        if put_after(r, 'description', 'description_en', en):
            r_fill += 1
    dump_yaml('repositories.yaml', repos)

    # ---- 覆盖率报告 ----
    print('\n英文覆盖率：')
    coverage('category title_en', c_fill, c_tot, c_miss)
    coverage('subcategory title_en', s_fill, s_tot, s_miss)
    coverage('skill group_en', g_fill, tot, [])
    coverage('skill description_en', d_fill, tot, g_miss)
    coverage('repo description_en', r_fill, r_tot, [])
    print('✅ merge 完成。')


if __name__ == '__main__':
    main()
