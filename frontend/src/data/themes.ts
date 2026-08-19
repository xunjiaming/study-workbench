export const WEEK_THEMES = ["阅读周","口算周","词汇积累周","表达周","科普实验周","劳动生活周","复盘周"] as const;

export function isoWeekNumber(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((+d - +jan4) / 86400000) + 1 + (jan4.getDay() === 0 ? 6 : jan4.getDay() - 1);
  return Math.ceil(dayOfYear / 7);
}

export function weekThemeOf(dateStr: string): string {
  const w = isoWeekNumber(dateStr);
  return WEEK_THEMES[w % WEEK_THEMES.length];
}

export const MODULES = [
  { moduleKey: "chinese" as const, title: "语文积累", subject: "语文" as const, quota: 3 },
  { moduleKey: "math" as const, title: "数学思维", subject: "数学" as const, quota: 3 },
  { moduleKey: "english" as const, title: "英语积累", subject: "英语" as const, quota: 3 },
  { moduleKey: "sports" as const, title: "运动与健康", subject: "运动健康" as const, quota: 2 },
  { moduleKey: "quality" as const, title: "素质与劳动", subject: "素质劳动" as const, quota: 2 },
  { moduleKey: "observation" as const, title: "学习观察", subject: "观察提醒" as const, quota: 2 },
];

export const MODULE_OFFSET: Record<string, number> = {
  chinese: 0, math: 7, english: 14, sports: 21, quality: 28, observation: 35,
};
