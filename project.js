require('dotenv').config()
const fs = require('fs')

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')
const {generateDocumentation, saveAttachments } = require('./lib/helpers/generate')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -project [string]')
  .demandOption(['project'])
  .argv

;(async() => {
  const access = new AccessSettings(process.env.YOUTRACK_HOST, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  const allArticles = await f.allArticles()
  console.log('ALL Articles:', allArticles.length)
  const projectArticles = allArticles.filter(article => article.project.shortName === argv.project)
  console.log('PROJECT Articles:', projectArticles.length)

  const topArticles = projectArticles.filter(article => !article.parentArticle)
  topArticles.sort((a, b) => { return a.ordinal - b.ordinal })
  console.log('PROJECT TOP Articles:', topArticles.length)

  for (const a of projectArticles) {
    const article = await f.byId(a.id)

    if (article.content) {
      console.log((article.idReadable || article.id), article.summary)
      await saveAttachments(article, f)
      await generateDocumentation(article)
    } else {
      console.log('EMPTY CONTENT', article)
    }
  }

})();
