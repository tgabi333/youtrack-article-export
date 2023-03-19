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

	const id = argv.id

	const article = await f.byId(id)

	if (article.content) {
		console.log(article.id, article.summary)
		await generateDocumentation(article, f)
	} else {
		console.log('EMPTY CONTENT', article)
	}


})();
