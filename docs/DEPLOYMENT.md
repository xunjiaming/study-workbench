# 部署与发布手册

> 适用于本项目的 GitHub Pages 双产物发布：Jekyll 文档站 + Vite SPA 工作台。
> 本手册为 2026-08-20 `study-workbench/app/` 404 故障的复盘沉淀，后续发布前按此清单自检。

## 1. 架构约定

- 仓库名：`study-workbench`，GitHub Pages 基路径：`/study-workbench/`。
- 文档站（Jekyll）：根路径 `/study-workbench/`，由 `_config.yml` + `index.md` + `docs/` 构建，目标 `_site/`。
- 工作台（Vite + React + PWA）：子路径 `/study-workbench/app/`，源码 `frontend/`，构建产物 `frontend/dist/`，发布后位于 `_site/app/`。
- 发布流水线：`.github/workflows/deploy.yml` — 先构建前端，再构建 Jekyll，最后把 `dist` 注入 `_site/app`，统一 `upload-pages-artifact` 发布。

## 2. 本次 404 的三类根因

| 序号 | 现象 | 根因 | 修复 |
|---|---|---|---|
| 1 | `/app/` 404 且线上仍为旧页（`尚未进入代码开发`） | Jekyll 渲染了 `frontend/node_modules/react-router/docs` 数千个 md，导致构建极慢/失败，发布从未生效 | `_config.yml` 增加 `exclude`；流水线在 Jekyll 前 `rm -rf frontend/node_modules` |
| 2 | 即使 `index.html` 存在也会白屏/资源 404 | `vite.config.ts` `base: "/study-workbench/"` 与实际发布路径 `/study-workbench/app/` 不一致 | `base: "/study-workbench/app/"`，本地 `npm run build` 后校验 `dist/index.html` 含 `/study-workbench/app/assets/` |
| 3 | 刷新子路由 404，`/library` 等直接访问失败 | `react-router-dom` `BrowserRouter` 未设 `basename` | `createBrowserRouter(routes, { basename: "/study-workbench/app" })` |
| 4 | Jekyll 产物属主为 `root`，后续注入失败 | `actions/jekyll-build-pages` 生成的 `_site` 为 `root` 属主，`mkdir _site/app` 权限不足 `Permission denied` | 注入步骤改用 `sudo mkdir/cp/touch/chown -R $USER:$USER _site` |

## 3. 正确配置快照

### 3.1 `frontend/vite.config.ts`
```ts
export default defineConfig({
  base: "/study-workbench/app/",
  // ...
});
```

### 3.2 `frontend/src/router.tsx`
```ts
export const router = createBrowserRouter(routes, { basename: "/study-workbench/app" });
```

### 3.3 `_config.yml`
```yaml
baseurl: /study-workbench
exclude:
  - frontend/node_modules
  - frontend/src
  - frontend/dist
  - node_modules
```

### 3.4 `.github/workflows/deploy.yml` 关键步骤
```yaml
- name: Build frontend
  run: cd frontend && npm ci && npm run build
- name: Remove node_modules before Jekyll build
  run: rm -rf frontend/node_modules
- uses: actions/jekyll-build-pages@v1
  with: { source: ./, destination: ./_site }
- name: Copy frontend dist and add SPA fallback
  run: |
    sudo mkdir -p _site/app
    sudo cp -r frontend/dist/* _site/app/ 2>/dev/null || true
    sudo cp _site/app/index.html _site/app/404.html 2>/dev/null || true
    sudo touch _site/.nojekyll 2>/dev/null || true
    sudo chown -R $USER:$USER _site 2>/dev/null || true
```

## 4. 发布前自检清单

1. 本地 `cd frontend && npm run build` 通过，且 `dist/index.html` 含正确 `base` 路径。
2. `_config.yml` 的 `exclude` 已覆盖 `frontend/node_modules`（新增前端依赖后复核）。
3. `router` 已设 `basename` 与 `vite.base` 一致。
4. `deploy.yml` 注入 `_site/app` 的步骤使用了 `sudo`/`chown`（或等价授权）。
5. 新增 SPA 页面后，`_site/app/404.html` 回退仍被拷贝（`BrowserRouter` 直接刷新依赖此文件）。
6. 推送后在 `Actions > Deploy to GitHub Pages` 确认绿勾，再硬刷线上 `https://xunjiaming.github.io/study-workbench/app/`。

## 5. 线上验证

```bash
curl -sI https://xunjiaming.github.io/study-workbench/app/ | head -5
# 预期 HTTP/2 200
curl -s https://xunjiaming.github.io/study-workbench/app/ | grep -o "/study-workbench/app/assets/[^\"']*"
```

- `/study-workbench/` 应不再显示 `尚未进入代码开发`，而是显示 `打开工作台` 链接。
- `/study-workbench/app/` 及其子路由刷新均应正常，资源路径均为 `/study-workbench/app/assets/`。

## 6. 常见坑位

- 新增前端依赖后忘记更新 `_config.yml` 的 `exclude`，Jekyll 会再次扫描 `node_modules`。
- `vite base` 与 `basename` 仅改一处会导致一侧 404，须同步。
- 若切换到 `upload-pages-artifact` 的 `path` 模式，需确保 `_site/app/404.html` 仍被上传。