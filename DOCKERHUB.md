# Redactly 隐码

Redact phone numbers, ID cards, bank cards, invoice numbers, names and faces in images. OCR, face detection and masking all run in the browser; the file never leaves the machine the user is sitting at. 纯本地图片打码，不上传。

Project home: **https://github.com/opcoderen/redactly**

Also here: [README](https://github.com/opcoderen/redactly#readme) · [Privacy](https://github.com/opcoderen/redactly/blob/main/PRIVACY.md) · [Source & license](https://github.com/opcoderen/redactly/blob/main/LICENSE) · [Issues](https://github.com/opcoderen/redactly/issues)

## Deploy

```bash
docker run -d --name redactly -p 8080:80 opcoderen/redactly
```

Open http://localhost:8080, drop an image, press 识别 (Detect). Change the left side of `-p` if 8080 is taken: `-p 9000:80`. Add `--restart unless-stopped` if the host reboots unattended.

Compose, for anything you will keep running:

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

```bash
docker compose up -d
```

No volumes, no environment variables, no database, no external service. The container reads files and returns them. First detection loads the Chinese and English OCR models from inside the image, so it takes a few seconds; later ones come from the browser cache.

Runs read-only. nginx only writes to its cache and pid directories, which the tmpfs entries provide.

## What is inside

The app itself, plus every model it needs: Tesseract worker and wasm core, `chi_sim` and `eng` traineddata, tiny_face_detector weights, pdf.js, heic2any. Around 90 MB, 41 MB of which is model weights. Nothing is fetched at runtime, so the container works on an intranet or with the network unplugged.

Why ship a static site as an image at all: the deployments that need it are the ones that cannot call an outside service. A hospital department, a law firm, a company that forbids SaaS — they need something installed on their own machines, reachable only from inside, and able to start offline. `docker run` is the shortest path there.

## Tags

| Tag | Meaning |
|---|---|
| `latest` | newest tagged release |
| `0.1.0`, `0.1` | a specific release |
| `edge` | built from the latest commit on `main`, may be broken |

`linux/amd64` and `linux/arm64` are both published, so a NAS, a Raspberry Pi or an Apple Silicon machine runs it natively.

## Health check

`GET /healthz` returns `200 ok`. The image declares a `HEALTHCHECK` against it, so `docker ps` shows `healthy` once nginx is serving.

## What it detects

Phone numbers, Chinese ID numbers, landline numbers, email addresses, bank cards (Luhn-checked), invoice numbers, unified social credit codes, airline ticket numbers, amounts, dates, passport MRZ, license plates. On top of that, 30+ document labels (patient number, medical record number, tracking number, …) whose value to the right or below gets covered, names in Chinese or pinyin, and faces through the bundled detector.

Output tools: solid block, mosaic, blur, inpaint, brush, smiley. Blocks can be dragged, resized and restyled after detection, and each hit can be switched off individually.

Input: common images, iPhone HEIC, PDF page by page. Scans above 2000 px are downsampled before OCR.

## Privacy, and how to check it

There is no backend, so there is nothing to upload to. The response headers make that structural:

```
Content-Security-Policy: default-src 'self'; connect-src 'self' blob: data:; ...
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
```

`connect-src 'self'` means the browser refuses any cross-origin request the page might attempt. To see it: open DevTools, Network tab, redact an image. Requests stay on your own origin.

Full data-flow description: [PRIVACY.md](https://github.com/opcoderen/redactly/blob/main/PRIVACY.md).

## Limitations

OCR runs on Tesseract LSTM weights inside the browser. Blurred, handwritten or low-resolution images will produce misses, and the default bias is to over-redact rather than under-redact; every hit can be unchecked in the results panel. Names and company headers have no NER model, only label-proximity rules, so unusual layouts get missed. Check the result before exporting.

Redaction is painted onto a raster image. If the original carries a text layer or metadata you need to strip, handle that separately.

## Source, contributing, license

Source and issue tracker: https://github.com/opcoderen/redactly

Detection rules are one file (`public/assets/rules.js`) and decoupled from the logic, so adding a number type or a document label is a small PR. Boarding passes, shipping labels and bank slips are still thin.

MIT. Third-party components are listed in [THIRD_PARTY_NOTICES.md](https://github.com/opcoderen/redactly/blob/main/THIRD_PARTY_NOTICES.md). The 隐码 / Redactly name and logo are not licensed for redistributed forks; the code is.
