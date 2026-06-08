import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { getSessionCookieName, parseCookies, verifySessionToken } from './auth-utils';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const cookies = parseCookies(request.headers.cookie);
    const user = verifySessionToken(cookies[getSessionCookieName()]);
    if (!user) throw new UnauthorizedException('Authentication required');
    request.user = user;
    return true;
  }
}
