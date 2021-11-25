'use strict'
const url = require('url')
const pkg = require('./package.json')
const {send} = require('micro')
const allowHeaders = [
  'accept-encoding',
  'accept-language',
  'accept',
  'access-control-allow-origin',
  'authorization',
  'cache-control',
  'connection',
  'content-length',
  'content-type',
  'dnt',
  'pragma',
  'range',
  'referer',
  'user-agent',
  'x-http-method-override',
  'x-requested-with',
]
const exposeHeaders = [
  'accept-ranges',
  'age',
  'cache-control',
  'content-length',
  'content-language',
  'content-type',
  'date',
  'etag',
  'expires',
  'last-modified',
  'pragma',
  'server',
  'transfer-encoding',
  'vary',
  'x-github-request-id',
]
const cors = require('./micro-cors.js')({allowHeaders, exposeHeaders})
const fetch = require('node-fetch')

async function service (req, res) {
  let p = url.parse(req.url, true).path
  let parts = p.match(/\/([^\/]*)\/(.*)/)
  if (parts === null) {
    res.setHeader('content-type', 'text/html')
    let html = `<!DOCTYPE html>
    <html>
      <title>cors-buster</title>
      <h1>smartfridge.space cors proxy! 👻</h1>
      <h2>See docs: <a href="https://npmjs.org/package/${pkg.name}">https://npmjs.org/package/${pkg.name}</a></h2>
      <h2>Request API</h2>
      cors.smartfridge.space/domain/path?query
      <ul>
        <li>domain - the destination host</li>
        <li>path - the rest of the URL</li>
        <li>query - optional query parameters</li>
      </ul>
      Example: cors.smartfridge.space/github.com/smartfrigde/cors-buster?service=git-upload-pack
      <h2>Supported Protocols</h2>
      In order to protect users who might send their usernames and passwords through the proxy,
      all requests must be made using HTTPS. Plain old HTTP is insecure and therefore not allowed.
      This proxy cannot be used to make requests to HTTP-only sites.
      <h2>Supported HTTP Methods</h2>
      <ul>
        <li>All - OPTIONS, GET, POST, PUT, DELETE, etc</li>
      </ul>
      <h2>Supported Query Parameters</h2>
      <ul>
        <li>All URL query parameters are passed on as-is to the destination address.</li>
      </ul>
      <h2>Supported Headers</h2>
      <ul>
        ${allowHeaders.map(x => `<li>${x}</li>`).join('\n')}
      </ul>
    </html>
    `
    return send(res, 400, html)
  }

  let headers = {}
  for (let h of allowHeaders) {
    if (req.headers[h]) {
      headers[h] = req.headers[h]
    }
  }

  let pathdomain = parts[1]
  let remainingpath = parts[2]
  console.log(`https://${pathdomain}/${remainingpath}`)
  let f = await fetch(
    `https://${pathdomain}/${remainingpath}`,
    {
      method: req.method,
      headers,
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? req : undefined
    }
  )
  for (let h of exposeHeaders) {
    if (h === 'content-length') continue
    if (f.headers.has(h)) {
      res.setHeader(h, f.headers.get(h))
    }
  }
  f.body.pipe(res)
}

module.exports = cors(service)
