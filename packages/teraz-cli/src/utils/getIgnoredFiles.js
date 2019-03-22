const fs = require('fs')
const path = require('path')

function getIgnoredFiles (inputPath) {
  const ignoreFile = path.join(inputPath, '.nowignore')

  if (!fs.existsSync(ignoreFile)) {
    return []
  }

  const ignoredFiles = fs
    .readFileSync(ignoreFile)
    .toString()
    .split('\n')

  return ignoredFiles.map(file => {
    if (!fs.existsSync(file)) {
      return file
    }

    const fd = fs.openSync(path.join(inputPath, file), 'r')
    const stats = fs.fstatSync(fd)
    fs.closeSync(fd)
    return stats.isDirectory() ? file + '/**/*' : file
  })
}

module.exports = getIgnoredFiles
