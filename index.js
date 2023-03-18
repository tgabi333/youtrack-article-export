require('dotenv').config()

const AccessSettings = require('./lib/AccessSettings')
const ArticleFetcher = require('./lib/ArticleFetcher')

;(async() => {
  const access = new AccessSettings(process.env.YOUTRACK_HOST, process.env.YOUTRACK_TOKEN)

  const f = new ArticleFetcher()

  const result = await f.all(access)

  console.log(result)

})();
