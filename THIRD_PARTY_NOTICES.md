# 第三方组件声明

本项目代码以 MIT 许可发布（见 LICENSE）。以下组件在**构建期**下载并随镜像/站点分发，各自保留原许可证。

## 运行时依赖（public/vendor/，由 scripts/fetch-vendor.mjs 下载）

| 组件 | 版本 | 用途 | 许可证 | 来源 |
|---|---|---|---|---|
| tesseract.js | 5.1.1 | OCR 主线程 API | Apache-2.0 | cdn.jsdelivr.net/npm/tesseract.js |
| tesseract.js-core | 5.1.1 | OCR WebAssembly 引擎 | Apache-2.0 | cdn.jsdelivr.net/npm/tesseract.js-core |
| tessdata (chi_sim / eng) | 4.0.0 | 中英文训练数据 | Apache-2.0 | tessdata.projectnaptha.com |
| @vladmandic/face-api | 1.7.15 | 人脸检测（tiny_face_detector） | MIT | cdn.jsdelivr.net/npm/@vladmandic/face-api |
| pdf.js (pdfjs-dist) | 3.11.174 | PDF 按页渲染 | Apache-2.0 | cdn.jsdelivr.net/npm/pdfjs-dist |
| heic2any | 0.0.4 | iPhone HEIC 解码（libheif wasm） | MIT/LGPL-3.0（libheif） | cdn.jsdelivr.net/npm/heic2any |

每个文件的实际 sha256 记录在 `public/vendor/manifest.json`，由构建脚本生成。

## 构建工具链（不进入最终产物）

| 工具 | 用途 | 许可证 |
|---|---|---|
| Node.js（仅构建期 fetch/内联） | 下载依赖、生成单文件版 | MIT 类 |
| nginx:1.27-alpine | Docker 静态服务 | BSD-2-Clause |

## 备注

- tesseract.js 内含 emscripten 编译产物，遵循 Apache-2.0
- libheif 的 LGPL 部分以未修改的独立 wasm 形式分发，不构成链接；如你的分发场景对 LGPL 有顾虑，可从 `scripts/fetch-vendor.mjs` 中移除 heic2any，HEIC 支持会退化为仅 Safari 可用
