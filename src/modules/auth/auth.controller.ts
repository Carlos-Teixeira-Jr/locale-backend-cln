import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AuthService } from './auth.service'
import { RequestPasswordDto } from './dto/request-password.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import { LocalLoginDto } from './dto/local-login.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { SocialRegisterDto } from './dto/google-register.dto'
import { ReSendVerifyEmailDto } from './dto/re-send-verify-email.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async localLogin(@Body() localLoginDto: LocalLoginDto) {
    return await this.authService.localLogin(localLoginDto)
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto)
  }

  // @Post('google-register')
  // async googleRegister(@Body() googleRegisterDto: GoogleRegisterDto) {
  //   return await this.authService.googleRegister(googleRegisterDto)
  // }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto)
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto)
  }

  @Post('re-send-email-verify')
  async reSendVerifyEmail(@Body() reSendVerifyEmailDto: ReSendVerifyEmailDto) {
    return await this.authService.reSendVerifyEmail(reSendVerifyEmailDto)
  }

  @Post('social-register')
  async socialRegister(@Body() socialRegister: SocialRegisterDto) {
    return await this.authService.socialRegister(socialRegister)
  }

  //Rota para testar o middleware que exige e verifica o token jwt;
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  async protected() {
    return 'success'
  }

  @Post('request-password')
  async requestPassword(@Body() requestPasswordDto: RequestPasswordDto) {
    return await this.authService.requestPassword(requestPasswordDto)
  }
}
