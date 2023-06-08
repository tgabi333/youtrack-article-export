window.addEventListener('DOMContentLoaded', function () {
  window.addEventListener('message', function (event) {
    if (event.data && event.data.scroll) {
      if (event.data.sectionId) {
        const hrefs = document.querySelectorAll('a')
        const hrefArray = Array.prototype.slice.call(hrefs)
        const current = hrefArray.find((tag => tag.href.endsWith('#' + event.data.sectionId)))
        if (current) {
          const allElements = document.querySelectorAll('.active');
          allElements.forEach((element) => {
            element.classList.remove('active');
          })
          current.classList.add('active')
          current.scrollIntoViewIfNeeded(false);
        }
      } else {
        const allElements = document.querySelectorAll('.active');
        allElements.forEach((element) => {
          element.classList.remove('active');
        })
      }
    }
  })
})
