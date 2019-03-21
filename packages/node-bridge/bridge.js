const { request } = require('http')

function normalizeNowProxyEvent (event) {
  let bodyBuffer
  const { method, path, headers, encoding, body } = JSON.parse(event.body)

  if (body) {
    if (encoding === 'base64') {
      bodyBuffer = Buffer.from(body, encoding)
    } else if (encoding === undefined) {
      bodyBuffer = Buffer.from(body)
    } else {
      throw new Error(`Unsupported encoding: ${encoding}`)
    }
  } else {
    bodyBuffer = Buffer.alloc(0)
  }

  return { isApiGateway: false, method, path, headers, body: bodyBuffer }
}

function normalizeAPIGatewayProxyEvent (event) {
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

function normalizeEvent (event) {
  if ('Action' in event) {
    if (event.Action === 'Invoke') {
      return normalizeNowProxyEvent(event)
    } else {
      throw new Error(`Unexpected event.Action: ${event.Action}`)
    }
  } else {
    return normalizeAPIGatewayProxyEvent(event)
  }
}

class Bridge {
  constructor (server) {
    this.server = null
    if (server) {
      this.setServer(server)
    }
    this.launcher = this.launcher.bind(this)

    // This is just to appease TypeScript strict mode, since it doesn't
    // understand that the Promise constructor is synchronous
    this.resolveListening = info => {}

    this.listening = new Promise(resolve => {
      this.resolveListening = resolve
    })
  }

  setServer (server) {
    this.server = server
    server.once('listening', () => {
      const addr = server.address()
      if (typeof addr === 'string') {
        throw new Error(`Unexpected string for \`server.address()\`: ${addr}`)
      } else if (!addr) {
        throw new Error('`server.address()` returned `null`')
      } else {
        this.resolveListening(addr)
      }
    })
  }

  listen () {
    if (!this.server) {
      throw new Error('Server has not been set!')
    }

    return this.server.listen({
      host: '127.0.0.1',
      port: 0
    })
  }

  async launcher (event) {
    const { port } = await this.listening

    const { isApiGateway, method, path, headers, body } = normalizeEvent(event)

    const opts = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers
    }

    // eslint-disable-next-line consistent-return
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

      if (body) req.write(body)
      req.end()
    })
  }
}

module.exports = {
  Bridge
}
