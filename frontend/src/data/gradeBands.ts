import type { GradeBand } from "../lib/types";

export const GRADE_BANDS: GradeBand[] = [
  { key: "g1", grade: 1, name: "一年级", semesterFocus: "习惯奠基 · 拼音与识字 · 百以内", dailyMinutes: { chinese: 20, math: 15, english: 10, sports: 15, quality: 15 } },
  { key: "g2", grade: 2, name: "二年级", semesterFocus: "写话起步 · 表内乘除法 · 绘本阅读", dailyMinutes: { chinese: 20, math: 20, english: 15, sports: 15, quality: 15 } },
  { key: "g3", grade: 3, name: "三年级", semesterFocus: "独立阅读 · 英语起步 · 应用题", dailyMinutes: { chinese: 20, math: 20, english: 15, sports: 15, quality: 15 } },
  { key: "g4", grade: 4, name: "四年级", semesterFocus: "读写深化 · 小数分数 · 分析", dailyMinutes: { chinese: 20, math: 20, english: 15, sports: 15, quality: 15 } },
  { key: "g5", grade: 5, name: "五年级", semesterFocus: "阅读策略 · 多步运算 · 表达", dailyMinutes: { chinese: 20, math: 20, english: 15, sports: 15, quality: 15 } },
  { key: "g6", grade: 6, name: "六年级", semesterFocus: "综合运用 · 复习规划 · 过渡", dailyMinutes: { chinese: 20, math: 20, english: 15, sports: 15, quality: 15 } },
];

export function gradeKeyOf(grade: number): string { return `g${grade}`; }
