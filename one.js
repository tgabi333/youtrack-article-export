import 'dotenv/config'
import fs from 'node:fs'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

import AccessSettings from './lib/AccessSettings.js'
import ArticleFetcher from './lib/ArticleFetcher.js'
import { generatePdfDocumentation } from './lib/helpers/generatePdf.js'
import { preprocessMarkdown } from './lib/helpers/preProcess.js'
import { generateCover } from './lib/helpers/coverPage.js'
import { generateToC } from './lib/helpers/toc.js'

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --id [string] --no-coverpage --no-toc')
  .demandOption(['id'])
  .describe('no-coverpage', 'Do not generate cover page')
  .describe('no-toc', 'Do not generate Table of contents')
  .argv

;(async () => {
  const access = new AccessSettings(process.env.YOUTRACK_URL, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  const id = argv.id

  console.log('downloading article:', id)
  const article = await f.byId(id)

  await preprocessMarkdown(article, f)

  const coverPage = (argv.coverpage === false) ? undefined : generateCover(article)
  const toc = (argv.toc === false) ? undefined : generateToC([article])

  if (!article.content) {
    console.log('empty content', (article.idReadable || article.id), article.summary)
    process.exit(-2)
  }

  const firstPages = [coverPage, toc].filter(p => !!p)

  await generatePdfDocumentation([article], f, firstPages)
})()
