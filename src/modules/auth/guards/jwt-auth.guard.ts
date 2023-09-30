import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UsersService } from 'modules/users/users.service'
import { JwtService } from '@nestjs/jwt'
import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { AuthService } from '../auth.service'
import { LoggerService } from 'modules/logger/logger.service'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @InjectorLoggerService(AuthService.name)
    private readonly logger: LoggerService,
    private readonly userService: UsersService,
    private jwtService: JwtService,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest()
      const token = request.headers.authorization
      const decodedToken = await this.jwtService.verify(token.split(' ')[1])
      const userId = decodedToken.sub
      const userExists = await this.userService.findOne(userId)

      if (userExists) {
        return true
      }

      return false
    } catch (error) {
      this.logger.error(`error on auth guard > [error]: Token not found.`)
      return false
    }
  }
}
