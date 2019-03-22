const workerpool = require('workerpool')
const glob = require('@now/build-utils/fs/glob')
const getIgnoredFiles = require('./utils/getIgnoredFiles')
const expandBuildPaths = require('./utils/expandBuildPaths')
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

async function main (inputPath) {
  const ignore = getIgnoredFiles(inputPath)
  const inputFiles = await glob('**', {
    cwd: inputPath,
    ignore
  })
  const nowJsonRef = inputFiles['now.json']
  const nowJson = require(nowJsonRef.fsPath)
  const builds = await expandBuildPaths(nowJson.builds, inputPath)

  const context = {
    inputFiles,
    inputPath,
    ignore
  }

  console.log('Files to build:')
  builds.forEach(build => console.log(`- ${build.src}`))

  const buildPool = workerpool.pool(__dirname + '/workers/build.js')

  // const results =
  await Promise.all(
    builds.map(build =>
      buildPool.exec('build', [build, context]).catch(function (err) {
        console.error(`FAILED: [${build.src}]`, err)
      })
    )
  )

  buildPool.terminate()
  console.log('DONE')

  // for (let j = 0; j < builds.length; j++) {
  //   const entrypoint = builds.src.replace(/^\//, '')
  //   const wrapper = require(build.use)
  //   // const analyzeResult = runAnalyze(wrapper, {
  //   //   files: inputFiles,
  //   //   entrypoint,
  //   //   config: build.config
  //   // })
  //   const workPath = await getWritableDirectory()
  //   const buildResult = await wrapper.build({
  //     files: inputFiles,
  //     entrypoint,
  //     config: build.config,
  //     workPath
  //   })

  //   console.log(buildResult)

  //   if (buildResult[entrypoint].zipBuffer) {
  //     const zipPath = path.join(inputPath, 'dist', path.basename(src)) + '.zip'
  //     const fd = fs.openSync(zipPath, 'w')
  //     fs.writeSync(fd, buildResult[entrypoint].zipBuffer)
  //     fs.closeSync(fd)
  //   }
  // }
}

module.exports = main
