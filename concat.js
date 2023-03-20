require('dotenv').config()
const fs = require('fs')

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')
const { generateDocumentationStack } = require('./lib/helpers/generate')
const { preprocessMarkdown } = require('./lib/helpers/preProcess')
const { generateToC } = require('./lib/helpers/toc')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { generateCover } = require('./lib/helpers/coverPage')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --id [string]')
  .demandOption(['id'])
  .argv

;(async () => {
  const access = new AccessSettings(process.env.YOUTRACK_URL, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  const allArticles = await f.allArticles()
  console.log('all articles count:', allArticles.length)
  const root = allArticles.find(a => a.id === argv.id || a.idReadable === argv.id)
  if (!root) {
    console.error('Cannot find root Article', argv.id)
    process.exit(-1)
  }

  const stack = recursiveFindChildren(root, allArticles)

  // download full articles
  const fullStack = []
  for (const a of stack) {
    console.log('downloading article:', a.id, a.summary)
    const fullArticle = await f.byId(a.id)
    fullArticle.level = a.level
    fullStack.push(fullArticle)

    await preprocessMarkdown(fullArticle, f)
  }

  const coverPage = generateCover(root)
  const toc = generateToC(fullStack)

  await generateDocumentationStack(fullStack, f, [coverPage, toc])

  function recursiveFindChildren (root, allArticles, level = 0) {
    let stack = []
    root.level = level
    stack.push(root)
    const children = filterChildren(root, allArticles)
    for (const c of children) {
      c.level = level + 1
      stack.push(c)
      const child2 = filterChildren(c, allArticles)
      for (const c2 of child2) {
        stack = stack.concat(recursiveFindChildren(c2, allArticles, level + 2))
      }
    }
    return stack
  }

  function filterChildren (current, allArticles) {
    const children = allArticles.filter(a => (a.parentArticle && a.parentArticle.id === current.id))
    children.sort((a, b) => { return a.ordinal - b.ordinal })
    return children
  }
})()
