# study-workbench 项目级规则

本项目已进入实现阶段，按 2026-08-19 冻结基线 + 2026-08-20 增量（F1-F14 / DESIGN v2.1）实施。

## 协作约定

- 遵循 `D:\workflow\dev-workflow` 的五段式工作流与结论字段约定（`implementation_status` / `verification_status` / `release_readiness`）。
- 实现阶段按 DESIGN v2.1 可实施版落地代码，改动需求或方案时必须同步更新「需求框架」「方案草案」与「README」三处一致性。
- 新增必须交付的文档时，先在本文档「文档清单」登记。

## 文档清单

| 产物 | 路径 | 现状 |
|---|---|---|
| 项目入口说明 | `README.md` | 已更新（实现阶段，已可用） |
| 项目级规则 | `AGENTS.md` | 本文档 |
| 需求框架 | `docs/REQUIREMENTS.md` | 已更新（2026-08-20，F1-F14，新增 F13/F14） |
| 方案草案 | `docs/DESIGN.md` | 已更新（2026-08-20，v2.1，含预习与校准设计） |
| 前端应用 | `frontend/` | 已实现（Vite + React + PWA，534 条内容池） |
| 部署流水线 | `.github/workflows/deploy.yml` | 已修复（Jekyll 排除+sudo 注入+SPA 回退） |
| 部署手册 | `docs/DEPLOYMENT.md` | 新增（2026-08-20 404 复盘沉淀，发布前必检） |

## 修改约束

- 需求框架与方案草案属于业务口径，改动前应先明确改动原因与影响面，避免反复漂移。
- 不保留 `TODO` / `FIXME` 类未关联 Issue 的悬空标注；确有必要时格式为 `TODO(#编号): ...`。

## 质量红线（2026-08-20 复盘沉淀，后续改动不得重犯）

> 来源：假期预习/学期校准/多版本教材/去重/随机出题/观察对齐等 6 轮返工复盘。新增内容均需通过“构建 + 池子去重 + 预览/校准对齐”三检后再推。

### 1. 内容池去重与题干一致性
- `frontend/src/data/contentPool.ts` 禁止跨 `subject|theme` 复用 `how/materials`：`运动健康` 4 主题（跳绳/球类/眼保健操/作息）、`素质劳动` 4 主题（家务/手工/实验/兴趣）、`观察提醒` 6 维度、`语文朗读/阅读/表达`、`数学应用题/思维/生活数学`、`英语口语/绘本` 必须各主题独立话术，同一 `subject|theme` 内去重数 ≥3（`gHow` 式 4 句轮播）。
- 标题与做法必须同主题：如 `跳绳·2年级第07练` 不得为“眼保健操”、 `球类` 不得为“跳绳1分钟×2”。`title/theme/how` 三者一致才算合规。
- 校验：改池后必须跑 `subject|theme -> how` 去重统计（见 `dup-check` 脚本），`10以内/20以内` 等与年级不符的占位为 0。

### 2. 数学不做固定重复题，按题型随机（种子确定）
- `frontend/src/lib/plan.ts` 数学必须经 `patchMathEntries` + `genProblems` 按年级/题型种子随机：`dateStr|grade|id|index` 作 `mulberry32` 种子，同日同题稳定、跨日必变。
- g2 口算题型池：长度单位/100以内两数加减/乘法/三数连加/情境题；g1 10以内、g3 时分秒/混合运算等按年级独立池。`how` 文案同步改为“按题型随机出N题”而非固定题干。
- 禁止直接写死 6 题固定 `problems` 复用多条；审核时抽 3 天同 `id` 题面必须不同。

### 3. 预习过滤：当前单元优先（B 方案），不做 `<=` 混排
- `applyPreviewFilter` 禁止 `unit <= maxUnit` 全量混排。实现为 `cur = unit==maxUnit` 置顶、`old = unit<maxUnit` 垫后，`[...cur, ...old]`；U2 时首条必 U2，第二条才可能回捡 U1。
- 同步态已为加权 `当前2 : 已学0.5 : 未学0.3`，预习不再二次重巩固。
- 效果：`U1→仅U1`、`U2→首条必U2`、`quota=2` 不出现 1-4 全混。

### 4. 观察提醒必须与学段进度对齐，不跟日历
- `观察提醒` 模块禁止 `deterministicPick(pool, quota, dayIndex)`。预习态 `cu = max(previewUnits)` → `start=(cu-1)*2` 连续取 2 条；同步态有校准则按 `currentUnit` 同逻辑，无校准则回退日历。
- 验收：预习三科 U1 时观察必为 `专注力·2年级第01/02练`，不得跳到 06/07。

### 5. 预习真题化与教材分版摊开
- `frontend/src/data/contentPool.ts` 所有 `preview:true` 条目必须带 `textbook:"人教版"`（或按档案版本）+ `detail`（语文 `chars[pinyin,words]` / 数学 `problems[q,a]` / 英语 `vocab[en,cn,sentence]`），`12/12` 覆盖。
- `frontend/src/data/curriculum/index.ts` 为真题源，`CONTENT_POOL` 末尾 `for...push(CURRICULUM_ENTRIES)` 合并；`plan.ts` 按 `profile.textbook` 分科过滤 `matchesTextbook`，无匹配回退通用池但优先 `withDetail`。
- 标题形态：`识字·预习 人教二上U1 塘/脑/...` / `英语·预习 ... pen/book` / `长度单位·人教二上U1` 可与教材比对。

### 6. 部署与渲染基线（404 复盘）
- `frontend/vite.config.ts` `base=/study-workbench/app/`、`router basename`、`_config.yml` 排除 `frontend/node_modules`、`deploy.yml` 必须 `sudo mkdir -p _site/app && cp -r frontend/dist/* _site/app/ && cp 404.html && touch .nojekyll` 三件套。
- `Today` 空态 `href -> Link to=/profile`，避免带 `basename` 404。

### 7. 提交前必检
- `npm run build --prefix frontend`（37 modules）通过
- 池子去重统计 + 预览 `detail` 覆盖率 12/12 + 观察对齐脚本（U1→01/02）通过
- 文档三处一致：`docs/REQUIREMENTS.md`（F1-F14）+ `docs/DESIGN.md`（v2.1）+ `README.md` 口径同步

