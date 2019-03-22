const fs = require('fs')
const os = require('os')
const path = require('path')
const { promisify } = require('util')
const makeTempDir = promisify(fs.mkdtemp)

async function getWritableDirectory () {
  return makeTempDir(path.join(os.tmpdir(), 'teraz-'))
}

module.exports = getWritableDirectory
