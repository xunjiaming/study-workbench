# 设计方案：小学生学习辅导工作台（v2 可实施版）

> 文档状态：已更新（2026-08-20，新增 F13/F14）。与 REQUIREMENTS F1-F14 同步为 v2.1 增量基线；F13/F14 已纳入可实施范围。

## 0. 决策基线

- 真生成可用练习/口语（F7）：每日条目均为可直接照做的抄写/朗读/口算/口语，非模板占位。
- AI 草稿 + 人工审核、全年级全学科覆盖（F8/F2）：1-6 年级 × 5-6 学科，每池 ≥10 条，未审核不入库。
- 已完成可重复 + 活动库手工筛选加入（F9）：已完成不强制消失，筛新内容手工加入今日。
- 多设备在线访问、数据本地存储 + 手动导出导入、无账号云同步（F10/F12）。
- 本期不做孩子端（家长为主用户）。

---

## 1. 总体形态

单页应用，内容与渲染解耦，参照「伊伊早教工作台」分层：

`
学生档案层（Profile + GradeBand 映射）
  → 内容数据层（审核后内容池，年级×学科×主题）
    → 年级判定层（grade+semester → gradeKey）
      → 计划生成层（确定性抽取 + 已完成过滤 + 手工叠加）
        → 渲染层（左导航 + 右模块滚动）
          → 数据层（localStorage + IndexedDB，导出导入 JSON）
`

无后端、无账号；静态站点即可部署。新增“学段状态（假期预习/学期同步）”与“校准进度”两项轻量状态，不引入后端与账号。

---

## 2. 信息架构与路由

### 2.1 导航结构（左栏常驻，不收起）

| 路由 | 名称 | 职责 |
|---|---|---|
| `/` | 今日 | 当日计划（6 大模块）、打勾、再做一次、今日手工条目 |
| `/library` | 活动库 | 按年级×学科×主题筛选，预览条目，手工加入今日/收藏 |
| `/observation` | 学习观察 | 按年级的观察项打勾，跨年级归档回看 |
| `/profile` | 档案/设置 | 昵称、年级/学期、教材版本、时段、薄弱偏好、英语/素质开关（学段与校准已上移至顶部全局进度条） |
| `/me` | 我的 | 导出/导入 JSON（含校准历史）、归档浏览、使用说明 |

### 2.2 页面联动

- 今日页：左栏 6 模块锚点，点击滚动到右侧对应板块；顶部显示当前年级带与本周主题。
- 活动库 → 今日：手工加入后在今日顶部以“今日加入”分组展示，与自动条目同等打勾。
- 全局进度条（Layout 顶部 sticky，三科各一根）：预习态为三组“语文/数学/英语各步进 + mini 进度条（1-4）”，同步态为三组独立下拉（1-8 + 清除），学段切换带二次确认弹窗；档案/全局条变更均次日生效，旧记录与校准历史写入归档。档案页仅保留提示“进度在顶部全局条调整”。

---

## 3. 数据模型（定稿）

### 3.1 StudentProfile

`ts
type Semester = "上" | "下";
type TermPhase = "preview" | "in_term";
type TextbookVersion = "人教版" | "北师大版" | "苏教版" | "其他";
interface StudentProfile {
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
  updatedAt: string;
}
interface Calibration {
  subject: "语文" | "数学" | "英语";
  currentUnit: number;
  updatedAt: string;
}
`

