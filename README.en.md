<div align="center">

# Redactly 隐码

Redact sensitive info in images, inside your browser. The image is never uploaded, and there is no server that could receive it.

Detects phone numbers, ID cards, bank cards, invoice numbers, names and faces, then covers them with a solid block, mosaic or a smiley.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: Local-only](https://img.shields.io/badge/Privacy-local%20only-45d09e)](PRIVACY.md)
[![Docker](https://img.shields.io/badge/docker-opcoderen%2Fredactly-2496ED)](https://hub.docker.com/r/opcoderen/redactly)

</div>

---

## What it does

Most redaction sites upload the image, process it on a server, and send it back. Where the middle copy lives, and for how long, is not something you can see.

Redactly has no such step. OCR, face detection, redaction and export all run in WebAssembly inside the page. There is no backend, no database, no analytics, and no code path that uploads anything.

The page ships `connect-src 'self'` in its CSP, so the browser refuses cross-origin requests outright. Break that guarantee in a future commit and it fails on the client, not on trust.

### Check it yourself

DevTools → Network → drop an image → click Detect. Apart from same-origin model files, the request list stays empty.

## Features

| | |
|---|---|
| Numbers | phone, Chinese ID, landline, email, bank card (Luhn-validated), invoice numbers, USCC, ticket numbers, amounts, dates, passport MRZ, license plates |
| Chinese labels | 30+ document labels (patient ID, invoice no., tracking no., …); the value to the right of or below the label gets covered |
| Names | Chinese names after a 姓名 label, or pinyin on boarding passes (`ZHANG SAN`) |
| Faces | local tiny_face_detector, auto-covered, or placed by hand |
| Tools | solid, mosaic, blur, inpaint, brush, smiley. Drag, resize, restyle, undo |
| Formats | common images, iPhone HEIC, PDF page by page, downsampling for large scans |
| Offline | every model ships inside the Docker image; runs on an intranet or air-gapped machine |

## Quick start

### Docker

```bash
docker run -d -p 8080:80 --name redactly opcoderen/redactly
# open http://localhost:8080
```

Published for `linux/amd64` and `linux/arm64`, so it runs on a NAS. Putting a static site in a container looks redundant until you meet the actual constraint: an organisation that forbids outside SaaS but still needs ID scans redacted. What that environment needs is something installable on its own machines, not another URL.

### Cloudflare Pages

Fork → Pages → connect the repo → build command `node scripts/fetch-vendor.mjs`, output directory `public`. Free, global CDN, zero backend.

### Single file

`standalone/redactly.html` (~88KB): double-click to use, easy to attach to an email. Regenerate with `npm run build` (no network, no Docker); `npm run build -- --out <path>` writes it elsewhere. Engines come from a CDN here, so use the Docker image if the machine is offline.

## Contributing detection rules

Rules live in [`public/assets/rules.js`](public/assets/rules.js), decoupled from the detection logic. Adding a detector is one regex line. Boarding-pass, shipping-label and bank-slip rules are still thin, and PRs for those are welcome.

## License

MIT, see [LICENSE](LICENSE). Third-party components: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
