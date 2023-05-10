import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ErrorType, UserSignUpType, UserType } from './types/user.type';
import { UserDto } from './dto/user.dto';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller()
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Post('/auth/create-user')
  createUser(@Body() user: UserDto): Promise<UserSignUpType | ErrorType> {
    return this.authService.signup(user);
  }

  @Get('/auth/login-user')
  loginUser(@Body() user: UserDto): Promise<UserType | ErrorType> {
    return this.authService.signin(user);
  }

  @Post('/auth/verify-user/:token')
  verifyUser(@Req() request: Request): Promise<UserType> {
    const { token } = request.params;
    return this.authService.verifyUser(token);
  }
}
