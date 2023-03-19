
function preprocessHtml(toc, html) {
	const jsdom = new JSDOM(html);
	const e = jsdom.window.document.createElement('div')
	e.id = 'toc'
	e.prepend(toc)
	jsdom.window.document.body.prepend(e)
	return jsdom.serialize()
}

function createTocFromArticleContent(article) {
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

function htmlToList (html, level = 0) {
	const dom = new JSDOM(html)
	const listElements = dom.window.document.querySelectorAll('ul, ol')
	let markdown = ''
	for (let i = 0; i < listElements.length; i++) {
		const listElement = listElements[i]
		markdown += parseList(listElement, level)
		const isLastItem = i === listElements.length - 1
		markdown += isLastItem ? '' : '\n'
	}
	return markdown
}

function parseList (listElement, level) {
	let markdown = ''
	const listItems = listElement.querySelectorAll('li')
	const isOrdered = listElement.tagName === 'OL'
	for (let i = 0; i < listItems.length; i++) {
		const listItem = listItems[i]
		const text = listItem.textContent.trim()
		const childLists = listItem.querySelectorAll('ul, ol')
		if (childLists.length > 0) {
			markdown += `${'  '.repeat(level)}${isOrdered ? i + 1 : '-'} ${text}\n${parseList(listItem, level + 1)}\n`
		} else {
			markdown += `${'  '.repeat(level)}${isOrdered ? i + 1 : '-'} ${text}\n`
		}
	}
	return markdown
}

function generateH1Links(markdown) {
	const renderer = new marked.Renderer()
	const headings = []

	renderer.heading = function (text, level, raw, slugger) {
		if (level === 1) {
			const slug = slugger.slug(raw)
			const link = `<a href="#${slug}">${text}</a>`
			headings.push({ text, link })
			return `<h${level} id="${slug}">${link}</h${level}>`
		} else {
			return `<h${level} id="${slugger.slug(raw)}">${text}</h${level}>`
		}
	}

	marked.marked(markdown, { renderer })

	return headings
}


function generateToC(fullStack=[]) {
	let result = '# ' + fullStack[0].summary + '\n\n'

	result += '<div class="toc">\n\n'
	for (const article of fullStack.slice(1)) {
		result += '  '.repeat(article.level) + `- <a href="#articleHeader-${article.idReadable}">` + article.summary + '</a>\n'
	}

	result += '</div>\n\n'
	return result
}

module.exports = {
	generateToC
}
