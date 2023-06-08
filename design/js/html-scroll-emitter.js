window.addEventListener('DOMContentLoaded', function () {
  const contentSections = document.querySelectorAll('h1.articleHeader');

  window.addEventListener('scroll', function () {
    let currentSectionId = null;
    const fromTop = window.scrollY + 20;

    for (const section of contentSections) {
      if (section.offsetTop <= fromTop) {
        currentSectionId = section.getAttribute('id');
      }
    }

    window.parent.postMessage({ scroll: true, sectionId: currentSectionId}, '*')
  });
})
