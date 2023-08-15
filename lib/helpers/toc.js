const fs = require('fs')

function generateToC (fullStack = [], hrefPrefix = '') {
  let result = fs.readFileSync('./design/toc/tocPreContent.html') + '\n\n'

  result += '<div class="toc">\n\n'
  for (const article of fullStack.slice(1)) {
    result += '  '.repeat(article.level) + `- <a href="${hrefPrefix}#articleHeader-${article.idReadable}">` + article.summary + '</a>\n'
  }

  result += '</div>\n\n'
  return result
}

module.exports = {
  generateToC
}
