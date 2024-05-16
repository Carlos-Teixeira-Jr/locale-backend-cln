import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'

import { InjectorLoggerService } from 'modules/logger/InjectorLoggerService'
import { LoggerService } from 'modules/logger/logger.service'
import {
  FindUserByOwnerOut,
  IFavPropertiesReturn,
  PartialUserData,
  User_Owner,
  UsersService,
} from './users.service'
import { GetUserDto } from './dto/get-user.dto'
import { GetUserByEmailDto } from './dto/get-user-by-email-dto.sto'
import { GetOwnerByUserId } from './dto/get-owner-by-user-id'
import { EditUserDto } from './dto/edit-user.dto'
import { EditFavouriteDto } from './dto/edit-favourite.dto'
import { GetFavouritesByUserDto } from './dto/favourite-property.dto'
import { IUser } from 'common/schemas/User.schema'
import { EditCreditCardDto } from './dto/editCreditCard.dto'
import { DeleteUserDto } from './dto/delete-user.dto'
import { Schema } from 'mongoose'

@ApiTags('users')
@Controller('user')
export class UsersController {
  constructor(
    @InjectorLoggerService(UsersController.name)
    private readonly logger: LoggerService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Find and return an user by his id.',
  })
  @Get(':_id')
  async findUserById(@Param() params: GetUserDto): Promise<PartialUserData> {
    this.logger.log({ params }, 'start find user by id > [controller]')

    return this.usersService.findOne(params._id)
  }

  @ApiOperation({
    summary: 'Find and return an user by his email.',
  })
  @Post('find-by-email')
  async findByEmail(@Body() body: GetUserByEmailDto): Promise<IUser> {
    this.logger.log({ body }, 'start find user by email > [controller]')

    return this.usersService.findOneByEmail(body)
  }

  @ApiOperation({
    summary: 'Find and return an owner by his user id.',
  })
  @Post('find-owner-by-user')
  async findOwnerByUserId(
    @Body() userId: GetOwnerByUserId,
  ): Promise<User_Owner> {
    this.logger.log({ userId }, 'start find owner by user id > [controller]')

    const owner = await this.usersService.findOwnerByUserId(userId)

    return owner
  }

  @ApiOperation({
    summary: 'Find and return the user by his owner id.',
  })
  @Get('find-user-by-owner/:id')
  async findUserByOwner(
    @Param('id') ownerId: Schema.Types.ObjectId,
  ): Promise<FindUserByOwnerOut> {
    this.logger.log({ ownerId }, 'start find user by owner id > [controller]')

    return this.usersService.findUserByOwner(ownerId)
  }

  @ApiOperation({
    summary: 'Update the user and owner data.',
  })
  @Post('edit-user')
  async editUser(@Body() body: EditUserDto) {
    this.logger.log({ body }, 'start edit user > [controller]')

    return this.usersService.editUser(body)
  }

  @ApiOperation({
    summary: 'Update the payment data of an user.',
  })
  @Post('edit-credit-card')
  async editCreditCard(
    @Body() body: EditCreditCardDto,
  ): Promise<{ success: boolean }> {
    this.logger.log({ body }, 'start edit user payment data > [controller]')

    return this.usersService.editCreditCard(body)
  }

  @ApiOperation({
    summary: 'Returns the array with the ids of his favourited properties.',
  })
  @Post('favourite')
  async getFavouritesByUser(
    @Body() body: GetFavouritesByUserDto,
  ): Promise<IFavPropertiesReturn> {
    this.logger.log({ body }, 'start favourite property > [controller]')

    return this.usersService.getFavouritesByUser(body)
  }

  @ApiOperation({
    summary: 'Update the favourited properties array of the user.',
  })
  @Post('edit-favourite')
  async editFavourite(@Body() body: EditFavouriteDto): Promise<string[]> {
    this.logger.log({ body }, 'start edit favourites > [controller]')

    return this.usersService.editFavourite(body)
  }

  @ApiOperation({
    summary:
      'Deactivate an user account by his user id. The user data is still on the DB but with a status of deactivated.',
  })
  @Delete()
  async DeleteUserDto(
    @Body() deleteUserDto: DeleteUserDto,
  ): Promise<{ success: boolean }> {
    this.logger.log({ deleteUserDto }, 'start delete user > [controller]')
    return this.usersService.deleteUser(deleteUserDto)
  }
}
