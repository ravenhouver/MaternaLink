import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { createSessionToken, hashPassword, verifyPassword } from '../../common/auth/auth-utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './auth.dto';

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

  async createUser(actor: CurrentUser, data: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          displayName: data.displayName,
          role: data.role,
          puskesmasId: data.role === UserRole.BIDAN_PUSKESMAS ? data.puskesmasId : null,
          active: data.active ?? true,
          passwordHash: hashPassword(data.password),
        },
        select: this.userSelect(),
      });
      await this.audit(actor.id, 'admin.user.create', user.id, { username: user.username, role: user.role });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Username sudah dipakai');
      }
      throw error;
    }
  }

  async updateUser(actor: CurrentUser, id: string, data: UpdateUserDto) {
    if (actor.id === id && data.active === false) throw new ForbiddenException('Tidak bisa menonaktifkan akun sendiri');
    const role = data.role;
    const update: Prisma.UserUpdateInput = {
      username: data.username,
      displayName: data.displayName,
      role,
      active: data.active,
      puskesmas: role === UserRole.BIDAN_PUSKESMAS && data.puskesmasId ? { connect: { id: data.puskesmasId } } : role && role !== UserRole.BIDAN_PUSKESMAS ? { disconnect: true } : undefined,
      passwordHash: data.password ? hashPassword(data.password) : undefined,
    };

    try {
      const user = await this.prisma.user.update({ where: { id }, data: update, select: this.userSelect() });
      await this.audit(actor.id, 'admin.user.update', user.id, { username: user.username, role: user.role, active: user.active });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Username sudah dipakai');
      }
      throw error;
    }
  }

  async removeUser(actor: CurrentUser, id: string) {
    if (actor.id === id) throw new ForbiddenException('Tidak bisa menghapus akun sendiri');
    try {
      await this.prisma.user.delete({ where: { id } });
      await this.audit(actor.id, 'admin.user.delete', id, null);
      return { id, deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        const user = await this.prisma.user.update({ where: { id }, data: { active: false }, select: this.userSelect() });
        await this.audit(actor.id, 'admin.user.deactivate', id, { reason: 'linked records' });
        return user;
      }
      throw error;
    }
  }

  private userSelect() {
    return {
      id: true,
      username: true,
      displayName: true,
      role: true,
      puskesmasId: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      puskesmas: { select: { id: true, nama: true, kecamatan: true } },
    } satisfies Prisma.UserSelect;
  }

  private audit(userId: string, action: string, entityId: string, metadata: Prisma.InputJsonValue | null) {
    return this.prisma.auditLog.create({ data: { userId, action, entityType: 'User', entityId, metadata: metadata ?? undefined } });
  }
}
