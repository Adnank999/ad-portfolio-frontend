import { definePlugin } from 'nitro'
import { compressPublicHtml } from '../../src/server/html-compression'

export default definePlugin(app => {
  // Nitro's production router is compiled and does not expose H3.use().
  const fetch = app.fetch
  app.fetch = async request => compressPublicHtml(request, await fetch(request))
})
