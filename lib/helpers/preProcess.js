import { Marked } from 'marked'

export async function preprocessMarkdown (article, f) {
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
  const m = new Marked({
    walkTokens (token) {
      if (token.type === 'link') allLinks.push(token.href)
      if (token.type === 'image') allImages.push(token.href)
    }
  })
  m.parse(article.content)

  console.log(article.idReadable, article.summary, { allLinks, allImages })
}
