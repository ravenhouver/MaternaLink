import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { CurrentUser } from './current-user';

export function scopedPuskesmasId(user: CurrentUser, requested?: string | null) {
  if (user.role === UserRole.BIDAN_PUSKESMAS) {
    if (!user.puskesmasId) throw new ForbiddenException('Current user is not assigned to a puskesmas');
    if (requested && requested !== user.puskesmasId) throw new ForbiddenException('Forbidden for requested puskesmas');
    return user.puskesmasId;
  }
  return requested ?? undefined;
}

export function requiredScopedPuskesmasId(user: CurrentUser, requested?: string | null) {
  const puskesmasId = scopedPuskesmasId(user, requested);
  if (!puskesmasId) throw new ForbiddenException('Puskesmas context is required');
  return puskesmasId;
}

export function assertOwnPuskesmas(user: CurrentUser, puskesmasId: string) {
  if (user.role === UserRole.BIDAN_PUSKESMAS && user.puskesmasId !== puskesmasId) {
    throw new ForbiddenException('Forbidden for requested puskesmas');
  }
}
