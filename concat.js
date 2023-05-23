require('dotenv').config()
const fs = require('fs')

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')
const { generateDocumentation } = require('./lib/helpers/generate')
const { preprocessMarkdown } = require('./lib/helpers/preProcess')
const { generateToC } = require('./lib/helpers/toc')
const { generateCover } = require('./lib/helpers/coverPage')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --id [string] --filter [string] --no-coverpage --no-toc')
  .describe('filter', 'filter out articles with prefix')
  .describe('no-coverpage', 'Do not generate cover page')
  .describe('no-toc', 'Do not generate Table of contents')
  .demandOption(['id'])
  .argv

;(async () => {
  const access = new AccessSettings(process.env.YOUTRACK_URL, process.env.YOUTRACK_TOKEN)
  const f = new ArticleFetcher(access)

  fs.rmSync('./output', { recursive: true, force: true })
  fs.mkdirSync('./output')

  let allArticles = await f.allArticles()

  allArticles = allArticles.filter(a => !a.summary.startsWith('TODO'))

  console.log('all articles count:', allArticles.length)
  const root = allArticles.find(a => a.id === argv.id || a.idReadable === argv.id)
  if (!root) {
    console.error('Cannot find root Article', argv.id)
    process.exit(-1)
  }

  let stack = recursiveFindChildren(root, allArticles)

  if (argv.filter) {
    stack = stack.filter(a => !a.summary.startsWith(argv.filter))
  }

  // download full articles
  const fullStack = []
  for (const a of stack) {
    console.log('downloading article:', a.id, a.summary)
    const fullArticle = await f.byId(a.id)
    fullArticle.level = a.level
    fullStack.push(fullArticle)

    await preprocessMarkdown(fullArticle, f)
  }

  const coverPage = (argv.coverpage === false) ? undefined : generateCover(root)
  const toc = (argv.toc === false) ? undefined : generateToC(fullStack)

  const firstPages = [coverPage, toc].filter(p => !!p)
  await generateDocumentation(fullStack, f, firstPages)

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
