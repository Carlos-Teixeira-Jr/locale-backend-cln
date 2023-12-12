import { env } from 'node:process'
import { v4 as uuid } from 'uuid'
import { BadRequestException } from '@nestjs/common'
import { S3 } from 'aws-sdk'
import { removeNonAlphanumericCharacters as cleanString } from './removeNumAlphaNumeric';
import { Multer } from 'multer';

const {
  R2_ACCESS_KEY = process.env.R2_ACCESS_KEY,
  R2_SECRET_KEY = process.env.R2_SECRET_KEY,
  R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID,
  R2_BUCKET_NAME = process.env.R2_BUCKET_NAME,
  IMAGE_UPLOAD_PREFIX = process.env.IMAGE_UPLOAD_PREFIX
} = env;

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

export const uploadFile = async (
  file: Multer.File | Multer.File[],
  directory: string,
) => {

  const singleFile = Array.isArray(file) ? file[0] : file;
  console.log("🚀 ~ file: uploadImages.ts:44 ~ singleFile:", singleFile)

  if (!singleFile) {
    throw new BadRequestException(`No file provided`);
  }

  const name = singleFile.originalname;
  console.log("🚀 ~ file: uploadImages.ts:54 ~ name:", name)
  const ext = name.split('.').pop();
  console.log("🚀 ~ file: uploadImages.ts:56 ~ ext:", ext)

  if (!ext) {
    throw new BadRequestException(`File doesn't have an extension`)
  }

  if (!VALID_EXT.includes(ext.toUpperCase())) {
    throw new BadRequestException(
      `You can't upload files with ${ext} extension. Please try with a valid one. [${VALID_EXT.join(
        ', ',
      )}]`,
    )
  }

  if (file.size > MAXIMUM_FILE_SIZE) {
    throw new BadRequestException(`You can't upload files with more than 40MB`)
  }

  const id = uuid()
  const fileName = `${directory}/${id}.${ext}`

  const params = {
    Bucket: 'imoveis',
    Key: fileName,
    ContentType: singleFile.mimetype,
    Body: singleFile.buffer,
    ACL: 'public-read',
  }

  try {
    await s3.upload(params as any).promise()
    console.log(`link da imagem: ${IMAGE_UPLOAD_PREFIX}/${fileName}`)
    return { fileName: `${IMAGE_UPLOAD_PREFIX}/${fileName}` }
  } catch (error) {
    throw new BadRequestException(`${error.message}`);
  }
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
