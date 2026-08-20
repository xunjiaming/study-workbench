import type { StudentProfile, DayChecks, ExportPayload, Calibration } from "./types";

const K = {
  profile: "study.profile.v1",
  dailyChecks: "study.dailyChecks.v1",
  manualPicks: "study.manualPicks.v1",
  observationChecks: "study.observationChecks.v1",
  archives: "study.archives.v1",
  manualCollections: "study.collections.v1",
  calibrations: "study.calibrations.v1",
} as const;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}
function saveJson(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function loadProfile(): StudentProfile | null {
  const p = loadJson<StudentProfile | null>(K.profile, null);
  if (!p || typeof p !== "object") return p;
  let patched = p as StudentProfile;
  if (!("termPhase" in (patched as object))) patched = { ...patched, termPhase: "in_term" as const };
  if (patched.termPhase === "preview" && !patched.previewUnits) {
    patched = { ...patched, previewUnits: { "语文": 1, "数学": 1, "英语": 1 } };
  }
  return patched;
}
export function saveProfile(p: StudentProfile) { saveJson(K.profile, p); }

export function loadDailyChecks(): Record<string, DayChecks> {
  return loadJson<Record<string, DayChecks>>(K.dailyChecks, {});
}
export function saveDailyChecks(m: Record<string, DayChecks>) { saveJson(K.dailyChecks, m); }

export function loadManualPicks(): Record<string, string[]> {
  return loadJson<Record<string, string[]>>(K.manualPicks, {});
}
export function saveManualPicks(m: Record<string, string[]>) { saveJson(K.manualPicks, m); }

export function loadObservationChecks(): Record<string, boolean> {
  return loadJson<Record<string, boolean>>(K.observationChecks, {});
}
export function saveObservationChecks(m: Record<string, boolean>) { saveJson(K.observationChecks, m); }

export function loadArchives(): Record<string, DayChecks[]> {
  return loadJson<Record<string, DayChecks[]>>(K.archives, {});
}
export function saveArchives(m: Record<string, DayChecks[]>) { saveJson(K.archives, m); }

export function loadCollections(): string[] {
  return loadJson<string[]>(K.manualCollections, []);
}
export function saveCollections(a: string[]) { saveJson(K.manualCollections, a); }

export function loadCalibrations(): Calibration[] {
  return loadJson<Calibration[]>(K.calibrations, []);
}
export function saveCalibrations(a: Calibration[]) { saveJson(K.calibrations, a); }

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

export function buildExport(): ExportPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: loadProfile(),
    calibrations: loadCalibrations(),
    dailyChecks: loadDailyChecks(),
    observationChecks: loadObservationChecks(),
    archives: loadArchives(),
    manualCollections: loadCollections(),
  };
}

export function doImport(payload: ExportPayload) {
  if (payload.version !== 1) throw new Error("不支持的导出版本");
  if (payload.profile) saveProfile(payload.profile as StudentProfile);
  if ((payload as any).calibrations) saveCalibrations((payload as any).calibrations);
  if (payload.dailyChecks) saveDailyChecks(payload.dailyChecks);
  if (payload.observationChecks) saveObservationChecks(payload.observationChecks);
  if (payload.archives) saveArchives(payload.archives);
  if (payload.manualCollections) saveCollections(payload.manualCollections);
}

export function archiveByGrade(gradeKey: string, checks: DayChecks[]) {
  const a = loadArchives();
  a[gradeKey] = [...(a[gradeKey] ?? []), ...checks];
  saveArchives(a);
}