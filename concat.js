require('dotenv').config()
const fs = require('fs')
const marked = require('marked')
const { JSDOM } = require('jsdom')
const { mdToPdf } = require('md-to-pdf')
const { transliterate } = require('transliteration')

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')
const generateDocumentation = require('./lib/helpers')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -id [string]')
  .demandOption(['id'])
  .argv

;(async() => {
  const access = new AccessSettings(process.env.YOUTRACK_HOST, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  const allArticles = await f.all()
  const root = allArticles.find(a => a.id === argv.id || a.idReadable === argv.id)
  if (!root) {
    console.error('Cannot find root Article', argv.id)
    process.exit(-1)
  }

  if (!root.attachments) {
    root.attachments = []
  }

  const stack = []
  recursiveFindChildren(root, allArticles)

  for (const a of stack) {
    const article = await f.byId(a.id)

    if (article.attachments) {
      for (const attachment of article.attachments) {
        attachment.originalArticle = a
      }
      root.attachments = root.attachments.concat(article.attachments)
    }

    if (article.content) {
      console.log(article.id, article.summary)

      root.content = (root.content || '' ) + '\n---\n' + article.content
    } else {
      console.log('EMPTY CONTENT', article)
    }
  }

  await generateDocumentation(root, f)

  function recursiveFindChildren(root, allArticles) {
    stack.push(root)
    const children = filterChildren(root, allArticles)
    for (const c of children) {
      stack.push(c)
      const child2 = filterChildren(c, allArticles)
      for (const c2 of child2) {
        recursiveFindChildren(c2, allArticles)
      }
    }
  }

  function filterChildren(current, allArticles) {
    const children = allArticles.filter(a => (a.parentArticle && a.parentArticle.id === current.id))
    children.sort((a, b) => { return a.ordinal - b.ordinal })
    return children
  }
})();
