import { CONTENT_POOL } from "../data/contentPool";
import { MODULES, MODULE_OFFSET, weekThemeOf } from "../data/themes";
import type { DailyPlan, ContentEntry, Calibration, TermPhase } from "./types";

function daysSinceMonthStart(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.floor((+d - +start)/86400000);
}
function deterministicPick<T>(pool: T[], count: number, seed: number): T[] {
  if (pool.length===0) return [];
  const n = pool.length;
  const start = ((seed % n)+n)%n;
  return Array.from({length: Math.min(count,n)}, (_,i)=> pool[(start+i)%n]);
}
function preferUncompleted(pool: ContentEntry[], checks: Record<string,boolean>): ContentEntry[] {
  if (!checks || Object.keys(checks).length===0) return pool;
  const un = pool.filter(c=> !checks[c.id]);
  const done = pool.filter(c=> checks[c.id]);
  return un.length>= pool.length/2 ? [...un, ...done] : pool;
}
function resolveGradeKey(grade: number, termPhase: TermPhase, previewTargetGrade?: number): string {
  if (termPhase === "preview" && previewTargetGrade) return `g${previewTargetGrade}`;
  return `g${grade}`;
}
function applyPreviewFilter(pool: ContentEntry[], termPhase: TermPhase, subject: string, previewUnits?: Record<string, number>): ContentEntry[] {
  if (termPhase !== "preview") return pool;
  const maxUnit = previewUnits?.[subject] ?? 1;
  const filtered = pool.filter(c=> c.preview && c.unit != null && c.unit <= maxUnit);
  return filtered.length > 0 ? filtered : pool;
}
function subjectTextbook(subject: string, tb?: { chinese: string; math: string; english: string }): string | undefined {
  if (!tb) return undefined;
  if (subject === "语文") return tb.chinese;
  if (subject === "数学") return tb.math;
  if (subject === "英语") return tb.english;
  return undefined;
}
function matchesTextbook(entry: ContentEntry, tbVersion?: string): boolean {
  if (!entry.textbook) return true;
  if (!tbVersion || tbVersion === "其他") return true;
  return entry.textbook === tbVersion;
}
function applyCalibrationWeight(pool: ContentEntry[], calibrations: Calibration[], subject: string): ContentEntry[] {
  const cal = calibrations.find(c=> c.subject === subject);
  if (!cal) return pool;
  return pool
    .map(c=> ({ c, w: c.unit == null ? 1 : c.unit < cal.currentUnit ? 0.5 : c.unit === cal.currentUnit ? 2 : 0.3 }))
    .sort((a,b)=> b.w - a.w)
    .map(x=> x.c);
}

export function buildDailyPlan(opts: {
  grade: number;
  textbook?: { chinese: string; math: string; english: string };
  dateStr: string;
  enableEnglish: boolean;
  enableQuality: boolean;
  termPhase: TermPhase;
  previewTargetGrade?: number;
  previewUnits?: Record<string, number>;
  calibrations: Calibration[];
  dailyChecks: Record<string,boolean>;
  manualIds: string[];
}): DailyPlan {
  const gradeKey = resolveGradeKey(opts.grade, opts.termPhase, opts.previewTargetGrade);
  const weekTheme = weekThemeOf(opts.dateStr);
  const dayIndex = daysSinceMonthStart(opts.dateStr);
  const isPreview = opts.termPhase === "preview";
  const modules = MODULES
    .filter(m=> !(m.subject==="英语" && !opts.enableEnglish))
    .filter(m=> !(m.subject==="素质劳动" && !opts.enableQuality))
    .map(m=>{
      const tbVersion = subjectTextbook(m.subject, opts.textbook);
      let pool = CONTENT_POOL.filter(c=> c.gradeKey===gradeKey && c.subject===m.subject && c.reviewed && matchesTextbook(c, tbVersion)) as ContentEntry[];
      if (pool.length===0) pool = CONTENT_POOL.filter(c=> c.gradeKey===gradeKey && c.subject===m.subject && c.reviewed) as ContentEntry[];
      if (isPreview) pool = applyPreviewFilter(pool, opts.termPhase, m.subject, opts.previewUnits);
      else pool = applyCalibrationWeight(pool, opts.calibrations, m.subject);
      pool = preferUncompleted(pool, opts.dailyChecks);
      const quota = isPreview ? Math.min(m.quota, 2) : m.quota;
      const offset = MODULE_OFFSET[m.moduleKey] ?? 0;
      const items = deterministicPick(pool, quota, dayIndex + offset + opts.grade*13);
      return { moduleKey: m.moduleKey, title: m.title, items };
    });
  const manualItems = opts.manualIds.map(id=> CONTENT_POOL.find(c=>c.id===id)).filter(Boolean) as ContentEntry[];
  return { date: opts.dateStr, gradeKey, weekTheme, termPhase: opts.termPhase, previewUnits: opts.previewUnits, calibrations: opts.calibrations, modules, manualItems };
}
export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = 0.9;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}