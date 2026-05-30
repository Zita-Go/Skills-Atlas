export interface Install {
  command: string;
  alt?: string;
  note?: string;
  kind: string;
}

export interface Source {
  name: string;
  url: string;
  stars: number | null;
  last_commit: string | null;
  type: string;
  author: string | null;
  repo: string | null;
  default_branch: string;
  license: string | null;
  doc_path: string | null;
  install: Install | null;
}

export interface Vendor {
  url: string;
  description?: string;
  description_en?: string;
  stars: number | null;
  last_commit: string | null;
  type: string;
  author: string | null;
  repo: string | null;
  default_branch: string;
  license: string | null;
  doc_path: string | null;
  install: Install | null;
  skill_docs?: Record<string, string> | null;
  skill_licenses?: Record<string, string> | null;
}

export interface Row {
  skills: string[];
  group: string;
  group_en?: string;
  chain: boolean;
  description: string;
  description_en?: string;
  use_case?: string;
  personas?: string[];
  when_to_use?: string;
  py?: string;
  sources: Source[];
}

export interface Subsection {
  title: string;
  title_en?: string;
  rows: Row[];
}

export interface Section {
  title: string;
  title_en?: string;
  icon: string;
  subsections: Subsection[];
}

export interface SkillsAtlasData {
  sections: Section[];
  vendors: Record<string, Vendor>;
}

declare const data: SkillsAtlasData;
export default data;
