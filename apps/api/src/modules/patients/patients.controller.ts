import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CreatePatientDto } from './patients.dto';
import { PatientsService } from './patients.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() body: CreatePatientDto, @Req() request: { user: CurrentUser }) {
    return this.service.create(body, request.user);
  }

  @Get()
  list(@Req() request: { user: CurrentUser }) {
    return this.service.list(request.user);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.get(id, request.user);
  }
}
