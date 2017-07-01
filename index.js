const fs = require('fs')
const axios = require('axios')
const query = require('micro-query')
const { router, get } = require('microrouter')
const { send } = require('micro')
const { parse } = require('url')

const html = fs.readFileSync(__dirname + '/index.html')

const VIMEO_API = 'https://vimeo.com/api/oembed.json?url='
const YOUTUBE_API = 'https://www.youtube.com/oembed?url='

async function buildImage(url) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' })
  const base64 = new Buffer(data, 'binary').toString('base64')
  return new Buffer(base64, 'base64')
}

const vimeo = async (req, res, url) => {
  const { data } = await axios.get(`${VIMEO_API}${url}`)
  const thumb = data.thumbnail_url.replace(/(_\d.+)/, '.jpg')
  return await buildImage(thumb)
}

const youtube = async (req, res, url) => {
  const { data } = await axios.get(`${YOUTUBE_API}${url}`)
  const filename = data.thumbnail_url.split('/').pop()
  const thumb = data.thumbnail_url.replace(filename, 'maxresdefault.jpg')
  return await buildImage(thumb)
}

const defaultRoute = async (req, res) => {
  const { url } = query(req)
  if (!url) {
    res.end(html)
  } else {
    res.setHeader('Content-Type', 'image/png')
    const { hostname: h } = parse(url)
    if (h.includes('vimeo')) send(res, 200, await vimeo(req, res, url))
    if (h.includes('youtube')) send(res, 200, await youtube(req, res, url))
  }
}

const notFound = (req, res) => {
  send(res, 404, 'Not found route')
}

module.exports = router(
  get('/', defaultRoute),
  get('*', notFound)
)
