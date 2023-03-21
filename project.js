require('dotenv').config()
const fs = require('fs')

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')
const { generateDocumentation } = require('./lib/helpers/generate')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --project [string] --filter [string]')
  .describe('filter', 'filter out articles with prefix')
  .demandOption(['project'])
  .argv

;(async () => {
  const access = new AccessSettings(process.env.YOUTRACK_URL, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  const allArticles = await f.allArticles()
  console.log('all articles count:', allArticles.length)
  let projectArticles = allArticles.filter(article => article.project.shortName === argv.project)
  console.log('project articles count:', projectArticles.length)

  if (argv.filter) {
    projectArticles = projectArticles.filter(a => !a.summary.startsWith(argv.filter))
  }

  for (const a of projectArticles) {
    const article = await f.byId(a.id)

    if (article.content) {
      await generateDocumentation(article, f)
    } else {
      console.log('empty content', (article.idReadable || article.id), article.summary)
    }
  }
})()
