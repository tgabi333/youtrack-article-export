const fs = require('fs')

function generateCover (article) {
  const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 10)

  let result = ''

  let coverPreContent = ''
  try {
    coverPreContent = fs.readFileSync('./design/cover/coverPreContent.html').toString()
  } catch (e) {
    // file does not exist
  }

  result += coverPreContent

  result += `<div class="coverTitle"><h1>${article.summary}</h1></div>`
  result += `<div class="coverTitle"><h2>${article.project.name}</h2></div>`
  result += `<div class="coverTitle"><h4>${date}</h4></div>`

  return result
}

module.exports = {
  generateCover
}
