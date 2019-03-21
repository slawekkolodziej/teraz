const { Server, request } = require('http')

const handler = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'OK' }))
}

const port = 3000 + parseInt(Math.random() * 100)
const server = new Server(handler)

server.listen(port)

function normalizeEvent (event) {
  let bodyBuffer
  const { httpMethod: method, path, headers, body } = event

  if (body) {
    if (event.isBase64Encoded) {
      bodyBuffer = Buffer.from(body, 'base64')
    } else {
      bodyBuffer = Buffer.from(body)
    }
  } else {
    bodyBuffer = Buffer.alloc(0)
  }

  return { isApiGateway: true, method, path, headers, body: bodyBuffer }
}

exports.handler = async event => {
  const { isApiGateway, method, path, headers, body } = normalizeEvent(event)

  const opts = {
    hostname: '127.0.0.1',
    port,
    path,
    method,
    headers
  }

  return new Promise((resolve, reject) => {
    const req = request(opts, res => {
      const response = res
      const respBodyChunks = []

      response.on('data', chunk => respBodyChunks.push(Buffer.from(chunk)))
      response.on('error', reject)
      response.on('end', () => {
        const bodyBuffer = Buffer.concat(respBodyChunks)
        delete response.headers.connection

        if (isApiGateway) {
          delete response.headers['content-length']
        } else if (response.headers['content-length']) {
          response.headers['content-length'] = String(bodyBuffer.length)
        }

        resolve({
          statusCode: response.statusCode || 200,
          headers: response.headers,
          body: bodyBuffer.toString()
        })
      })
    })

    req.on('error', error => {
      setTimeout(() => {
        // this lets express print the true error of why the connection was closed.
        // it is probably 'Cannot set headers after they are sent to the client'
        reject(error)
      }, 2)
    })

    if (body) {
      req.write(body)
    }

    req.end()
  })
}
