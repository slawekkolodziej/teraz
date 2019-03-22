const FileFsRef = require('@now/build-utils/file-fs-ref')

function recreateInputFiles (inputFilesObject) {
  return Object.entries(inputFilesObject).reduce(
    (inputFiles, [finalPath, data]) =>
      Object.assign(inputFiles, {
        [finalPath]: new FileFsRef(data)
      }),
    {}
  )
}

module.exports = recreateInputFiles
