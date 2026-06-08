import { UserRole } from '@prisma/client';

export type CurrentUser = {
  id: string;
  username: string;
  role: UserRole;
  puskesmasId: string | null;
};
