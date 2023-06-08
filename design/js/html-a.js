window.addEventListener('DOMContentLoaded', function () {
  const hrefs = document.getElementsByTagName('a')
  for (const image of hrefs) {
    if (image.hasAttribute('href')) {
      image.addEventListener('click', function (event) {
        event.preventDefault()
        const url = event.target.href
        window.open(url, '_blank')
      })
    }
  }
})
