import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AiExaminationDraftDto, CreateExaminationDto, UpdateExaminationDto } from './examinations.dto';
import { ExaminationsService } from './examinations.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS)
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly service: ExaminationsService) {}

  @Post()
  create(@Body() body: CreateExaminationDto, @Req() request: { user: CurrentUser }) {
    return this.service.create(body, request.user);
  }

  @Post('ai/draft')
  createAiDraft(@Body() body: AiExaminationDraftDto, @Req() request: { user: CurrentUser }) {
    return this.service.createAiDraft(body, request.user);
  }

  @Get()
  list(@Req() request: { user: CurrentUser }, @Query('patientId') patientId?: string, @Query('puskesmasId') puskesmasId?: string) {
    return this.service.list(request.user, { patientId, puskesmasId });
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.get(id, request.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExaminationDto, @Req() request: { user: CurrentUser }) {
    return this.service.update(id, body, request.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.remove(id, request.user);
  }
}
