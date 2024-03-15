import { env } from 'node:process'
import { v4 as uuid } from 'uuid'
import { BadRequestException } from '@nestjs/common'
import { S3 } from 'aws-sdk'
import { removeNonAlphanumericCharacters as cleanString } from './removeNumAlphaNumeric'

const {
  R2_ACCESS_KEY = process.env.R2_ACCESS_KEY,
  R2_SECRET_KEY = process.env.R2_SECRET_KEY,
  R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID,
  R2_BUCKET_NAME = process.env.R2_BUCKET_NAME,
  IMAGE_UPLOAD_PREFIX = process.env.IMAGE_UPLOAD_PREFIX,
} = env

type ParamsType = {
  Bucket: string
  Key: string
  ContentType?: string
  Body?: Buffer
  ACL?: string
}

const VALID_EXT = ['PNG', 'JPG', 'JPEG', 'GIF']

const MAXIMUM_FILE_SIZE = 41943040

const r2 = new S3({
  region: 'us-east-1',
  endpoint: `https://${cleanString(
    R2_ACCOUNT_ID as string,
  )}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: cleanString(R2_ACCESS_KEY as string),
    secretAccessKey: cleanString(R2_SECRET_KEY as string),
  },
}) as any

export const uploadFile = async (
  files: Array<Express.Multer.File>,
  directory: string,
) => {
  const images = files

  if (!images) {
    throw new BadRequestException(`No file provided`)
  }

  const promises = images.map(async file => {
    const name = file.originalname
    const ext = name.split('.').pop()
    const id = uuid()
    const fileName = `${directory}/${id}.${ext}`

    if (!ext) {
      throw new BadRequestException(`File ${name} doesn't have an extension`)
    }

    if (!VALID_EXT.includes(ext.toUpperCase())) {
      throw new BadRequestException(
        `You can't upload files with ${ext} extension. Please try with a valid one. [${VALID_EXT.join(
          ', ',
        )}]`,
      )
    }

    if (file.size > MAXIMUM_FILE_SIZE) {
      throw new BadRequestException(
        `You can't upload files with more than 40MB`,
      )
    }

    const params: ParamsType = {
      Bucket: 'imoveis',
      Key: fileName,
      ContentType: file.mimetype,
      Body: file.buffer,
      ACL: 'public-read',
    }

    try {
      await r2.upload(params as any).promise()
      console.log(`link da imagem: ${IMAGE_UPLOAD_PREFIX}/${fileName}`)
      return `${IMAGE_UPLOAD_PREFIX}/${fileName}`
    } catch (error) {
      throw new BadRequestException(`${error.message}`)
    }
  })

  try {
    const uploadedFiles = await Promise.all(promises)
    return uploadedFiles
  } catch (error) {
    throw new BadRequestException(
      `Failed to upload some files: ${error.message}`,
    )
  }
}

export const deleteFile = async (fileName: string) => {
  if (!fileName) {
    return
  }

  const key = fileName.split('https://images.localeimoveis.com.br/')[1]

  const params: ParamsType = {
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }
  try {
    await r2.deleteObject(params as any).promise()
  } catch (error) {
    return
  }
}
