import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../common/auth/auth.guard';
import { buildClearSessionCookie, buildSessionCookie } from '../../common/auth/auth-utils';
import type { CurrentUser } from '../../common/auth/current-user';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.service.login(body.username, body.password);
    response.setHeader('Set-Cookie', buildSessionCookie(result.token));
    return result.user;
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
}
