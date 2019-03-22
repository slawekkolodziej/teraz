const fs = require('fs')
const os = require('os')
const path = require('path')
const { promisify } = require('util')
const glob = require('@now/build-utils/fs/glob')
const makeTempDir = promisify(fs.mkdtemp)

async function getWritableDirectory () {
  return makeTempDir(path.join(os.tmpdir(), 'teraz-'))
}

// function checksum (str, algorithm, encoding) {
//   return crypto
//     .createHash(algorithm || 'md5')
//     .update(str, 'utf8')
//     .digest(encoding || 'hex')
// }

// function runAnalyze (wrapper, context) {
//   if (wrapper.analyze) {
//     return wrapper.analyze(context)
//   }
//   return null
// }

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

async function main (inputPath) {
  const ignore = getIgnoredFiles(inputPath)
  const inputFiles = await glob('**', {
    cwd: inputPath,
    ignore
  })

  const nowJsonRef = inputFiles['now.json']
  const nowJson = require(nowJsonRef.fsPath)

  for (let i = 0; i < nowJson.builds.length; i++) {
    let build = nowJson.builds[i]

    const buildFiles = await glob(build.src, inputPath)
    const sources = Object.keys(buildFiles)

    for (let j = 0; j < sources.length; j++) {
      const src = sources[j]
      const entrypoint = src.replace(/^\//, '')
      const wrapper = require(build.use)
      // const analyzeResult = runAnalyze(wrapper, {
      //   files: inputFiles,
      //   entrypoint,
      //   config: build.config
      // })
      const workPath = await getWritableDirectory()
      const buildResult = await wrapper.build({
        files: inputFiles,
        entrypoint,
        config: build.config,
        workPath
      })

      console.log(buildResult)

      if (buildResult[entrypoint].zipBuffer) {
        const zipPath =
          path.join(inputPath, 'dist', path.basename(src)) + '.zip'
        const fd = fs.openSync(zipPath, 'w')
        fs.writeSync(fd, buildResult[entrypoint].zipBuffer)
        fs.closeSync(fd)
      }
    }
  }
}

module.exports = main
