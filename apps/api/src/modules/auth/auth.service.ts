import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createSessionToken, verifyPassword } from '../../common/auth/auth-utils';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const currentUser = { id: user.id, username: user.username, role: user.role, puskesmasId: user.puskesmasId };
    const token = createSessionToken(currentUser);

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'auth.login', entityType: 'User', entityId: user.id },
    });

    return { user: currentUser, token };
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        puskesmasId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        puskesmas: { select: { id: true, nama: true, kecamatan: true } },
      },
    });
  }
}