> 一升二示例：grade=1, termPhase=preview, previewTargetGrade=2, schoolStartDate=2026-09-01；开学切 termPhase=in_term 后次日即按二上同步逻辑生成。
`

### 3.2 GradeBand

`ts
interface GradeBand {
  key: string;
  grade: number;
  name: string;
  semesterFocus: string;
  dailyMinutes: { chinese: number; math: number; english: number; sports: number; quality: number };
}
`

### 3.3 ContentEntry（内容池原子）

`ts
type Subject = "语文" | "数学" | "英语" | "运动健康" | "素质劳动" | "观察提醒";
interface ContentEntry {
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
`

入库门槛：reviewed===true 且 materials/how/duration/safety 非空且时长 ≤20 分钟ï¼preview 条目额外满足 unit 1-4 且时长 ≤15 分钟。

### 3.4 DailyPlan / DailyModule

`ts
interface DailyModule {
  moduleKey: "chinese" | "math" | "english" | "sports" | "quality" | "observation";
  title: string;
  items: ContentEntry[];
}
interface DailyPlan {
  date: string;
  gradeKey: string;
  weekTheme: string;
  modules: DailyModule[];
  manualItems: ContentEntry[];
}
`

### 3.5 TaskCheck（打勾与手工选择）

`ts
interface DayChecks {
  date: string;
  checks: Record<string, boolean>;
  manualPicks: string[];
  repeatable: true;
}
`

### 3.6 ObservationItem

`ts
interface ObservationItem {
  id: string;
  gradeKey: string;
  category: "专注力"|"读写姿势"|"阅读习惯"|"作业效率"|"错题整理"|"情绪状态";
  label: string;
}
`

### 3.7 本地存储键与版本

| 键 | 存储 | 结构 |
|---|---|---|
| `study.profile.v1` | localStorage | StudentProfile |
| `study.gradeBands.v1` | localStorage（预置只读） | GradeBand[] |
| `study.contentPool.v1` | localStorage（预置只读，打包时注入） | ContentEntry[] |
| `study.dailyChecks.v1` | localStorage | Record<date, DayChecks> |
| `study.manualPicks.v1` | localStorage | Record<date, string[]> |
| `study.observationChecks.v1` | localStorage | Record<id, boolean> |
| `study.calibrations.v1` | localStorage | Calibration[]（按学科当前单元，次日生效，可撤销） |
| `study.archives.v1` | localStorage | { gradeKey: DayChecks[] }[] |
| `study.audio` | IndexedDB store audio | { id, blob, name } |

版本策略：键后缀 .v1 固定；结构变更时新增 .v2 并在启动时做一次性迁移。新增 termPhase/previewTargetGrade/schoolStartDate 时对旧 profile 做默认值回填（termPhase=in_term）。

---

## 4. 年级划分与模块配额（含预习态）

> 预习态配额：二上预习包为目标年级上学期前4单元预热版，日总量20-30分钟，单学科10-15分钟；学期同步态恢复下表常态。

| 年级 | 关键侧重 | 日配额 |
|---|---|---|
| 一年级 | 习惯奠基 · 拼音与识字 · 百以内 | 语文3/数学2/英语2/运动2/素质2/观察2 |
| 二年级 | 写话起步 · 表内乘除 · 独立阅读 | 语文3/数学3/英语3/运动2/素质2/观察2 |
| 三年级 | 独立阅读 · 英语起步 · 应用题 | 语文3/数学3/英语3/运动2/素质2/观察2 |
| 四年级 | 读写深化 · 小数分数 · 分析 | 语文3/数学3/英语3/运动2/素质2/观察2 |
| 五年级 | 阅读策略 · 多步运算 · 表达 | 语文3/数学3/英语3/运动2/素质2/观察2 |
| 六年级 | 综合运用 · 复习规划 · 过渡 | 语文3/数学3/英语3/运动2/素质2/观察3 |

周主题（固定循环）：阅读周、口算周、词汇积累周、表达周、科普实验周、劳动生活周、复盘周。

---

## 5. 计划生成算法（确定性，含预习与校准）

### 5.1 输入

- profile.grade / semester / termPhase / previewTargetGrade / schoolStartDate → gradeKey + 模式判定
- calibrations（按学科当前单元，容差 ±1 周）
- date（本地 YYYY-MM-DD）
- 内容池（已审核子集，含 preview/unit/term 标签）

### 5.2 伪代码

`ts
function getWeekTheme(date: string): string {
  const week = isoWeekNumber(date);
  return THEMES[week % THEMES.length];
}
function deterministicPick(pool, count, seed) {
  const n = pool.length;
  const start = ((seed % n) + n) % n;
  return Array.from({length: count}, (_, i) => pool[(start + i) % n]);
}
function resolveGradeKey(profile) {
  if (profile.termPhase === "preview" && profile.previewTargetGrade) return "g" + profile.previewTargetGrade;
  return "g" + profile.grade;
}
function applyPreviewFilter(pool, profile) {
  if (profile.termPhase !== "preview") return pool;
  return pool.filter(c => c.preview && c.unit && c.unit <= 4);
}
function applyCalibrationWeight(pool, calibrations, subject) {
  const cal = calibrations.find(c => c.subject === subject);
  if (!cal) return pool;
  return pool
    .map(c => ({ c, w: c.unit == null ? 1 : c.unit < cal.currentUnit ? 0.5 : c.unit === cal.currentUnit ? 2 : 0.3 }))
    .sort((a,b) => b.w - a.w)
    .map(x => x.c);
}
function buildDailyPlan(profile, date, calibrations = loadCalibrations()) {
  const gradeKey = resolveGradeKey(profile);
  const weekTheme = getWeekTheme(date);
  const dayIndex = daysSinceSemesterStart(date, profile.semester);
  const manualIds = loadManualPicks(date);
  const isPreview = profile.termPhase === "preview";
  const modules = MODULES.map(m => {
    let pool = contentPool.filter(c => c.gradeKey===gradeKey && c.subject===m.subject && c.reviewed);
    if (m.subject === "素质劳动" && !profile.enableQuality) return null;
    if (m.subject === "英语" && !profile.enableEnglish) return null;
    pool = isPreview ? applyPreviewFilterBySubject(pool, profile.termPhase, m.subject, profile.previewUnits) : pool;
    pool = applyCalibrationWeight(pool, calibrations, m.subject);
    pool = preferUncompleted(pool, date);
    const quota = isPreview ? Math.min(m.quota, 2) : m.quota;
    const offset = MODULE_OFFSET[m.moduleKey];
    const items = deterministicPick(pool, quota, dayIndex + offset);
    return { moduleKey: m.moduleKey, title: m.title, items };
  }).filter(Boolean);
  const manualItems = manualIds.map(id => contentPool.find(c=>c.id===id)).filter(Boolean);
  return { date, gradeKey, weekTheme, termPhase: profile.termPhase, calibrations, modules, manualItems };
}
`

### 5.3 规则

- 同一天、同年级（含预习目标年级）、同周主题、同校准进度的自动部分必相同；手工部分按 localStorage 叠加。
- 已完成过滤仅改变排序偏好，不改变确定性；已完成仍可“再做一次”。
- 手工加入次日不自动携带，需家长再次加入。
- 预习态：三科各 1-4 独立进度，内容仅来自 preview + unit<=该科进度 的预热池，日配额每模块≤2，总量 20-30 分钟；同步态与预习态切换需二次确认。
- 同步态：校准后已教单元权重转巩固、正在学单元权重提升、未教单元仅轻量预习或不出现；校准变更次日生效。

---

## 6. 内容生产与审核流水线（SOP）

### 6.1 AI 草稿边界

- 输入：年级大纲要点 + 学科 + 单元 + 预习/同步标记 + 时长 10-20 分钟（预习 10-15 分钟）+ 家庭实物优先。
- 输出字段必须齐全：title/materials/how/duration/safety，且 how 可直接照做。
- 禁止：整册搬运版权教材、超纲超量、依赖屏幕刷题、含风险操作。

### 6.2 人工审核清单（逐条打勾）

- [ ] 贴合教材节奏与年级难度
- [ ] 时长 10-20 分钟可落地
- [ ] 材料为家庭常见实物/文具/书本
- [ ] 步骤清晰，家长无需二次编写
- [ ] 安全提示完整，无风险操作
- [ ] 版权合规，未搬运整册题目
- [ ] 语言温和，无施压/排名表述

仅全部通过的条目标记 reviewed=true 进入打包。

### 6.3 规模与打包

- 6 年级 × 5-6 学科 × ≥10 条 ≈ 300-400 条起步；后续按需扩至每池 20-30 条。
- 预习包：目标年级上学期前 4 单元，每单元 ≥3 条 preview 条目，时长 10-15 分钟，玩法偏绘本/口算卡/实物。
- 内容池以 JSON 随前端打包发布，更新即发版，无需改代码。教材分版真题存于 `frontend/src/data/curriculum/`，按版本与单元组织，`contentPool` 合并后由 `plan` 按 `profile.textbook` 过滤；`Today/Library` 摊开 `detail` 明细并提供教材筛选与打印样式。

---

## 7. 交互与视觉（概要）

- 顶部全局进度条（sticky）：暖粉 baby-education 风格（--primary #ff6b9d / --line #ffe0ec / --radius 16px），预习态三组步进+mini进度条，同步态三组下拉+清除；切换学段二次确认弹窗。
- 左栏：常驻 5 项导航，彩色图标 + 文字，宽度 200-240px，不收起。
- 右区：6 模块纵向堆叠，每模块卡片式，标题 + 条目列表；条目含标题、时长、材料、玩法、左侧复选框。
- 状态：未完成/已完成（勾选态）、今日加入（高亮分组）、可跳过/明日再补。
- 空状态：活动库无结果时提示“试试换个年级或主题”；手工加入后轻量 toast。
- 响应式：移动端左栏收为底部 Tab，右区单列滚动。

---

## 8. 存储、导入导出与归档

导出 JSON 含 version/profile（含 termPhase/previewTargetGrade/schoolStartDate/previewUnits 三科各1-4）/calibrations/dailyChecks/observationChecks/archives/manualCollections；导入时校验并合并，失败保留原数据。升年级与学段切换（预习→同步）时上一阶段 dailyChecks 按 gradeKey+term 归档；校准历史与预习记录纳入导出。

---

## 9. 技术栈与工程

- 前端：React 19 + Vite + TypeScript + PWA（vite-plugin-pwa）
- 语音：Web Speech API + IndexedDB（study.audio）
- 部署：GitHub Pages 首选，Actions 发布
- 质量：单文件 ≤500 行，目录深度 ≤3

---

## 10. 分阶段落地（细化）

| 阶段 | 目标 | 完成标志 |
|---|---|---|
| A 冻结 | 需求与方案 v2 冻结 | 三处口径一致，评审通过 |
| B 基座 | 档案与年级判定 + 布局 + 生成算法 | 同年级同日生成稳定，档案切换次日生效 |
| C 内容 | 全量内容池建设与审核入库 | 1-6 年级各学科可筛可加可打勾，抽检 20 条可用性 100% |
| D 上线 | PWA 与多设备闭环 | 三端可访问，导出导入往返不丢数据（含校准历史） |
| E 预习与校准 | 假期预习包 + 学期校准闭环 | 一升二暑假可预习二上，开学按校内进度重排次日计划 |

---

## 11. 验收映射（对 REQUIREMENTS 第 6 章）

| 验收项 | 设计落位 | 验证方式 |
|---|---|---|
| 年级自适应次日生效 | 映射与归档（含预习目标年级） | 改年级后次日 plan.gradeKey 变化；预习态 gradeKey 为目标年级 |
| 同日同年级结果稳定 | deterministicPick（含校准快照） | 同参两次 buildDailyPlan id 相等；同校准结果同日稳定 |
| 真生成可用 | 字段与审核清单 | 抽检条目 materials/how 齐全且可照做 |
| 全量覆盖且已审核 | 每池≥10 且 reviewed | 统计 contentPool 按 gradeKey×subject 分组计数 |
| 已完成复用+手工选 | manualPicks 叠加 | 打勾可取消重做；活动库加入后持久化 |
| 多设备在线+导入导出 | 静态部署+JSON 往返（含校准） | 三端访问 + 导出导入数据一致，校准历史不丢 |
| 预习衔接 | F13 预习包（三科各1-4全局条） | 开启预习到二上后三科各拨 1-4，次日计划仅含对应 unit 且活动库可筛预习标签 |
| 进度校准 | F14 全局条三科独立校准(1-8)+二次确认 | 三科各校准到第2单元后次日计划第1单元转巩固、第3单元不提前；全局条可清除 |
| 无账号云同步 | 本机存储 | 无登录入口，无云端写入 |

---

## 12. 风险与回滚

| 风险 | 缓解 | 回滚 |
|---|---|---|
| 内容与学校进度失配 | 教材版本字段 + 校准进度（F14）+ 手工替换 | 活动库覆盖 + 校准回退到默认进度 |
| 版权 | 不搬整册 + 人工合规审 | 下架争议条目，重发内容池 |
| 规模压力（300+ 条） | AI 草稿提效但坚持审核门禁 | 分批入库，先每池 10 条 |
| 数据丢失 | 本机 + 导出提醒 | 导入备份恢复 |
| 施压感 | 每条“可跳过/明日再补”，无排名 | 文案回退 |

---

## 13. 附录

- ID 规范：g{grade}-{subjectPinyin}-{themePinyin}-{seq:03d}
- 主题枚举：阅读、口算、词汇、表达、科普实验、劳动生活、复盘
- 周主题可配置：THEMES 数组替换即生效，按生成时主题快照存储 weekTheme。
- 校准与预习开关：termPhase/previewTargetGrade/schoolStartDate/previewUnits/calibrations 变更均次日生效（含全局条三科独立进度）；导出导入与归档均包含校准历史与预习进度。

> 本方案与 docs/REQUIREMENTS.md F1-F14 一致（2026-08-20 增量）；改动需同步更新 REQUIREMENTS 与 README。
