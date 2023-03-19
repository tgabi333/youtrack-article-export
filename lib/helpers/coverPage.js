
function generateCover(article) {
 return '# ' + article.summary + '\n<div class="page-break"></div>\n'
}

module.exports = {
	generateCover
}
