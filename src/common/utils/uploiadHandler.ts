import path from 'path'
import fs from 'fs'
import Busboy from 'busboy'
import { pipeline } from 'stream'
import { promisify } from 'util'
import pino from 'pino'
const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
})

const pipelineAsync = promisify(pipeline)

const FILE_EVENT_NAME = 'file-uploaded'

export function createUploadHandler() {
  async function handleFile(fieldname, file, filename, notifyProgress) {
    const saveTo = path.join(__dirname, '../', 'downloads', filename)
    logger.info('Uploading: ' + saveTo)
    await pipelineAsync(
      file,
      handleFileBytes(filename, notifyProgress),
      fs.createWriteStream(saveTo),
    )

    logger.info(`File [${filename}] Finished`)
  }

  function handleFileBytes(filename, notifyProgress) {
    async function* handleData(data) {
      for await (const item of data) {
        const size = item.length
        notifyProgress(size)
        yield item
      }
    }

    return handleData
  }

  function registerEvents(headers, onFinish, notifyProgress) {
    const busboy = new Busboy({ headers })

    busboy.on('file', (fieldname, file, filename) =>
      handleFile(fieldname, file, filename, notifyProgress),
    )
    busboy.on('finish', onFinish)

    return busboy
  }

  return {
    registerEvents,
  }
}

// module.exports = createUploadHandler;
