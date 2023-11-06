import { ApiTags } from '@nestjs/swagger'
import { Body, Controller, Get, Param, Post } from '@nestjs/common'

import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import { User_Owner, UsersService } from './users.service'
import { GetUserDto } from './dto/get-user.dto'
import { GetUserByEmailDto } from './dto/get-user-by-email-dto.sto'
import { GetOwnerByUserId } from './dto/get-owner-by-user-id'
import { EditUserDto } from './dto/edit-user.dto'
import { EditFavouriteDto } from './dto/edit-favourite.dto'
import { GetFavouritesByUserDto } from './dto/favourite-property.dto'
import { IUser } from 'common/schemas/User.schema'
import { EditCreditCardDto } from './dto/editCreditCard.dto'

@ApiTags('users')
@Controller('user')
export class UsersController {
  constructor(
    @InjectorLoggerService(UsersController.name)
    private readonly logger: LoggerService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':_id')
  async findUserById(@Param() params: GetUserDto) {
    return this.usersService.findOne(params._id)
  }

  @Post('find-by-email')
  async findByEmail(@Body() body: GetUserByEmailDto): Promise<IUser> {
    return this.usersService.findOneByEmail(body)
  }

  @Post('find-owner-by-user')
  async findOwnerByUserId(@Body() body: GetOwnerByUserId): Promise<User_Owner> {
    return this.usersService.findOwnerByUserId(body)
  }

  @Post('edit-user')
  async editUser(@Body() body: EditUserDto): Promise<{ success: boolean }> {
    return this.usersService.editUser(body)
  }

  @Post('edit-credit-card')
  async editCreditCard(@Body() body: EditCreditCardDto) {
    return this.usersService.editCreditCard(body)
  }

  @Post('favourite')
  async getFavouritesByUser(
    @Body() body: GetFavouritesByUserDto,
  ): Promise<any> {
    return this.usersService.getFavouritesByUser(body)
  }

  @Post('edit-favourite')
  async editFavourite(@Body() body: EditFavouriteDto): Promise<string[]> {
    return this.usersService.editFavourite(body)
  }
}
