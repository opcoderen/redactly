#!/usr/bin/env node
/**
 * 把 public/ 里的四个文件内联成一个 HTML，产出 standalone/redactly.html。
 * 单文件版的定位是「发出去就能用」：内置全部代码，引擎与模型走 CDN（file:// 打开也能跑）。
 * 需要完全离线时用 public/ 或 Docker。
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const P = (p) => join(ROOT, p);
const CDN = "https://cdn.jsdelivr.net/npm";

const [html, css, rules, app] = await Promise.all([
  readFile(P("public/index.html"), "utf8"),
  readFile(P("public/assets/app.css"), "utf8"),
  readFile(P("public/assets/rules.js"), "utf8"),
  readFile(P("public/assets/app.js"), "utf8"),
]);

for (const [name, code] of [["css", css], ["rules", rules], ["app", app]]) {
  if (code.includes("</script") || code.includes("</style")) {
    throw new Error(`${name} 里含有结束标签，内联会截断，请先转义`);
  }
}

// 单文件版必须能独立运行：依赖走 CDN，而不是同目录的 vendor/
const appInline = app.replace(
  'const OFFLINE = location.protocol !== "file:";',
  "const OFFLINE = false; // 单文件版：无同目录 vendor，引擎走 CDN"
);

let out = html
  // 单文件版含内联脚本，CSP meta 会把自己拦死；严格 CSP 由 Docker / Pages 的响应头提供
  .replace(/[ \t]*<!-- 隐私是硬约束[\s\S]*?-->\n/, "")
  .replace(/[ \t]*<meta http-equiv="Content-Security-Policy"[^>]*>\n/, "")
  .replace(
    '<script src="vendor/tesseract/tesseract.min.js" defer></script>',
    `<script src="${CDN}/tesseract.js@5.1.1/dist/tesseract.min.js"></script>`
  )
  .replace('<link rel="stylesheet" href="assets/app.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="assets/rules.js" defer></script>', `<script>\n${rules}\n</script>`)
  .replace('<script src="assets/app.js" defer></script>', `<script>\n${appInline}\n</script>`);

if (out.includes('src="assets/') || out.includes('href="assets/')) {
  throw new Error("还有未内联的本地资源，检查 index.html 的标签写法");
}

out = out.replace(
  "<title>",
  "<!-- 隐码 Redactly · 单文件版（依赖走 CDN，离线部署请用 Docker 镜像） -->\n  <title>"
);

// 输出路径：默认 standalone/redactly.html，可用 --out 指定（相对仓库根或绝对路径）
const outArgIdx = process.argv.indexOf("--out");
const outRel = outArgIdx > -1 && process.argv[outArgIdx + 1] ? process.argv[outArgIdx + 1] : "standalone/redactly.html";
const outPath = outRel.startsWith("/") ? outRel : P(outRel);

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, out);
const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
console.log(`✓ ${outRel}  ${kb} KB`);
console.log("  纯本地生成：不联网、不依赖 Docker，双击即可打开使用");
