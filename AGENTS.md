# study-workbench 项目级规则

本项目已进入实现阶段，按 2026-08-19 冻结的需求与方案（F1-F12 / DESIGN v2）实施。

## 协作约定

- 遵循 `D:\\workflow\\dev-workflow` 的五段式工作流与结论字段约定（`implementation_status` / `verification_status` / `release_readiness`）。
- 实现阶段按 DESIGN v2 可实施版落地代码，改动需求或方案时必须同步更新「需求框架」「方案草案」与「README」三处一致性。
- 新增必须交付的文档时，先在本文档「文档清单」登记。

## 文档清单

| 产物 | 路径 | 现状 |
|---|---|---|
| 项目入口说明 | `README.md` | 已更新（实现阶段，已可用） |
| 项目级规则 | `AGENTS.md` | 本文档 |
| 需求框架 | `docs/REQUIREMENTS.md` | 已冻结（2026-08-19，F1-F12） |
| 方案草案 | `docs/DESIGN.md` | 已冻结（2026-08-19，v2 可实施版） |
| 前端应用 | `frontend/` | 已实现（Vite + React + PWA，534 条内容池） |
| 部署流水线 | `.github/workflows/deploy.yml` | 已更新（前端构建 + Jekyll 发布） |

## 修改约束

- 需求框架与方案草案属于业务口径，改动前应先明确改动原因与影响面，避免反复漂移。
- 不保留 `TODO` / `FIXME` 类未关联 Issue 的悬空标注；确有必要时格式为 `TODO(#编号): ...`。
