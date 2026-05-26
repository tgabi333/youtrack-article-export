# YouTrack Knowledge Base Article export to PDF, HTML and Markdown

This tool exports articles from YouTrack via the [REST API](https://www.jetbrains.com/help/youtrack/devportal/resource-api-articles.html) and renders them as PDF / HTML / Markdown. Rendering is done by [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf) (headless Chromium under the hood).

## Features

- export a single article, a sub-tree, or every article in a project
- concatenate trees into one PDF or one HTML
- generate a cover page (customizable HTML)
- generate a table of contents
- download all attachments into per-article folders
- embed images directly into the rendered output
- emit warnings about Markdown that won't render cleanly (image-size modifiers, attachments on comments)
- customizable styles, page header, page footer and cover page

## Setup

1. Clone (or fork) this repository — there's no npm package.
2. Node **24+** required.
3. Install deps: `pnpm install` (preferred — `pnpm-lock.yaml` is committed). `npm install` works too.
4. Create a `.env` file in the repo root:
   ```
   YOUTRACK_URL=https://your-instance.youtrack.cloud
   YOUTRACK_TOKEN=perm-...
   ```
   Get the token from **Profile → Account Security → Tokens → New token** in YouTrack. Read scope on YouTrack is enough.
5. Make sure the working directory is writable — output lands in `./output/` (the folder is wiped at the start of every run).

## Scripts

All three scripts share the same `.env` and write into `./output/`.

### `one.js` — single article

```shell
node one.js --id PROJECT-A-1 [--no-coverpage] [--no-toc]
```

Exports a single article in three formats: `.md`, `.html`, `.pdf`.

| Flag | Effect |
|---|---|
| `--id` (required) | Article ID, either internal (e.g. `146-5`) or readable (e.g. `PU-A-6`) |
| `--no-coverpage` | Skip the cover page |
| `--no-toc` | Skip the table of contents |

### `concat.js` — recursive PDF tree

```shell
node concat.js --id PROJECT-A-1 [--filter PREFIX] [--no-coverpage] [--no-toc]
```

Walks the article tree under `--id`, concatenates all descendants into a single PDF (plus a sibling `.html` and `.md`). Articles whose `summary` starts with `TODO` are skipped automatically. `--filter PREFIX` additionally skips any article whose summary starts with `PREFIX`.

### `concat-html.js` — recursive HTML tree

```shell
node concat-html.js --id PROJECT-A-1 [--filter PREFIX] [--no-coverpage] [--no-toc]
```

Like `concat.js`, but the output is a browsable HTML site (`index.html` + `toc.html` + `content.html` + assets) instead of a single PDF. The frame at `index.html` loads the ToC and content side-by-side and keeps them in sync via `postMessage`. Articles whose summary starts with `TODO` or `SKIP` are skipped automatically.

### `project.js` — every article in a project

```shell
node project.js --project PROJECT [--filter PREFIX]
```

Exports every article in the given YouTrack project as its own standalone PDF/HTML/MD set (so you get N triplets in `./output/`, not one merged document). `--filter PREFIX` skips articles whose summary starts with `PREFIX`.

## Output

After a run, `./output/` typically contains:

```
output/
├── asset/                          # copied from design/asset/
├── attachments/
│   └── <article-slug>/             # one folder per article that has attachments
│       └── <attachment-name>
├── <root-article-slug>.md          # the merged markdown source
├── <root-article-slug>.html        # HTML preview (PDF source) — concat.js / one.js
├── <root-article-slug>.pdf         # final PDF — concat.js / one.js
├── content.html                    # concat-html.js only — full content frame
├── toc.html                        # concat-html.js only — ToC frame
└── index.html                      # concat-html.js only — outer frame
```

Slugs are produced by the `transliteration` package (the article's `idReadable` + summary, lowercased, ASCII-only).

Inside article bodies, image-style attachment links (`![](filename.png)`) are rewritten to point at the downloaded copy in `./attachments/...`. Non-image attachments become `file://` links and are also listed in a table appended to each article.

## Customization

Drop-in files under `design/` control everything cosmetic. None of them are required — anything missing is silently skipped.

### Cover page — `design/cover/coverPreContent.html`

Raw HTML rendered above the auto-generated title block. Used for a logo, a banner, etc. The auto-generated block underneath looks like:

```html
<div class="coverTitle"><h1>{article.summary}</h1></div>
<div class="coverTitle"><h2>{article.project.name}</h2></div>
<div class="coverTitle"><h4>{YYYY-MM-DD}</h4></div>
```

### Table of contents — `design/toc/tocPreContent.html`

Raw HTML rendered above the auto-generated ToC list (e.g. an `<h1>Table of contents</h1>` heading).

### Styles — `design/css/`

Three cascading stylesheets, all optional. They are concatenated in this order:

| File | Used by | Purpose |
|---|---|---|
| `common.css` | every script | global styles applied to every output |
| `pdf.css` | `one.js`, `concat.js`, `project.js` | PDF-only overrides |
| `html-toc.css` | `concat-html.js` (ToC frame) | overrides for the ToC pane |
| `html-content.css` | `concat-html.js` (content frame) | overrides for the content pane |

### PDF header and footer — `design/pdf/`

Used by `one.js`, `concat.js`, `project.js`.

- `pdfoptions.json` — passed to Puppeteer's `pdf()` ([options reference](https://pptr.dev/api/puppeteer.pdfoptions/)). Controls page size, margins, whether the header/footer is displayed.
- `headerTemplate.html` — Puppeteer header template (supports `<span class="pageNumber"></span>`, `<span class="totalPages"></span>`, `<span class="title"></span>`).
- `footerTemplate.html` — same, for the footer.

### Assets — `design/asset/`

Copied verbatim to `./output/asset/` on every run. Reference them from `coverPreContent.html`, CSS, etc. as `./asset/yourfile.ext`.

### Browser scripts — `design/js/` (HTML output only)

Injected into the rendered HTML by `concat-html.js`:

- `html-img.js`, `html-a.js` — content-frame behavior (image lightbox, link interception)
- `html-scroll-emitter.js` — content frame emits scroll events
- `html-scroll-receiver.js` — ToC frame highlights the current section in response

## Notes

- Article content is rendered through Puppeteer's headless Chromium with JavaScript enabled and `file://` access to `./output/`. Treat your YouTrack content like trusted source — anything an article author can put in the body (raw HTML, `<script>`, `<img onerror>`) will execute on the export machine.
- YouTrack issues a token only once on creation — keep it safe and rotate it if it leaks.
