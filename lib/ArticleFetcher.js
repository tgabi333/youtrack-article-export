class ArticleFetcher {

  constructor (accessSettings) {
    this.accessSettings = accessSettings
  }

  async query(skip, top, fields = 'id,idReadable,summary,project(shortName),ordinal,parentArticle(id)') {
    const url = new URL(`${this.accessSettings.host}/api/articles`)
    url.search = new URLSearchParams({ fields, '$skip': skip, '$top' : top }).toString()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessSettings.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    const result = await response.json()

    return result
  }

  async all() {
    const top = 10
    let skip = 0
    let result = []

    let currentPage
    do {
      currentPage = await this.query(skip, top)
      skip += top
      result = result.concat(currentPage)
    } while (currentPage && currentPage.length > 0)

    return result
  }

  async byId(id, fields = 'id,idReadable,summary,content,attachments(id,name,url)') {
    const url = new URL(`${this.accessSettings.host}/api/articles/${id}`)
    url.search = new URLSearchParams({ fields }).toString()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessSettings.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    const result = await response.json()

    return result
  }

  async downloadAttachment(url) {
    const response = await fetch(`${this.accessSettings.host}${url}`)
    const result = await response.blob()

    return result
  }
}

module.exports = ArticleFetcher
