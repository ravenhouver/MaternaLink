import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { AuthGuard } from '../../common/auth/auth.guard';
import { buildClearSessionCookie, buildSessionCookie } from '../../common/auth/auth-utils';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CreateUserDto, LoginDto, UpdateUserDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.login(body.username, body.password);
    response.setHeader('Set-Cookie', buildSessionCookie(result.token));
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Set-Cookie', buildClearSessionCookie());
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: { user: CurrentUser }) {
    return request.user;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('users')
  users() {
    return this.service.listUsers();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('users')
  createUser(@Req() request: { user: CurrentUser }, @Body() body: CreateUserDto) {
    return this.service.createUser(request.user, body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id')
  updateUser(@Req() request: { user: CurrentUser }, @Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.service.updateUser(request.user, id, body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete('users/:id')
  removeUser(@Req() request: { user: CurrentUser }, @Param('id') id: string) {
    return this.service.removeUser(request.user, id);
  }
}
