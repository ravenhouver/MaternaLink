import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CreatePatientDto, UpdatePatientDto } from './patients.dto';
import { PatientsService } from './patients.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS)
@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdatePatientDto, @Req() request: { user: CurrentUser }) {
    return this.service.update(id, body, request.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.remove(id, request.user);
  }
}
