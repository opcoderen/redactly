# 贡献指南

## 提 issue

识别不准或漏检，请附一张能复现的图（敏感信息换成假数据），说明期望命中什么、实际命中了什么。没有样图的 issue 基本没法修。

误检（多打了不该打的）也请附图。结果列表里能手动取消勾选，但某个场景反复出现就值得改规则。

功能建议先翻一遍 README 的「已知限制」，免得重复。

## 改规则

规则和检测逻辑是分开的，改规则只要动 [`public/assets/rules.js`](public/assets/rules.js)：

1. 新号码类型 → `DETECTORS` 加一项
   ```js
   { type: "tracking", label: "快递单号", re: /(?<!\d)[A-Z]{2}\d{9,13}(?!\d)/g }
   ```
   `re` 必须带 `g` 标志；用 `(?<!\d)` / `(?!\d)` 防止匹配到长数字的中间一段；误报风险高的加 `validate` 做二次校验。
2. 新标签（「XX号：值」这类版式）→ `LABELS_RE` 竖线列表加词，长的放前面。
3. 新姓名标签 → `NAME_LABELS_RE` 加词。

改完 `npm run serve`，传一张样图，点「识别」看结果列表对不对。

## 修代码

- `public/assets/app.js` 是唯一主逻辑文件；改动后跑 `npm run serve` 验证基本路径（上传 → 识别 → 手动打码 → 导出）
- 涉及依赖加载的改动注意：部署版走本地 `vendor/`，`file://` 打开走 CDN，两条路径都要能跑
- 改完 `public/` 记得 `npm run build` 重新生成单文件版

## 提交规范

- 一个 PR 一个主题
- commit message 用祈使句：`fix: 姓名标签被词间空格拆散`
- 不引入新的运行时依赖；确需引入时同步更新 `scripts/fetch-vendor.mjs` 和 `THIRD_PARTY_NOTICES.md`

## 行为准则

正常社区规则：对事不对人，新人问题耐心答。
