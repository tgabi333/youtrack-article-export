const fs = require('fs')
const { mdToPdf } = require('md-to-pdf')
const { slugify } = require('transliteration')
const { gfmHeadingId } = require('marked-gfm-heading-id')
const fse = require("fs-extra");

async function saveAttachments (article, articleFetcher) {
  for (const attachment of article.attachments) {
    const data = await articleFetcher.downloadAttachment(attachment.url)
    const buffer = Buffer.from(await data.arrayBuffer())

    const dirName = slugify((article.idReadable || article.id) + ' ' + article.summary)
    attachment.relativeDirectory = `./output/attachments/${dirName}/`

    fs.mkdirSync(attachment.relativeDirectory, { recursive: true })
    attachment.relativePath = attachment.relativeDirectory + slugify(attachment.name.replaceAll(' ', '-'))
    fs.writeFileSync(attachment.relativePath, buffer)

    attachment.readablePath = attachment.relativePath.slice('./output/'.length)
    attachment.isImage = attachment.name.endsWith('.png') || attachment.name.endsWith('.jpg') || attachment.name.endsWith('.jpeg') || attachment.name.endsWith('.svg')
    attachment.isEmbedded = false

    // replace image links
    if (article.content) {
      const newContent = article.content.replaceAll(`(${attachment.name})`, attachment.isImage ? '(' + attachment.readablePath + ')' : '(file://' + attachment.readablePath + ')')
      attachment.isEmbedded = newContent !== article.content
      article.content = newContent
    }
  }
}

function fileSizeSI (a, b, c, d, e) {
  return (b = Math, c = b.log, d = 1e3, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2) + ' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes') // eslint-disable-line no-return-assign
}

function generateArticleSummary (article) {
  let content = `<h1 id="articleHeader-${article.idReadable}" class="articleHeader">${article.summary}</h1>`

  if (article.attachments.length) {
    const listedAttachments = article.attachments.filter(a => !a.isEmbedded || !a.isImage)
    if (listedAttachments.length) {
      content += '<h4>Article attachments</h4>\n\n'
      content += '| File Name |  Size | Type | Path |\n'
      content += '| --- | --- | --- | --- |\n'
      for (const attachment of listedAttachments) {
        content += ' | ' + attachment.name + '</a> | ' + fileSizeSI(attachment.size) + ' | ' + attachment.mimeType + ' | ' + attachment.readablePath + ' |\n'
      }
      content += '</ul>'
    }
  }
  return content
}

async function generatePdfDocumentation (stack, articleFetcher, firstPages = []) {
  const root = stack[0]
  root.leafArticles = []
  for (const article of stack) {
    if (article.attachments) {
      console.log('downloading attachment:', (article.idReadable || article.id), article.summary)

      await saveAttachments(article, articleFetcher)
    }

    if (article.content) {
      root.leafArticles.push(article)
    } else {
      console.log('empty content', (article.idReadable || article.id), article.summary)
    }
  }

  // concatenating content
  for (const a of root.leafArticles) {
    if (!a.content) {
      a.content = ''
    }
    a.content = generateArticleSummary(a) + '\n\n---\n\n' + a.content
  }
  if (root.content) {
    root.leafArticles.unshift(root.content)
  }
  if (firstPages && firstPages.length) {
    for (const c of firstPages.reverse()) {
      root.leafArticles.unshift({ content: c })
    }
  }
  root.content = root.leafArticles.filter(a => !!a.content).map(a => a.content).join('\n<div class="page-break"></div>\n\n')

  await saveDocumentation(root, articleFetcher)
}

async function saveDocumentation (article) {
  let cssContent = ''
  try {
    cssContent = fs.readFileSync('./design/css/common.css').toString()
    if (fs.existsSync('./design/css/pdf.css')) {
      cssContent = cssContent + '\n\n' +  fs.readFileSync('./design/css/pdf.css').toString()
    }
  } catch (e) {
    // file does not exist
  }

  fse.copySync('./design/asset', './output/asset')

  const fileName = slugify((article.idReadable || article.id) + ' ' + article.summary)

  fs.writeFileSync(`./output/${fileName}.md`, article.content)
  const html = await mdToPdf(article, {
    launch_options: { headless: 'new'},
    basedir: './output/',
    as_html: true,
    marked_options: { mangle: false, headerIds: false },
    marked_extensions: [ gfmHeadingId({ headerPrefix: article.id + '-' })],
    document_title: article.summary,
    css: cssContent
  })
  fs.writeFileSync(`./output/${fileName}.html`, html.content)

  const pdfOptions = Object.assign({}, JSON.parse(fs.readFileSync('./design/pdf/pdfoptions.json')), {
    headerTemplate: fs.readFileSync('./design/pdf/headerTemplate.html').toString(),
    footerTemplate: fs.readFileSync('./design/pdf/footerTemplate.html').toString(),
    timeout: 0
  })

  const pdf = await mdToPdf(article, {
    launch_options: { headless: 'new'},
    basedir: './output/',
    as_html: false,
    marked_options: { mangle: false, headerIds: false },
    marked_extensions: [ gfmHeadingId({ headerPrefix: article.id + '-' })],
    document_title: article.summary,
    css: cssContent,
    // devtools: true,
    pdf_options: pdfOptions
  })
  fs.writeFileSync(`./output/${fileName}.pdf`, pdf.content)
}

module.exports = {
  generatePdfDocumentation
}
