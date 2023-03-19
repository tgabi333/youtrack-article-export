const fs = require('fs')
const { mdToPdf } = require('md-to-pdf')
const { slugify } = require('transliteration')

async function saveAttachments (article, f) {
	for (const attachment of article.attachments) {
		const data = await f.downloadAttachment(attachment.url);
		const buffer = Buffer.from(await data.arrayBuffer());

		const dirName = slugify((article.idReadable || article.id) + ' ' + article.summary)
		attachment.relativeDirectory = `./output/attachments/${dirName}/`;

		fs.mkdirSync(attachment.relativeDirectory, { recursive: true });
		attachment.relativeFile = attachment.relativeDirectory + slugify(attachment.name.replaceAll(' ', '-'));
		fs.writeFileSync(attachment.relativeFile, buffer);

		// replace image links
		if (article.content) {
			if (attachment.name.endsWith('.png') || attachment.name.endsWith('.jpg') || attachment.name.endsWith('.jpeg')) {
				article.content = article.content.replaceAll(`(${attachment.name})`, '(' + attachment.relativeFile + ')');
			} else {
				article.content = article.content.replaceAll(`(${attachment.name})`, '(file://' + attachment.relativeFile.slice('./output/'.length) + ')');
			}
		}
	}
}

function preprocessMarkdown (article) {
  // warn specific image attributes
	if (!article.content) {
		return
	}

	const matches = article.content.matchAll(/\)\{((width|height)\=[\d]+(\%|px)?[ ]?)+\)?}/gi);

	for (const match of matches) {
		console.warn('UNRENDERABLE IMAGE SIZING', (article.idReadable || article.id), article.summary, match[0])
	}
}

async function generateDocumentationStack(stack, f, coverPage) {
	const root = stack[0]
	root.leafArticles = []
	for (const article of stack) {
		if (article.attachments) {
			console.log('DOWNLOADING ATTACHMENTS:', (article.idReadable || article.id), article.summary)
			for (const attachment of article.attachments) {
				attachment.originalArticle = article
			}
			root.attachments = root.attachments.concat(article.attachments)

			await saveAttachments(article, f)
		}

		if (article.content) {
			root.leafArticles.push(article)
		} else {
			console.warn('EMPTY CONTENT', (article.idReadable || article.id), article.summary)
		}
	}

	// concatenating content
	for (const a of root.leafArticles) {
		if (!a.content) {
			a.content = ''
		}
		a.content = '<h1 class="articleHeader">' + a.summary + '</h1>\n\n' + a.content
	}
	if (root.content) {
		root.leafArticles.unshift(root.content)
	}
	if (coverPage) {
		root.leafArticles.unshift({ content: coverPage })
	}
	root.content = root.leafArticles.map(a => a.content).join('\n\n---\n\n')

	await generateDocumentation(root, f)
}

async function generateDocumentation(article, f) {
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
		pdf_options: {
			format: 'A4',
			//displayHeaderFooter: true,
			//headerTemplate: '', //fs.readFileSync('./design/headerTemplate.html'),
			//footerTemplate: '', //fs.readFileSync('./design/footerTemplate.html')
		}
	})
	fs.writeFileSync(`./output/${fileName}.pdf`, pdf.content)
}

module.exports = {
	generateDocumentation,
	generateDocumentationStack,
	saveAttachments,
	preprocessMarkdown
}
