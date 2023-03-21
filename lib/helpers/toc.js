function generateToC (fullStack = []) {
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
