window.addEventListener('DOMContentLoaded', function () {
  const images = document.getElementsByTagName('img')
  for (const image of images) {
    if (image.hasAttribute('src')) {
      image.addEventListener('click', function (event) {
        event.preventDefault()
        const imageUrl = event.target.src
        window.open(imageUrl, '_blank')
      })
    }
  }
})
