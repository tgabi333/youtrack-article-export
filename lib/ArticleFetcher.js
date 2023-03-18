class ArticleFetcher {

  async all(accessSettings) {
    const response = await fetch(`${accessSettings.host}/api/articles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessSettings.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
    const result = await response.json()

    return result
  }
}

module.exports = ArticleFetcher
