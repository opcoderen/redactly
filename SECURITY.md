# 安全策略（SECURITY.md）

## 报告漏洞

请勿在公开 issue 中描述可被利用的细节。

- 优先方式：GitHub Security Advisories（仓库页 → Security → Report a vulnerability）
- 备选：见仓库主页联系方式

预期 72 小时内确认，7 天内给出评估与修复计划。

## 范围

**在范围内：**

- 任何导致图片或识别结果离开浏览器的路径（新增外发请求、CSP 被绕过等）
- Docker 镜像 / nginx 配置中的安全问题（头缺失、目录穿越、缓存投毒）
- 依赖供应链（vendor 清单中的 sha256 与实际不符）

**不在范围内：**

- 单文件版（`standalone/`）没有 CSP。这是已知取舍，README 与 PRIVACY 里都写明了
- 浏览器自身的漏洞
- 需要物理接触设备的攻击

## 设计上的约束

- 部署版的 CSP 是 `connect-src 'self'`，新增外发请求会在浏览器这一层直接失败，等于一改就坏，CI 和代码评审都会拦下
- `vendor/manifest.json` 记录每个依赖文件的来源 URL 与 sha256，`scripts/fetch-vendor.mjs` 每次构建输出实际哈希
- nginx 容器只读运行（`read_only: true` + tmpfs），无新增特权

## 依赖更新

模型与引擎文件通过 jsdelivr / projectnaptha 获取，版本固定在 `scripts/fetch-vendor.mjs` 中。升级依赖时请同步更新 `THIRD_PARTY_NOTICES.md` 与 manifest。
