import { Controller, Post, Body } from '@nestjs/common'
import {
  AuthService,
  ILoginOutput,
  IRefreshToken,
  IRegister,
  ISocialRegister,
  IVerifyEmail,
} from './auth.service'
import { RequestPasswordDto } from './dto/request-password.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import { LocalLoginDto } from './dto/local-login.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { SocialRegisterDto } from './dto/google-register.dto'
import { ReSendVerifyEmailDto } from './dto/re-send-verify-email.dto'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary:
      'Realizes the login using email and password and return user data.',
  })
  async localLogin(
    @Body() localLoginDto: LocalLoginDto,
  ): Promise<ILoginOutput> {
    return await this.authService.localLogin(localLoginDto)
  }

  @Post('register')
  @ApiOperation({
    summary:
      'Creates an account using email, password and password confirmation and returns user data.',
  })
  async register(@Body() registerDto: RegisterDto): Promise<IRegister> {
    return await this.authService.register(registerDto)
  }

  @Post('social-register')
  @ApiOperation({
    summary:
      'Creates an account or log in an existing account and returns user data.',
  })
  async socialRegister(
    @Body() socialRegister: SocialRegisterDto,
  ): Promise<ISocialRegister> {
    return await this.authService.socialRegister(socialRegister)
  }

  @Post('verify-email')
  @ApiOperation({
    summary:
      'Verify if the verification code that was send to the user email is valid.',
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return await this.authService.verifyEmail(verifyEmailDto)
  }

  @Post('re-send-email-verify')
  @ApiOperation({
    summary:
      'Re-send the email verification code to the email used on register.',
  })
  async reSendVerifyEmail(
    @Body() reSendVerifyEmailDto: ReSendVerifyEmailDto,
  ): Promise<IVerifyEmail> {
    return await this.authService.reSendVerifyEmail(reSendVerifyEmailDto)
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Update the token and refresh token expiry.',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<IRefreshToken> {
    return this.authService.refreshToken(refreshTokenDto)
  }

  @Post('request-password')
  @ApiOperation({
    summary:
      'Send an random code for the user email that can be used as password.',
  })
  async requestPassword(@Body() requestPasswordDto: RequestPasswordDto) {
    return await this.authService.requestPassword(requestPasswordDto)
  }
}
