# Skills Atlas — `data.json` API

`https://zita-go.github.io/Skills-Atlas/data.json`（约 470KB，UTF-8 JSON）是本站的结构化数据，供前端 / MCP server / CLI / 第三方消费。MIT 许可，可自由二次利用（保留 attribution）。

> 也可 `npm install skills-atlas-data` 直接拿到带 TS 类型的数据（见 `packages/skills-atlas-data/`）。

## 顶层结构

```ts
interface Data {
  sections: Section[];   // 20 个大类（仅含有内容的）
  vendors:  Record<string, Vendor>;  // 111 个源仓库，key = 仓库 id
}
```

## Section / Subsection / Row

```ts
interface Section {
  title: string;            // 中文大类名，如 "一、软件开发与工程"
  title_en?: string;        // 英文
  icon: string;             // emoji
  subsections: Subsection[];
}
interface Subsection {
  title: string; title_en?: string;
  rows: Row[];              // 该子分组下的 skill 分组
}
interface Row {
  skills: string[];         // 该分组含的 skill 名（等价类，可多个）
  group: string;            // 分组中文名；group_en 为英文
  group_en?: string;
  chain: boolean;           // true = ⛓ 强绑定工作流（须串起来用）
  description: string;      // 中文描述；description_en 为英文
  description_en?: string;
  use_case?: string;        // 一句话「场景/能做什么」（LLM 起草）
  personas?: string[];      // 适合谁：工程/PM/设计/营销/创始人/研究/运营/求职/通用
  when_to_use?: string;     // 何时用
  py?: string;              // 拼音索引（搜索用）
  sources: Source[];        // 来源仓库（按 star 排序前的原序）
}
interface Source {
  name: string;             // 仓库 id（= vendors 的 key）
  url: string;              // GitHub URL
  stars: number | null;
  last_commit: string | null;   // ISO date
  type: string;             // skill / cli / marketplace / ...
  author: string; repo: string; default_branch: string;
  license: string | null;   // SPDX，如 MIT / Apache-2.0 / Elastic-2.0 / CC-BY-NC-SA-4.0
  doc_path: string | null;  // 仓库内主文档相对路径
  install: Install | null;  // 一键安装命令
}
```

## Install / Vendor

```ts
interface Install {
  command: string;          // 主命令，如 "npx skills add owner/repo"
  alt?: string;             // 备选，如 git clone
  note?: string;            // 说明
  kind: string;             // 命令类别
}
interface Vendor extends Source 之外的仓库级字段 {
  // url, stars, last_commit, type, author, repo, default_branch, license,
  // doc_path, install 同上，外加：
  description?: string; description_en?: string;
  skill_docs?: Record<string, string>;     // skill 名 → 仓库内 SKILL.md 路径
  skill_licenses?: Record<string, string>; // 仓库内协议不统一时的逐 skill SPDX
}
```

## 例子

```js
const data = await fetch('https://zita-go.github.io/Skills-Atlas/data.json').then(r => r.json());

// 1. 所有 ⛓ 强绑定工作流
const chains = data.sections.flatMap(s => s.subsections).flatMap(ss => ss.rows).filter(r => r.chain);

// 2. 按 use_case 关键词找
const found = data.sections.flatMap(s => s.subsections).flatMap(ss => ss.rows)
  .filter(r => (r.use_case || '').includes('SEO'));

// 3. 某 skill 的安装命令 + SKILL.md 路径
const v = data.vendors['superpowers'];
console.log(v.install.command, v.skill_docs['brainstorming']);
```

## 稳定性

字段以新增为主、尽量不破坏既有键。`use_case`/`personas`/`py`/`*_en` 等为可选字段，消费方应容忍缺失。数据每周由 CI 同步 GitHub star/license，结构变化会在本文件记录。
