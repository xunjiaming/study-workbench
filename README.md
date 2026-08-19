# 小学生学习辅导工作台

面向小学生的个性化学习辅导计划工具，参考「伊伊早教工作台」的产品范式：家长在首次使用时设置孩子就读年级，系统按年级与日期自动生成可落地、可勾选、不施压的每日学习辅导计划。

## 阶段状态

- `implementation_status`：`not_started`（本期只做需求与方案，未进入代码开发）
- `verification_status`：`not_applicable`（暂无代码产物可验证）
- `release_readiness`：`not_ready`

本项目的权威口径以 `docs/REQUIREMENTS.md`（需求框架）与 `docs/DESIGN.md`（方案草案）为准。两者均为“待讨论、待冻结”的框架，不表示已经开发。

## 文档索引

- [需求框架](docs/REQUIREMENTS.md)：项目定位、目标用户、年级自适应、每日模块、学科内容池、学习原则、非目标与验收框架。
- [方案草案](docs/DESIGN.md)：总体形态、数据模型初稿、内容生成思路、技术选型方向与分阶段落地计划。

## 在线访问

- 线上地址：https://xunjiaming.github.io/study-workbench/
- 仓库：https://github.com/xunjiaming/study-workbench
- 部署方式：GitHub Pages + GitHub Actions。当前仅发布需求与方案文档，App 开发完成后切换为工作台。

## 与相邻子项目的关系

- `baby-education`：面向 0-3 岁宝宝的早教工作台，本项目的产品范式来源。
- `education-platform`：面向机构的 B2C/B2B 教育业务平台（课程、订单、作业、题库），不属于本项目范围。
- `dev-workflow`：代码项目从需求到交付的通用工作流规范，本项目遵循其五段式处理与结论字段约定。
