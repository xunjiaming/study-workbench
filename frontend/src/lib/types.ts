export type Semester = "上" | "下";
export type TermPhase = "preview" | "in_term";
export type TextbookVersion = "人教版" | "北师大版" | "苏教版" | "其他";
export type Subject = "语文" | "数学" | "英语" | "运动健康" | "素质劳动" | "观察提醒";

export interface StudentProfile {
  nickname: string;
  grade: 1|2|3|4|5|6;
  semester: Semester;
  textbook: { chinese: TextbookVersion; math: TextbookVersion; english: TextbookVersion };
  dailyTimeSlot: string;
  weakSubjects: string[];
  enableEnglish: boolean;
  enableQuality: boolean;
  termPhase: TermPhase;
  previewTargetGrade?: 1|2|3|4|5|6;
  schoolStartDate?: string;
  previewUnits?: Record<string, number>;
  updatedAt: string;
}

export interface Calibration {
  subject: "语文" | "数学" | "英语";
  currentUnit: number;
  updatedAt: string;
}

export interface GradeBand {
  key: string;
  grade: number;
  name: string;
  semesterFocus: string;
  dailyMinutes: { chinese: number; math: number; english: number; sports: number; quality: number };
}

export interface ContentEntry {
  id: string;
  gradeKey: string;
  subject: Subject;
  theme: string;
  term?: "上" | "下";
  unit?: number;
  preview?: boolean;
  textbook?: TextbookVersion;
  title: string;
  materials: string;
  how: string;
  duration: string;
  safety: string;
  source: "ai_draft" | "human_reviewed";
  reviewed: boolean;
  tags?: string[];
  detail?: {
    chars?: { char: string; pinyin: string; words: string[] }[];
    problems?: { q: string; a: string }[];
    vocab?: { en: string; cn: string; sentence: string }[];
  };
}

export type ModuleKey = "chinese" | "math" | "english" | "sports" | "quality" | "observation";

export interface DailyModule {
  moduleKey: ModuleKey;
  title: string;
  items: ContentEntry[];
}

export interface DailyPlan {
  date: string;
  gradeKey: string;
  weekTheme: string;
  termPhase?: TermPhase;
  calibrations?: Calibration[];
  previewUnits?: Record<string, number>;
  modules: DailyModule[];
  manualItems: ContentEntry[];
}

export interface DayChecks {
  date: string;
  checks: Record<string, boolean>;
  manualPicks: string[];
  repeatable: true;
}

export interface ObservationItem {
  id: string;
  gradeKey: string;
  category: "专注力"|"读写姿势"|"阅读习惯"|"作业效率"|"错题整理"|"情绪状态";
  label: string;
}

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  profile: StudentProfile | null;
  calibrations: Calibration[];
  dailyChecks: Record<string, DayChecks>;
  observationChecks: Record<string, boolean>;
  archives: Record<string, DayChecks[]>;
  manualCollections: string[];
}