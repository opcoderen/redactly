<div align="center">

# 隐码 Redactly

在浏览器里给图片打码。图片不上传，也没有服务器能收到它。

识别手机号、身份证、银行卡、发票号、姓名和人脸，盖色块、马赛克或笑脸。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: Local-only](https://img.shields.io/badge/Privacy-local%20only-45d09e)](PRIVACY.md)
[![Docker](https://img.shields.io/badge/docker-opcoderen%2Fredactly-2496ED)](https://hub.docker.com/r/opcoderen/redactly)
[![Deploy](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020)](#部署到-cloudflare-pages)

</div>

---

## 它做什么

身份证、病历、登机牌、发票这类图片，扔进在线工具之前值得先想一下它的去向。多数打码网站的做法是传到服务器处理完再传回来，中间那一份留在哪、留多久，用户看不到。

Redactly 没有这一步。OCR、人脸检测、打码、导出都在浏览器的 WebAssembly 里跑，整站没有后端、没有数据库、也没有埋点，代码里不存在「上传」这个动作。

页面的 CSP 写死 `connect-src 'self'`，浏览器会直接拦掉越界的请求。所以这件事不依赖谁的口头保证，改坏了也发不出去。

### 自己验证

打开开发者工具，Network 面板，传一张图，点「识别」。除了同源的模型文件，请求列表里不会有其他域名。

## 能打什么

| 类别 | 内容 |
|---|---|
| 号码 | 手机号、身份证、座机、邮箱、银行卡（Luhn 校验）、发票号、统一社会信用代码、客票号、金额、日期、护照机读码（MRZ）、车牌 |
| 单据标签 | 「门诊号 / 病历号 / 检查号 / 快递单号」等 30 多个标签，命中后打它右侧或下方的值 |
| 姓名 | 「姓名：」后面的中文名，或登机牌上的拼音（`ZHANG SAN`） |
| 人脸 | 本地 tiny_face_detector，检出后自动盖笑脸，也能手动贴 |
| 工具 | 色块、马赛克、模糊、隐藏（背景色填充）、画笔、笑脸。块可以拖动、拉角缩放、换样式、撤销 |
| 格式 | 常见图片、iPhone HEIC、PDF（按页处理）。超过 2000px 的大图先降采样再识别 |
| 离线 | Docker 镜像里带着全部模型，内网、断网环境都能跑 |

## 快速开始

### Docker

```bash
docker run -d -p 8080:80 --name redactly opcoderen/redactly
# 打开 http://localhost:8080
```

也可以 `docker compose up -d`，仓库自带 `compose.yaml`，容器只读、无新增权限。镜像约 90MB，其中 41MB 是模型文件，运行期不访问外网。

纯静态项目套一层 Docker，看着是多余的动作。这个镜像面向的是另一类场景：单位不允许访问外部网站，又需要给证件、票据打码。内网里要的不是又一个网址，而是能装在自己机器上跑起来的东西。

镜像在 GitHub Actions 上构建，本机不装 Docker 也能出镜像。推到 `main` 产出 `edge` 标签，打 `v0.1.0` 这样的 tag 产出 `0.1.0` / `0.1` / `latest`，两个架构（amd64、arm64）一起推 Docker Hub 和 ghcr.io。

### 部署到 Cloudflare Pages

1. Fork 本仓库
2. Cloudflare Dashboard → Pages → 连接 GitHub 仓库
3. 构建命令填 `node scripts/fetch-vendor.mjs`，输出目录填 `public`
4. 部署完成，得到 `redactly.pages.dev`（免费，全球 CDN，无后端）

### 单文件版

`standalone/redactly.html`，约 86KB。一个文件双击就能用，发群或者当邮件附件都行。引擎和模型走 CDN，需要联网；要断网用就上 Docker。

### 本地开发

```bash
git clone https://github.com/opcoderen/redactly.git
cd redactly
npm run vendor    # 下载模型到 public/vendor/（约 41MB，仅需一次）
npm run serve     # http://localhost:8765
npm run build     # 本地出单 HTML：standalone/redactly.html（不联网、不依赖 Docker）
```

改完 `public/` 记得跑一次 `npm run build`，单文件版才会跟着更新。输出位置可以自己指定：

```bash
npm run build -- --out ~/Desktop/redactly.html
```

## 仓库结构

```
├─ public/            # 部署产物（Pages / Docker 的根）
│  ├─ index.html      # 含 CSP meta
│  ├─ assets/         # app.css · app.js · rules.js
│  └─ vendor/         # 运行时依赖（构建期下载，不入库）
│     └─ manifest.json  # 每个文件的来源与 sha256
├─ scripts/
│  ├─ fetch-vendor.mjs      # 下载 OCR / 人脸 / PDF / HEIC 依赖
│  └─ build-standalone.mjs  # 内联出单文件版
├─ docker/            # Dockerfile · nginx.conf（含 CSP 响应头）
├─ compose.yaml
└─ standalone/        # 单文件版（构建产物）
```

## 改识别规则

规则都放在 [`public/assets/rules.js`](public/assets/rules.js)，跟检测逻辑分开，加规则不用碰 `app.js`：

- 新号码类型：往 `DETECTORS` 加一项 `{ type, label, re, validate }`
- 新标签（「XX号：值」这类版式）：往 `LABELS_RE` 的竖线列表加词，值会被自动打码
- 新姓名标签：往 `NAME_LABELS_RE` 加词

正则要带 `g` 标志，建议配 `(?<!\d)` / `(?!\d)`，免得把一长串数字的中间一段当成号码。登机牌、快递面单、银行回单这几个场景的规则还比较薄，欢迎补。

## 两种形态

| 形态 | 路径 | 隐私 | 适合 |
|---|---|---|---|
| 部署版 | `public/` | 强：CSP 硬约束，可完全离线 | Docker / Cloudflare Pages |
| 单文件版 | `standalone/redactly.html` | 中：代码内联，没有 CSP，引擎走 CDN | 发给别人试用 |

## 文档与许可

- [PRIVACY.md](PRIVACY.md) — 数据流向
- [SECURITY.md](SECURITY.md) — 漏洞反馈
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) — 第三方组件与许可证
- [DOCKERHUB.md](DOCKERHUB.md) — 镜像商店页的说明，随镜像构建自动同步过去

代码以 [MIT](LICENSE) 发布。「隐码 / Redactly」的名称和 Logo 未授权用于衍生分发，代码本身不受限制。

## 已知限制

浏览器端的 Tesseract 用 LSTM 模型，对模糊、手写、低分辨率的图效果有限。默认取向是宁可多打不漏打，识别结果可以逐条取消勾选。

中文姓名和公司抬头没有 NER 模型，靠标签邻近规则判断，碰上生僻版式会漏。导出前自己过一遍。
