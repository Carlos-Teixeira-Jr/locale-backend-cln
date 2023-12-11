import { env } from 'node:process'
import { v4 as uuid } from 'uuid'
import mime from 'mime-types'
import { BadRequestException } from '@nestjs/common'
import { S3 } from 'aws-sdk'
import { removeNonAlphanumericCharacters as cleanString } from './removeNumAlphaNumeric';
import { Multer } from 'multer';

const {
  R2_ACCESS_KEY = '8f38e4a42a7d46a64f0d6d6dd3e6a8e1',
  R2_SECRET_KEY = 'b6a2e73138209a72be50e3f4a95595aa8e86f96053ba9758e9ffca5adb911c3e',
  R2_ACCOUNT_ID = '2b6225885c45d2c36cff9c814b9370e8',
  R2_BUCKET_NAME = 'imoveis',
} = env

const VALID_EXT = ['PNG', 'jpg', 'JPEG', 'GIF', 'image/jpeg']

const VALID_FIELD_NAMES = ['images']

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
  // if (!VALID_FIELD_NAMES.includes(file.fieldname)) {
  //   throw new BadRequestException(
  //     `You must upload a file with fieldname ${VALID_FIELD_NAMES.join(', ')}`,
  //   )
  // }

  const singleFile = Array.isArray(file) ? file[0] : file;

  if (!singleFile) {
    throw new BadRequestException(`No file provided`);
  }

  const ext = mime.extension(singleFile.mimetype);

  //const ext = mime.extension(file.mimetype)

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
    ContentType: file.mimetype,
    Body: file.buffer,
    ACL: 'public-read',
  }

  try {
    await s3.upload(params as any).promise()
    return { fileName: `https://images.localeimoveis.com/${fileName}` }
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
