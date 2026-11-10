#!/usr/bin/env node
/**
 * 下载所有运行时依赖到 public/vendor/，让页面完全离线可用。
 * 不联网也能构建（若 vendor 已存在则跳过）。
 *
 *   node scripts/fetch-vendor.mjs          # 缺什么下什么
 *   node scripts/fetch-vendor.mjs --force  # 全部重下
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const VENDOR = join(ROOT, "public", "vendor");
const FORCE = process.argv.includes("--force");

const CDN = "https://cdn.jsdelivr.net/npm";
const TESSDATA = "https://tessdata.projectnaptha.com/4.0.0";

const FILES = [
  // OCR 引擎本体 + worker（同目录，workerPath 直接指这里）
  { url: `${CDN}/tesseract.js@5.1.1/dist/tesseract.min.js`, out: "tesseract/tesseract.min.js" },
  { url: `${CDN}/tesseract.js@5.1.1/dist/worker.min.js`, out: "tesseract/worker.min.js" },
  // wasm core：oem=1 只用 LSTM 版；SIMD 与普通各留一份做兼容
  { url: `${CDN}/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js`, out: "tesseract/tesseract-core-simd-lstm.wasm.js" },
  { url: `${CDN}/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js`, out: "tesseract/tesseract-core-lstm.wasm.js" },
  // 中英文训练数据（gzip 版体积小一半，tesseract.js 会自动解压）
  { url: `${TESSDATA}/chi_sim.traineddata.gz`, out: "tessdata/chi_sim.traineddata.gz" },
  { url: `${TESSDATA}/eng.traineddata.gz`, out: "tessdata/eng.traineddata.gz" },
  // 人脸检测（tiny_face_detector，约 190KB）
  { url: `${CDN}/@vladmandic/face-api@1.7.15/dist/face-api.js`, out: "faceapi/face-api.js" },
  { url: `${CDN}/@vladmandic/face-api@1.7.15/model/tiny_face_detector_model-weights_manifest.json`, out: "faceapi/tiny_face_detector_model-weights_manifest.json" },
  { url: `${CDN}/@vladmandic/face-api@1.7.15/model/tiny_face_detector_model.bin`, out: "faceapi/tiny_face_detector_model.bin" },
  // PDF 按页渲染
  { url: `${CDN}/pdfjs-dist@3.11.174/build/pdf.min.js`, out: "pdfjs/pdf.min.js" },
  { url: `${CDN}/pdfjs-dist@3.11.174/build/pdf.worker.min.js`, out: "pdfjs/pdf.worker.min.js" },
  // HEIC / HEIF 解码（libheif wasm）
  { url: `${CDN}/heic2any@0.0.4/dist/heic2any.min.js`, out: "heic2any/heic2any.min.js" },
];

const exists = async (p) => {
  try { return (await stat(p)).size > 0; } catch { return false; }
};

async function download({ url, out }) {
  const dest = join(VENDOR, out);
  if (!FORCE && (await exists(dest))) {
    const buf = await readFile(dest);
    return { out, size: buf.length, sha256: sha(buf), skipped: true };
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} → ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error(`响应过小，疑似失败 → ${url}`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { out, size: buf.length, sha256: sha(buf), skipped: false };
}

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const mb = (n) => (n / 1024 / 1024).toFixed(2) + " MB";

(async () => {
  const results = [];
  let failed = 0;
  for (const f of FILES) {
    try {
      const r = await download(f);
      results.push(r);
      console.log(`${r.skipped ? "·" : "↓"} ${r.out.padEnd(52)} ${mb(r.size).padStart(9)}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${f.out}\n  ${e.message}`);
    }
  }
  // 清单文件：让使用者能核对下载内容，不被塞进来路不明的二进制
  await mkdir(VENDOR, { recursive: true });
  await writeFile(
    join(VENDOR, "manifest.json"),
    JSON.stringify({ generated: new Date().toISOString(), files: results }, null, 2) + "\n"
  );
  const total = results.reduce((a, r) => a + r.size, 0);
  console.log(`\n合计 ${results.length} 个文件 / ${mb(total)}${failed ? ` · ${failed} 个失败` : ""}`);
  process.exit(failed ? 1 : 0);
})();
