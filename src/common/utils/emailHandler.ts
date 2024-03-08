import * as nodemailer from 'nodemailer'
import { SendAutoGeneratedPasswordDto } from './dto/send-auto-generated-password.dto'
import { SendEmailToLocaleDto } from 'app-dto/sendEmailToLocale.dto'

const localeLogoLink = 'https://localeimoveis.com.br/logo-pointer.png'

export async function sendResetPasswordEmail(
  email: string,
  newPassword: string,
) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USERNAME,
      pass: process.env.MAILER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  const mailOptions = {
    from: 'Locale Imóveis',
    to: email,
    subject: 'Redefinição de senha',
    text: `A senha provisória ${newPassword} foi gerada para que o usuário com o email ${email} pudesse logar. Recomendamos que você altere essa senha assim que puder acessar sua área de usuário`,
    html: `
      <html>
        <head>
          <style>
            .text {
              font-size: 14px;
              color: #666;
            }

            .small-text {
              font-size: 11px;
              color: #666;
            }

            .title {
              font-size: 24px;
              color: #F75D5F;
              font-weight: bold;
              margin-bottom: 20px;
              margin-top: 20px
            }

            .logo {
              width: 300px
            }

            body {
              display: grid;
              justify-items: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }

            hr {
              width: 100%;
              margin-top: 20px;
              margin-bottom: 20px
            }

            .container {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }

            .sub-container {
              width: fit-content;
              text-align: center;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 10px;
              box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
            }

          </style>
        </head>
        <body>
          <div class="container">
            <div class="sub-container">
              <img src=${localeLogoLink} alt="Logotipo da Locale Imóveis" class="logo">
              <p class="text">Olá, uma senha provisória foi gerada para que o usuário com o email ${email} pudesse logar. Recomendamos que você altere essa senha assim que puder acessar sua área de usuário.</p>
              <div class="two-color-line">
                <p class="title">Senha provisória: </p>
                <h1 class="title">${newPassword}</h1>
              </div>
              <hr>
              <p class="small-text">Caso não tenha feito essa solicitação, por favor desconsidere esse email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
  console.log('Email enviado com sucesso!')
}

export async function sendEmailVerificationCode(
  email: string,
  emailVerificationCode: string,
) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USERNAME,
      pass: process.env.MAILER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  const mailOptions = {
    from: 'Locale Imóveis',
    to: email,
    subject: 'Confirmação de E-mail | Locale',
    html: `
      <html>
        <head>
          <style>
            .text {
              font-size: 14px;
              color: #666;
            }

            .small-text {
              font-size: 11px;
              color: #666;
            }

            .title {
              font-size: 24px;
              color: #F75D5F;
              font-weight: bold;
              margin-bottom: 20px;
              margin-top: 20px
            }

            .logo {
              width: 300px
            }

            body {
              display: grid;
              justify-items: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }

            hr {
              width: 100%;
              margin-top: 20px;
              margin-bottom: 20px
            }

            .container {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }

            .sub-container {
              width: fit-content;
              text-align: center;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 10px;
              box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
            }

          </style>
        </head>
        <body>
          <div class="container">
            <div class="sub-container">
              <img src=${localeLogoLink} alt="Logotipo da Locale Imóveis" class="logo">
              <p class="title">Olá, seja bem vindo à Locale Imóveis!</p>
              <p class="text">Para garantir a segurança da sua conta, precisamos verificar o seu endereço de email.</p>
              <p class="text">Por favor, use o seguinte código de verificação para confirmar o seu cadastro:</p>
              <h1 class="title">${emailVerificationCode}</h1>
              <p class="text">Atenciosamente,</p>
              <p class="text">Equipe Locale Imóveis</p>
              <hr>
              <p class="small-text">Caso não tenha feito essa solicitação, por favor desconsidere esse email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
  console.log('Email enviado com sucesso!')
}

export async function sendAutoGeneratedPasswordEmail(
  user: SendAutoGeneratedPasswordDto,
) {
  const { email, username, password } = user

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USERNAME,
      pass: process.env.MAILER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  const mailOptions = {
    from: 'Locale Imóveis',
    to: email,
    subject: 'Senha gerada',
    html: `
      <html>
        <head>
          <style>
            .text {
              font-size: 14px;
              color: #666;
            }

            .small-text {
              font-size: 11px;
              color: #666;
            }

            .title {
              font-size: 16px;
              color: #F75D5F;
              font-weight: bold;
              margin-bottom: 20px;
              margin-top: 20px
            }

            .logo {
              width: 300px
            }

            body {
              display: grid;
              justify-items: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }

            hr {
              width: 100%;
              margin-top: 20px;
              margin-bottom: 20px
            }

            .container {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }

            .sub-container {
              width: fit-content;
              text-align: center;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 10px;
              box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
            }

          </style>
        </head>
        <body>
          <div class="container">
            <div class="sub-container">
              <img src=${localeLogoLink} alt="Logotipo da Locale Imóveis" class="logo">
              <p class="title">Olá ${
                username !== undefined ? username : ''
              },</p>
              <p class="text">uma senha de acesso foi criada automaticamente para sua conta.</p>
              <p class="text">Recomendamos que guarde essa senha ou troque-a na página de dados do usuário.</p>
              <p class="text">Senha de acesso:</p> 
              <h1 class="title">${password}</h1>
              <p class="text">Atenciosamente,</p>
              <p class="text">Equipe Locale Imóveis</p>
              <hr>
              <p class="small-text">Caso não tenha feito essa solicitação, por favor desconsidere esse email.</p>
            </div>
          </div
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
  console.log('Email enviado com sucesso!')
}

export async function senEmailToLocale(
  sendEmailToLocaleDto: SendEmailToLocaleDto,
) {
  const { email, name, telephone, message } = sendEmailToLocaleDto

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USERNAME,
      pass: process.env.MAILER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  const mailOptions = {
    from: 'Locale Imóveis',
    to: email,
    subject: 'Contato',
    html: `
      <html>
        <head>
          <style>
            .text {
              font-size: 14px;
              color: #666;
            }

            .small-text {
              font-size: 11px;
              color: #666;
            }

            .title {
              font-size: 16px;
              color: #F75D5F;
              font-weight: bold;
              margin-bottom: 20px;
              margin-top: 20px
            }

            .logo {
              width: 300px
            }

            body {
              display: grid;
              justify-items: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }

            hr {
              width: 100%;
              margin-top: 20px;
              margin-bottom: 20px
            }
          </style>
        </head>
        <body>
          <img src=${localeLogoLink} alt="Logotipo da Locale Imóveis" class="logo">
          <p class="text">Nome: ${name}</p>
          <p class="text">Telefone: ${telephone},</p>
          <hr>
          <p class="text">${message}</p>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
  console.log('Email enviado com sucesso!')
}
