const { parsePngFormat } = require('png-dpi-reader-writer')

addEventListener('fetch', event => {
  const req = event.request
  const params = (new URL(req.url)).searchParams
  const src = params.get('src')
  event.respondWith(handleRequest(src))
})

async function handleRequest (srcUrl) {
  if (!srcUrl) return new Response('', { status: 400 })
  let res
  try {
    res = await fetch(srcUrl)
  } catch (err) {
    return new Response('', { status: 400 })
  }

  try {
    const contentType = res.headers.get('content-type')
    const contentDpr = res.headers.get('content-dpr')
    if (contentDpr || !contentType || !(/^image\/png/.test(contentType))) {
      return res
    }

    const buf = await res.arrayBuffer()
    const { width, height, dpi } = parsePngFormat(buf)

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-DPR': dpi && dpi >= 72 ? dpi / 72 : 1,
      'Content-Type': 'image/png',
    }
    if (width && height) {
      headers['X-Width'] = width
      headers['X-Height'] = height
      headers['Access-Control-Expose-Headers'] = 'X-Width, X-Height'
    }

    return new Response(buf, { headers })
  } catch (err) {
    console.error(err)
  }

  return res
}
