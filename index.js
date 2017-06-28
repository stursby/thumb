const fs = require('fs')
const axios = require('axios')
const query = require('micro-query')
const { send } = require('micro')
const { parse } = require('url')

const VIMEO_API = 'https://vimeo.com/api/oembed.json?url='
const YOUTUBE_API = 'http://www.youtube.com/oembed?url='

async function buildImage(url) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' })
  const base64 = new Buffer(data, 'binary').toString('base64')
  return new Buffer(base64, 'base64')
}

module.exports = async (req, res) => {
  const { url } = query(req)
  if (!url) {
    return `
    **********************************
    **            Thumb             **
    **********************************

    Usage         <img src="https://thumb.now.sh?url=https://www.youtube.com/watch?v=SAWIo6Y4FoE">

    Examples
    - Vimeo       https://thumb.now.sh?url=https://vimeo.com/223149325
    - YouTube     https://thumb.now.sh?url=https://www.youtube.com/watch?v=SAWIo6Y4FoE
    `
  }

  const { hostname } = parse(url)
  res.setHeader('Content-Type', 'image/png')

  if (hostname.includes('vimeo')) {
    const { data } = await axios.get(`${VIMEO_API}${url}`)
    const thumb = data.thumbnail_url.replace(/(_\d.+)/, '.jpg')
    const image = await buildImage(thumb)
    res.setHeader('Content-Length', image.length)
    return send(res, 200, image)
  }

  if (hostname.includes('youtube')) {
    const { data } = await axios.get(`${YOUTUBE_API}${url}`)
    const filename = data.thumbnail_url.split('/').pop()
    const thumb = data.thumbnail_url.replace(filename, 'maxresdefault.jpg')
    const image = await buildImage(thumb)
    res.setHeader('Content-Length', image.length)
    return send(res, 200, image)
  }
}
