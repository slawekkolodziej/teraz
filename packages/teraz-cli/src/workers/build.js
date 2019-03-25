const fs = require('fs')
const path = require('path')
const workerpool = require('workerpool')
const camelcase = require('camelcase')
const getWritableDirectory = require('../utils/getWritableDirectory')
const recreateInputFiles = require('../utils/recreateInputFiles')

function handleLambda (buildResult, entrypoint, { inputPath }) {
  const lambdaName = camelcase(entrypoint.split('/'))
  const zipPath = path.join(inputPath, 'dist', lambdaName) + '.zip'
  const fd = fs.openSync(zipPath, 'w')
  fs.writeSync(fd, buildResult.zipBuffer)
  fs.closeSync(fd)
}

async function build (build, context) {
  const { inputFiles: _inputFiles, inputPath } = context

  const inputFiles = recreateInputFiles(_inputFiles)
  const entrypoint = build.src.replace(/^\//, '')

  const wrapper = require(build.use)
  const workPath = await getWritableDirectory()

  const buildResults = await wrapper.build({
    files: inputFiles,
    entrypoint,
    config: build.config,
    workPath
  })

  Object.entries(buildResults).map(([entrypoint, buildResult]) => {
    if (buildResult.zipBuffer) {
      handleLambda(buildResult, entrypoint, context)
    } else {
      console.log(buildResult, entrypoint, context)
    }
  })
}

workerpool.worker({
  build
})
