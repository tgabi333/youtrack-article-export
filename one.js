require('dotenv').config()
const fs = require('fs')
const marked = require('marked')
const { JSDOM } = require('jsdom')
const { mdToPdf } = require('md-to-pdf')
const { transliterate } = require('transliteration')

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')
const { generateDocumentation, saveAttachments, preprocessMarkdown } = require('./lib/helpers/generate')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --id [string]')
  .demandOption(['id'])
  .argv

;(async () => {
  const access = new AccessSettings(process.env.YOUTRACK_URL, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  const id = argv.id

  const article = await f.byId(id)

  await preprocessMarkdown(article, f)

  if (article.content) {
    console.log((article.idReadable || article.id), article.summary)

    await saveAttachments(article, f)
    await generateDocumentation(article, f)
  } else {
    console.log('EMPTY CONTENT', article)
  }
})()
