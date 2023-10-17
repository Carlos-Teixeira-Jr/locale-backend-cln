import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/mongoose'
import { IUser, UserModelName } from 'common/schemas/User.schema'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { Model, Schema } from 'mongoose'
import { UsersService } from 'modules/users/users.service'
import * as bcrypt from 'bcrypt'
import { RequestPasswordDto } from './dto/request-password.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import {
  sendAutoGeneratedPasswordEmail,
  sendEmailVerificationCode,
  sendResetPasswordEmail,
} from 'common/utils/emailHandler'
import { generateRandomString } from 'common/utils/generateRandomPassword'
import { LocalLoginDto } from './dto/local-login.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { SocialRegisterDto } from './dto/google-register.dto'
import { ReSendVerifyEmailDto } from './dto/re-send-verify-email.dto'

export type ILoginOutput = {
  access_token: string
  refresh_token: string
  _id: Schema.Types.ObjectId
  name: string
  email: string
  isEmailVerified: boolean
  picture: string
}

@Injectable()
export class AuthService {
  constructor(
    @InjectorLoggerService(AuthService.name)
    private readonly logger: LoggerService,
    @InjectModel(UserModelName)
    private readonly userModel: Model<IUser>,
    private jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userService.findOneByUsername(username)

    if (user && user.password === password) {
      const userData = { username: user.username, email: user.email }
      return userData
    }

    return null
  }

  // Cadastro de usuário
  async register(registerDto: RegisterDto) {
    try {
      this.logger.log({}, 'start register')

      const { email, password, passwordConfirmation } = registerDto

      if (password !== passwordConfirmation) {
        throw new BadRequestException(
          `A confirmação de senha não corresponde à senha inserida.`,
        )
      }

      const existingUser = await this.userModel.findOne({ email: email })

      if (existingUser) {
        throw new BadRequestException(
          `O email: ${email} já está vinculado a uma conta cadastrada.`,
        )
      }

      const emailVerificationCode = generateRandomString()
      const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira em 1 dia;

      const encryptedPassword = await bcrypt.hash(password, 10)
      const createdUser = await this.userModel.create({
        email: email,
        password: encryptedPassword,
        emailVerificationCode,
        emailVerificationExpiry,
      })

      await sendEmailVerificationCode(email, emailVerificationCode)

      return {
        _id: createdUser._id,
        name: createdUser.username,
        email: createdUser.email,
        isEmailVerified: createdUser.isEmailVerified,
        emailVerificationCode: createdUser.emailVerificationCode,
        emailVerificationExpiry: createdUser.emailVerificationExpiry,
      }
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      this.logger.log({}, 'start register')

      const { email, emailVerificationCode } = verifyEmailDto

      const user = await this.userModel.findOne({
        email: email,
      })

      if (user.emailVerificationExpiry < new Date()) {
        throw new NotFoundException(`Código de verificação expirado.`)
      }

      if (user.emailVerificationCode !== emailVerificationCode) {
        throw new BadRequestException(`Código de verificação inválido.`)
      }

      // Marcar o usuário como verificado
      user.isEmailVerified = true
      user.emailVerificationCode = null
      user.emailVerificationExpiry = null
      await user.save()

      return { message: 'E-mail verificado com sucesso!' }
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }

  async reSendVerifyEmail(reSendVerifyEmailDto: ReSendVerifyEmailDto) {
    try {
      this.logger.log({}, 'start re-send-verify-email')

      const { email } = reSendVerifyEmailDto

      const newEmailVerificationCode = generateRandomString()

      const updateUser = await this.userModel.updateOne(
        { email: email },
        { $set: { emailVerificationCode: newEmailVerificationCode } },
      )

      if (updateUser.modifiedCount === 0) {
        throw new NotFoundException(
          `Usuário com o email ${email} não encontrado`,
        )
      }

      // Consultar o usuário após a atualização
      const updatedUser = await this.userModel.findOne({ email: email })

      if (!updatedUser) {
        throw new NotFoundException(
          `Usuário com o email ${email} não encontrado`,
        )
      }

      await sendEmailVerificationCode(email, newEmailVerificationCode)

      return {
        emailVerificationCode: updatedUser.emailVerificationCode,
        emailVerificationExpiry: updatedUser.emailVerificationExpiry,
      }
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }

  // Login local (username e senha);
  async localLogin(localLoginDto: LocalLoginDto): Promise<ILoginOutput> {
    try {
      this.logger.log({}, 'start local login')

      const { email, password } = localLoginDto

      const existingUser = await this.userModel.findOne({ email: email })

      if (!existingUser) {
        throw new NotFoundException(
          `O usuário com o email: ${email} não foi encontrado`,
        )
      }

      const passwordMatched = await bcrypt.compare(
        password,
        existingUser.password,
      )

      if (!passwordMatched || existingUser.email !== email) {
        throw new BadRequestException(
          `O usuário ou a seha informados estão incorretos`,
        )
      }

      const payload = {
        sub: existingUser._id,
        email: email,
      }

      const access_token = this.jwtService.sign(payload, {
        expiresIn: process.env.TOKEN_EXPIRY,
      })

      const refresh_token = this.jwtService.sign(payload, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      })

      return {
        access_token,
        refresh_token,
        _id: existingUser._id,
        name: existingUser.username,
        picture: existingUser.picture,
        email: existingUser.email,
        isEmailVerified: existingUser.isEmailVerified,
      }
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refresh_token

    if (!refreshToken) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const email = this.jwtService.decode(refreshToken)['email']
    const user = await this.userService.findOneByEmail({ email: email })

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    try {
      await this.jwtService.verify(refreshToken)

      const payload = {
        sub: user._id,
        email: user.email,
      }

      const access_token = this.jwtService.sign(payload, {
        expiresIn: process.env.TOKEN_EXPIRY,
      })

      const refresh_token = this.jwtService.sign(payload, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      })

      return {
        access_token,
        refresh_token,
        _id: user._id,
        name: user.username,
        email: user.email,
      }
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token Expirado')
      }
      throw new UnauthorizedException(error.name)
    }
  }

