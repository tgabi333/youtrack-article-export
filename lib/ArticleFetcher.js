class ArticleFetcher {
  constructor (accessSettings) {
    this.accessSettings = accessSettings
  }

  async query (urlPart, fields = 'id', skip, top) {
    const url = new URL(`${this.accessSettings.url}/api/${urlPart}`)
    url.search = new URLSearchParams({ fields, $skip: skip, $top: top }).toString()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessSettings.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    return await response.json()
  }

  async allArticles () {
    const top = 10
    let skip = 0
    let result = []

    let currentPage
    do {
      currentPage = await this.query('articles', 'id,idReadable,summary,project(shortName,name),ordinal,parentArticle(id)', skip, top)
      skip += top
      result = result.concat(currentPage)
    } while (currentPage && currentPage.length > 0)

    return result
  }

  async byId (id, fields = 'id,idReadable,summary,content,project(shortName,name),ordinal,attachments(id,name,url,size,mimeType)') {
    const url = new URL(`${this.accessSettings.url}/api/articles/${id}`)
    url.search = new URLSearchParams({ fields }).toString()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessSettings.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    const result = await response.json()

    if (!result.attachments) {
      result.attachments = []
    }

    return result
  }

  async allAttachments (id) {
    const top = 10
    let skip = 0
    let result = []

    let currentPage
    do {
      currentPage = await this.query(`articles/${id}/attachments`, 'id,name,author(id,name),created,updated,size,mimeType,extension,url,comment(id)', skip, top)
      skip += top
      result = result.concat(currentPage)
    } while (currentPage && currentPage.length > 0)

    return result
  }

  async allComments (id) {
    const top = 10
    let skip = 0
    let result = []

    let currentPage
    do {
      currentPage = await this.query(`articles/${id}/comments`, 'id,author(id,name),text,created,visibility(permittedGroups(id,name),permittedUsers(id,name))', skip, top)
      skip += top
      result = result.concat(currentPage)
    } while (currentPage && currentPage.length > 0)

    return result
  }

  async downloadAttachment (url) {
    const response = await fetch(`${this.accessSettings.url}${url}`)
    const result = await response.blob()

    return result
  }
}

module.exports = ArticleFetcher
