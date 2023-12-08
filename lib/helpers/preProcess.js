const { marked, Renderer } = require('marked')

async function preprocessMarkdown (article, f) {
  if (!article.content) {
    return
  }

  // warn about unsupported size modifiers
  const matches = article.content.matchAll(/\)\{((width|height)=[\d]+(%|px)?[ ]?)+\)?}/gi)
  for (const match of matches) {
    console.warn('UNRENDERABLE IMAGE SIZING', (article.idReadable || article.id), article.summary, match[0])
  }

  // warn about attachments related to a comment
  const attachments = await f.allAttachments(article.id)
  if (attachments.length) {
    const commentAttachments = attachments.filter(a => !!a.comment)
    for (const a of commentAttachments) {
      console.warn('ATTACHMENT IN COMMENTS', (article.idReadable || article.id), article.summary, a.name, a.comment)
    }
  }

  const allLinks = []
  const allImages = []
  const renderer = new Renderer()
  renderer.originalLink = renderer.link
  renderer.originalImage = renderer.image
  renderer.link = (href, title, text) => {
    allLinks.push(href)
    return renderer.originalLink(href, title, text)
  }
  renderer.image = (src, title, alt) => {
    allImages.push(src)
    return renderer.originalImage(src, title, alt)
  }

  marked(article.content, { renderer })

  console.log(article.idReadable, article.summary, { allLinks, allImages})
}

module.exports = {
  preprocessMarkdown
}
