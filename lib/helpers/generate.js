const fs = require('fs')
const { mdToPdf } = require('md-to-pdf')
const { slugify } = require('transliteration')

async function saveAttachments (article, f) {
  for (const attachment of article.attachments) {
    const data = await f.downloadAttachment(attachment.url)
    const buffer = Buffer.from(await data.arrayBuffer())

    const dirName = slugify((article.idReadable || article.id) + ' ' + article.summary)
    attachment.relativeDirectory = `./output/attachments/${dirName}/`

    fs.mkdirSync(attachment.relativeDirectory, { recursive: true })
    attachment.relativePath = attachment.relativeDirectory + slugify(attachment.name.replaceAll(' ', '-'))
    fs.writeFileSync(attachment.relativePath, buffer)

    attachment.readablePath = attachment.relativePath.slice('./output/'.length)
    attachment.isImage = attachment.name.endsWith('.png') || attachment.name.endsWith('.jpg') || attachment.name.endsWith('.jpeg')
    attachment.isEmbedded = false

    // replace image links
    if (article.content) {
      const newContent = article.content.replaceAll(`(${attachment.name})`, attachment.isImage ? '(' + attachment.relativePath + ')' : '(file://' + attachment.readablePath + ')')
      attachment.isEmbedded = newContent != article.content
      article.content = newContent
    }
  }
}

function fileSizeSI (a, b, c, d, e) {
  return (b = Math, c = b.log, d = 1e3, e = c(a) / c(d) | 0, a / b.pow(d, e)).toFixed(2) +
		' ' + (e ? 'kMGTPEZY'[--e] + 'B' : 'Bytes')
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

async function generateDocumentationStack (stack, f, firstPages = []) {
  const root = stack[0]
  root.leafArticles = []
  for (const article of stack) {
    if (article.attachments) {
      console.log('DOWNLOADING ATTACHMENTS:', (article.idReadable || article.id), article.summary)

      await saveAttachments(article, f)
    }

    if (article.content) {
      root.leafArticles.push(article)
    } else {
      console.log('EMPTY CONTENT', (article.idReadable || article.id), article.summary)
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

  await generateDocumentation(root, f)
}

async function generateDocumentation (article, f) {
  let cssContent = ''
  try {
    cssContent = fs.readFileSync('./design/style.css').toString()
  } catch (e) {
    // file does not exist
  }

  const fileName = slugify((article.idReadable || article.id) + ' ' + article.summary)

  fs.writeFileSync(`./output/${fileName}.md`, article.content)
  const html = await mdToPdf(article, {
    as_html: true,
    marked_options: { headerPrefix: article.id + '-' },
    document_title: article.summary,
    css: cssContent
  })
  fs.writeFileSync(`./output/${fileName}.html`, html.content)

  const pdf = await mdToPdf(article, {
    as_html: false,
    marked_options: { headerPrefix: article.id + '-' },
    document_title: article.summary,
    css: cssContent,
    // devtools: true,
    pdf_options: {
      format: 'A4',
      margin: {
        top: '30',
        bottom: '80',
        left: '25',
        right: '25'
      },
      displayHeaderFooter: true,
      headerTemplate: fs.readFileSync('./design/headerTemplate.html').toString(),
      footerTemplate: fs.readFileSync('./design/footerTemplate.html').toString()
    }
  })
  fs.writeFileSync(`./output/${fileName}.pdf`, pdf.content)
}

module.exports = {
  generateDocumentation,
  generateDocumentationStack,
  saveAttachments
}
