const fs = require('fs')
const marked = require('marked')
const { JSDOM } = require('jsdom')
const { mdToPdf } = require('md-to-pdf')
const { slugify } = require('transliteration')

async function generateDocumentation(article, f) {
	article.originalContent = article.content

	for (const attachment of article.attachments) {
		const data = await f.downloadAttachment(attachment.url)
		const buffer = Buffer.from(await data.arrayBuffer())

		if (attachment.originalArticle) {
			attachment.relativeDirectory = `./output/attachments/${attachment.originalArticle.id}-` + slugify(attachment.originalArticle.summary) + '/'
		} else {
			attachment.relativeDirectory = `./output/attachments/${article.id}-` + slugify(article.summary) + '/'
		}

		fs.mkdirSync(attachment.relativeDirectory, {recursive: true})
		attachment.relativeFile = attachment.relativeDirectory + slugify(attachment.name.replaceAll(' ','-'))
		fs.writeFileSync(attachment.relativeFile, buffer)

		// replace image links
		if (attachment.name.endsWith('.png') || attachment.name.endsWith('.jpg') || attachment.name.endsWith('.jpeg')) {
			article.content = article.content.replaceAll(`(${attachment.name})`, '(' + attachment.relativeFile + ')')
		} else {
			article.content = article.content.replaceAll(`(${attachment.name})`, '(file://' + attachment.relativeFile.slice('./output/'.length) + ')')
		}
	}

	// clear image width properties
	article.content = article.content.replaceAll(/\)\{width\=[\d]+(\%|px)\}/gi, ')')

	const toc = createToc(article)

	fs.writeFileSync(`./output/${article.id}.md`, article.content)
	const html = await mdToPdf(article, {
		as_html: true,
		preprocessHtml: preprocessHtml.bind(this, toc),
		marked_options: { headerPrefix: article.id + '-' },
		document_title: article.summary,
		css: fs.readFileSync('./design/style.css').toString()

	})
	fs.writeFileSync(`./output/${article.id}.html`, html.content)

	const pdf = await mdToPdf(article, {
		as_html: false,
		preprocessHtml: preprocessHtml.bind(this, toc),
		marked_options: { headerPrefix: article.id + '-' },
		document_title: article.summary,
		css: fs.readFileSync('./design/style.css').toString(),
		pdf_options: {
			format: 'A4',
			//displayHeaderFooter: true,
			//headerTemplate: '', //fs.readFileSync('./design/headerTemplate.html'),
			//footerTemplate: '', //fs.readFileSync('./design/footerTemplate.html')
		}

	})
	fs.writeFileSync(`./output/${article.id}.pdf`, pdf.content)
}

function preprocessHtml(toc, html) {
	const jsdom = new JSDOM(html);
	const e = jsdom.window.document.createElement('div')
	e.id = 'toc'
	e.prepend(toc)
	jsdom.window.document.body.prepend(e)
	return jsdom.serialize()
}

function createToc(article) {
	const { document } = (new JSDOM(`...`)).window
	const stack = [document.createElement('ul')]
	for (const heading of marked.lexer(article.content).filter(x => x.type === 'heading')) {
		if (heading.depth < stack.length) {
			stack.length = heading.depth
		} else {
			while (heading.depth > stack.length) {
				const ul = document.createElement('ul')
				stack.at(-1).append(ul)
				stack.push(ul)
			}
		}


		const slugger = new marked.Slugger()
		const id = article.id + '-' + slugger.slug(heading.text);
		stack.at(-1).insertAdjacentHTML('beforeend', `<li><a href="#${id}">${heading.text}</a></li>`)
	}
	return stack[0];
}

module.exports = generateDocumentation
