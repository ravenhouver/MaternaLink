import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CreateExaminationDto } from './examinations.dto';
import { ExaminationsService } from './examinations.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly service: ExaminationsService) {}

  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() body: CreateExaminationDto, @Req() request: { user: CurrentUser }) {
    return this.service.create(body, request.user);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }
}
