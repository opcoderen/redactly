# Redactly 隐码

Redact phone numbers, ID cards, bank cards, invoice numbers, names and faces in images. Everything runs in the browser; the image never leaves the user's machine. 纯本地图片打码，不上传。

This image is the whole app behind nginx: static files, a strict CSP, and every OCR/face-detection model vendored in. Pull it, run it, and the deployment works with no internet access.

## Why an image instead of a website

The app is a static page, so a container looks redundant until you meet the real constraint: a hospital department, a law firm or a company that forbids outside SaaS still has to redact ID scans. In that environment the requirement is something installable on their own machines, reachable only from the intranet, and able to start with the network unplugged.

`docker run` is the shortest path to that. Roughly 90 MB, of which 41 MB is model weights.

## Quick start

```bash
docker run -d --name redactly -p 8080:80 opcoderen/redactly
```

Open http://localhost:8080, drop an image, press 识别 (Detect). First run loads the Chinese and English OCR models from the container itself, so the initial detection takes a few seconds; later ones come from the browser cache.

No volumes, no environment variables, no database, no external service. The container reads files and returns them.

### Compose

```yaml
services:
  redactly:
    image: opcoderen/redactly:latest
    container_name: redactly
    ports:
      - "8080:80"
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
      - /tmp
    security_opt:
      - no-new-privileges:true
```

The container runs read-only. nginx only needs write access to its cache and pid directories, which the tmpfs entries provide.

## Tags

| Tag | Meaning |
|---|---|
| `latest` | newest tagged release |
| `0.1.0`, `0.1` | a specific release |
| `edge` | built from the latest commit on `main`, may be broken |

Both `linux/amd64` and `linux/arm64` are published, so it runs on a NAS, a Raspberry Pi, or an Apple Silicon machine without emulation.

## Health check

`GET /healthz` returns `200 ok`. The image declares a `HEALTHCHECK` against it, so `docker ps` shows `healthy` once nginx is serving.

## What it detects

Phone numbers, Chinese ID numbers, landline numbers, email addresses, bank cards (Luhn-checked), invoice numbers, unified social credit codes, airline ticket numbers, amounts, dates, passport MRZ, license plates. On top of that, 30+ document labels (patient number, medical record number, tracking number, …) whose value to the right or below gets covered, names in Chinese or pinyin, and faces through a bundled tiny_face_detector.

Output tools: solid block, mosaic, blur, inpaint, brush, smiley. Blocks can be dragged, resized and restyled after detection, and each detection can be switched off individually.

Accepted input: common images, iPhone HEIC, PDF (page by page). Scans above 2000 px are downsampled before OCR to keep it fast.

## Privacy, and how to check it

There is no backend, so there is nothing to upload to. The response headers make that structural rather than a promise:

```
Content-Security-Policy: default-src 'self'; connect-src 'self' blob: data:; ...
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
```

`connect-src 'self'` means the browser refuses any cross-origin request the page might try. To see it: open DevTools, Network tab, redact an image. Requests stay on your own origin.

The full data-flow description is in [PRIVACY.md](https://github.com/opcoderen/redactly/blob/main/PRIVACY.md).

## Limitations

OCR runs on Tesseract LSTM weights inside the browser. Blurred, handwritten or low-resolution images will produce misses, and the default bias is to over-redact rather than under-redact; every hit can be unchecked in the results panel. Names and company headers have no NER model, only label-proximity rules, so unusual layouts get missed. Check the result before exporting.

Redaction is applied to a raster image. If the original file is a scan with a text layer, or you need to keep metadata, run your own checks.

## Source and license

Source, issues and rule contributions: https://github.com/opcoderen/redactly

MIT. Third-party components and their licenses are listed in [THIRD_PARTY_NOTICES.md](https://github.com/opcoderen/redactly/blob/main/THIRD_PARTY_NOTICES.md). The 隐码 / Redactly name and logo are not licensed for redistributed forks; the code is.
