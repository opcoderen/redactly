# syntax=docker/dockerfile:1

# ---- 构建期：把 OCR 引擎 / 语言包 / 模型拉齐，运行期不再需要外网 ----
FROM node:20-alpine AS vendor
WORKDIR /build
COPY scripts/fetch-vendor.mjs ./scripts/
RUN node scripts/fetch-vendor.mjs

# ---- 运行期：纯静态服务，镜像约 90MB（其中 41MB 是模型） ----
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html
COPY --from=vendor /build/public/vendor /usr/share/nginx/html/vendor

# 静态文件只读即可，nginx worker 以非 root 身份读取
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
 && find /usr/share/nginx/html -type f -exec chmod 644 {} +

HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

EXPOSE 80