  async requestPassword(requestPasswordDto: RequestPasswordDto) {
    try {
      this.logger.log({ requestPasswordDto }, 'start request-password')

      const { email } = requestPasswordDto

      const user = await this.userModel.findOne({ email: email })

      if (!user) {
        throw new NotFoundException(
          `O usuário com o email: ${email} não foi encontrado`,
        )
      }

      const randomPassword: string = generateRandomString()

      const encriptedPassword = await bcrypt.hash(randomPassword, 10)

      user.password = encriptedPassword
      await user.save()

      await sendResetPasswordEmail(email, randomPassword)

      this.logger.log('Email enviado com sucesso!')
      return { user }
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }

  async socialRegister(socialRegisterDto: SocialRegisterDto) {
    try {
      this.logger.log({ socialRegisterDto }, 'start social-register')

      const { email, username, picture } = socialRegisterDto

      const user = await this.userModel.findOne({ email })

      if (!user) {
        const autoGeneratedPassword = generateRandomString()
        const encryptedPassword = await bcrypt.hash(autoGeneratedPassword, 10)

        const emailPayload = {
          email,
          username,
          password: autoGeneratedPassword,
        }

        await sendAutoGeneratedPasswordEmail(emailPayload)

        const createdUser: any = await this.userModel.create({
          email,
          username,
          picture,
          password: encryptedPassword,
          isEmailVerified: true,
        })

        const payload = {
          sub: createdUser._doc._id,
          email: email,
        }

        const access_token = this.jwtService.sign(payload, {
          expiresIn: process.env.TOKEN_EXPIRY as string,
        })

        const refresh_token = this.jwtService.sign(payload, {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string,
        })

        return {
          _id: createdUser._id,
          name: createdUser.username,
          email: createdUser.email,
          picture: createdUser.picture,
          isEmailVerified: createdUser.isEmailVerified,
          access_token,
          refresh_token,
        }
      } else {
        if (!user.isEmailVerified) {
          user.isEmailVerified = true
          await user.save()
        }

        const payload = {
          sub: user._id,
          email: email,
        }

        const access_token = this.jwtService.sign(payload, {
          expiresIn: process.env.TOKEN_EXPIRY,
        })

        const refresh_token = this.jwtService.sign(payload, {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        })

        return {
          _id: user._id,
          name: user.username,
          email: user.email,
          picture: user.picture,
          isEmailVerified: user.isEmailVerified,
          access_token,
          refresh_token,
        }
      }
    } catch (error) {
      this.logger.error(error, 'exception')
      throw error
    }
  }
}
