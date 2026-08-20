# 小学生学习辅导工作台

面向小学生的个性化学习辅导计划工具，参考「伊伊早教工作台」的产品范式：家长在首次使用时设置孩子就读年级，系统按年级与日期自动生成可落地、可勾选、不施压的每日学习辅导计划。

## 阶段状态

- \implementation_status：\implemented（已按 v2 实现基座与全量内容，本地构建通过）
- \erification_status：\erified（本地 build 通过，待部署后三端验收）
- elease_readiness：eady_for_preview（可预览，部署后验收即可发布）

本项目的权威口径以 \docs/REQUIREMENTS.md（需求框架 F1-F14，2026-08-20 增量）与 \docs/DESIGN.md（方案草案 v2.1 增量）为准。

## 已冻结决策（2026-08-19 基线 + 2026-08-20 增量）

- 真生成可用的练习/口语内容（非仅模板）。
- 内容生产采用 AI 草稿 + 人工审核，覆盖 1-6 年级全学科。
- 任务支持已完成重复做，筛新内容由家长在活动库手工选择。
- 多设备通过在线链接访问，数据本地存储 + 手动导出导入，无账号/云同步。
- 本期不做孩子端，以家长为主用户。
- 新增假期预习模式（F13，三科各 1-4 独立预习进度）与学期进度校准（F14，三科各 1-8 全局条校准 + 二次确认），均以顶部 sticky 全局进度条呈现（baby-education 暖粉风格），次日生效。

## 文档索引

- [需求框架](docs/REQUIREMENTS.md)：F1-F14、学习原则、验收框架、决策冻结记录。
- [方案草案 v2.1](docs/DESIGN.md)：信息架构与路由、数据模型定稿、计划生成算法、内容流水线 SOP、技术栈与分阶段落地、验收映射。

## 在线访问

- 工作台：https://xunjiaming.github.io/study-workbench/app/ （PWA，已可用，GitHub Pages）
- 需求与方案：https://xunjiaming.github.io/study-workbench/
- 仓库：https://github.com/xunjiaming/study-workbench
- 部署方式：GitHub Pages + GitHub Actions（前端 Vite 构建 + Jekyll 文档）。

## 与相邻子项目的关系

- \aby-education：面向 0-3 岁宝宝的早教工作台，本项目的产品范式来源。
- \ducation-platform：面向机构的 B2C/B2B 教育业务平台（课程、订单、作业、题库），不属于本项目范围。
- \dev-workflow：代码项目从需求到交付的通用工作流规范，本项目遵循其五段式处理与结论字段约定。
