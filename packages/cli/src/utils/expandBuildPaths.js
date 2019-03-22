const { flatten } = require('ramda')
const { Sema } = require('async-sema')
const glob = require('@now/build-utils/fs/glob')

const MAX_CONCURRENCY = 3

async function expandBuildPaths (builds, inputPath) {
  const workers = Math.min(MAX_CONCURRENCY, builds.length)
  const sema = new Sema(workers, { capacity: builds.length })
  const expandedBuilds = await Promise.all(
    builds.map(async build => {
      await sema.acquire()

      const buildFiles = await glob(build.src, inputPath)
      const expandedBuilds = Object.keys(buildFiles).map(src =>
        Object.assign({}, build, { src })
      )

      sema.release()

      return expandedBuilds
    })
  )

  return flatten(expandedBuilds)
}

module.exports = expandBuildPaths
