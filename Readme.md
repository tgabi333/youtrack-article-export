# Yourack Knowledge base Article export to PDF or HTML format

This tool can export articles from YouTrack via [REST API](https://www.jetbrains.com/help/youtrack/devportal/resource-api-articles.html). Heavily relies on [md-to-pdf](https://github.com/simonhaenisch/md-to-pdf).

## Features
- concatenating articles into one export (pdf and html)
- generate cover page
- generate table of contents
- download all attachments (into a separate folder)
- embed images into articles
- export to pdf
- export to HTML
- warnings about minimal md styles

## Usage

1. Clone (or fork) this repository  (no npm package yet)
2. prepare: `yarn install` or `npm install`, node v18+ required
3. make sure that scripts can write `./output` folder - the exported stuff will be placed here
4. setup your access (create a .env file with YOUTRACK_URL (icluding https://) and YOUTRACK_TOKEN variable)
5. run one of the root scripts (one.js, concat.js, project.js)

## Export customization

TODO: documentation

## Scripts

### concat.js

This script is concatenating an article tree. Pass an article ID to it, it will download 
and concatenate the articles and attacments recursively down the tree.

```shell
node concat.js --id PROJECT-A-1
```

### project.js

TODO: documentation

### one.js

TODO: documentation
