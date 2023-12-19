import { env } from 'node:process'
import { v4 as uuid } from 'uuid'
import { BadRequestException } from '@nestjs/common'
import { S3 } from 'aws-sdk'
import { removeNonAlphanumericCharacters as cleanString } from './removeNumAlphaNumeric'
import { Multer } from 'multer'

const {
  R2_ACCESS_KEY = process.env.R2_ACCESS_KEY,
  R2_SECRET_KEY = process.env.R2_SECRET_KEY,
  R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID,
  R2_BUCKET_NAME = process.env.R2_BUCKET_NAME,
  IMAGE_UPLOAD_PREFIX = process.env.IMAGE_UPLOAD_PREFIX,
} = env
console.log('🚀 ~ file: uploadImages.ts:10 ~ R2_ACCESS_KEY:', R2_ACCESS_KEY)
console.log('🚀 ~ file: uploadImages.ts:11 ~ R2_SECRET_KEY:', R2_SECRET_KEY)
console.log('🚀 ~ file: uploadImages.ts:12 ~ R2_ACCOUNT_ID:', R2_ACCOUNT_ID)
console.log('🚀 ~ file: uploadImages.ts:13 ~ R2_BUCKET_NAME:', R2_BUCKET_NAME)
console.log(
  '🚀 ~ file: uploadImages.ts:14 ~ IMAGE_UPLOAD_PREFIX:',
  IMAGE_UPLOAD_PREFIX,
)

const VALID_EXT = ['PNG', 'JPG', 'JPEG', 'GIF']

const MAXIMUM_FILE_SIZE = 41943040

const s3 = new S3({
  region: 'us-east-1',
  endpoint: `https://${cleanString(
    R2_ACCOUNT_ID as string,
  )}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: cleanString(R2_ACCESS_KEY as string),
    secretAccessKey: cleanString(R2_SECRET_KEY as string),
  },
}) as any
console.log('🚀 ~ file: uploadImages.ts:30 ~ s3:', s3)

export const uploadFile = async (
  file: Multer.File | Multer.File[],
  directory: string,
) => {
  const images = file

  const uploadedFiles = []

  if (!images) {
    throw new BadRequestException(`No file provided`)
  }

  for (let i = 0; i < images.length; i++) {
    const name = images[i].originalname
    const ext = name.split('.').pop()
    const id = uuid()
    const fileName = `${directory}/${id}.${ext}`

    console.log('🚀 ~ file: uploadImages.ts:50 ~ fileName:', fileName)
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

    if (images[i].size > MAXIMUM_FILE_SIZE) {
      throw new BadRequestException(
        `You can't upload files with more than 40MB`,
      )
    }

    const params = {
      Bucket: 'imoveis',
      Key: fileName,
      ContentType: images[i].mimetype,
      Body: images[i].buffer,
      ACL: 'public-read',
    }
    console.log('🚀 ~ file: uploadImages.ts:76 ~ params:', params)

    try {
      await s3.upload(params as any).promise()
      console.log(`link da imagem: ${IMAGE_UPLOAD_PREFIX}/${fileName}`)
      uploadedFiles.push(`${IMAGE_UPLOAD_PREFIX}/${fileName}`)
    } catch (error) {
      console.log('🚀 ~ file: uploadImages.ts:83 ~ error:', error)
      throw new BadRequestException(`${error.message}`)
    }
  }

  return uploadedFiles
}

export const deleteFile = async (fileName: string) => {
  if (!fileName) {
    return
  }

  const key = fileName.split('https://images.localeimoveis.com/')[1]

  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }
  try {
    await s3.deleteObject(params as any).promise()
  } catch (error) {
    return
  }
}
