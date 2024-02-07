import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cors from 'cors'

import { AppModule } from './app.module'
import * as passport from 'passport'
import { json, urlencoded } from 'express'

function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Title here')
    .setDescription('Description here')
    .setVersion('1.0.0')
    .addTag('users')
    .addTag('auth')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, options)
  SwaggerModule.setup('api', app, document)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(
    cors({
      origin: '*',
    }),
  )

  setupSwagger(app)

  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  app.use(passport.initialize())

  //500mb
  app.use(json({ limit: 500 * 1024 * 1024 }))
  //500mb
  app.use(urlencoded({ extended: true, limit: 500 * 1024 * 1024 }))

  await app.listen(process.env.PORT || 3001)
}
bootstrap()
