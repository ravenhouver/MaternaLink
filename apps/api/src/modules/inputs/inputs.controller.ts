import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AnamnesisInputDto, DiagnosisInputDto, GejalaInputDto, KonteksInputDto, StokInputDto } from './inputs.dto';
import { InputsService } from './inputs.service';

@ApiTags('inputs')
@Controller('inputs')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
export class InputsController {
  constructor(private readonly service: InputsService) {}

  @ApiOperation({ summary: 'Upsert monthly diagnosis input' })
  @ApiResponse({ status: 201, description: 'Diagnosis input saved' })
  @Get('diagnosis') listDiagnosis(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listDiagnosis(request.user, puskesmasId, periode); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('diagnosis') createDiagnosis(@Req() request: { user: CurrentUser }, @Body() body: DiagnosisInputDto) { return this.service.createDiagnosis(request.user, body); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Delete('diagnosis/:id') removeDiagnosis(@Req() request: { user: CurrentUser }, @Param('id', ParseIntPipe) id: number) { return this.service.removeDiagnosis(request.user, id); }
  @ApiOperation({ summary: 'Upsert monthly symptom input' })
  @ApiResponse({ status: 201, description: 'Symptom input saved' })
  @Get('gejala') listGejala(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listGejala(request.user, puskesmasId, periode); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('gejala') createGejala(@Req() request: { user: CurrentUser }, @Body() body: GejalaInputDto) { return this.service.createGejala(request.user, body); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Delete('gejala/:id') removeGejala(@Req() request: { user: CurrentUser }, @Param('id', ParseIntPipe) id: number) { return this.service.removeGejala(request.user, id); }
  @ApiOperation({ summary: 'Upsert monthly puskesmas context input' })
  @ApiResponse({ status: 201, description: 'Context input saved' })
  @Get('konteks') listKonteks(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listKonteks(request.user, puskesmasId, periode); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('konteks') createKonteks(@Req() request: { user: CurrentUser }, @Body() body: KonteksInputDto) { return this.service.createKonteks(request.user, body); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Delete('konteks/:id') removeKonteks(@Req() request: { user: CurrentUser }, @Param('id', ParseIntPipe) id: number) { return this.service.removeKonteks(request.user, id); }
  @ApiOperation({ summary: 'Upsert monthly medicine stock input' })
  @ApiResponse({ status: 201, description: 'Stock input saved' })
  @Get('stok') listStok(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listStok(request.user, puskesmasId, periode); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('stok') createStok(@Req() request: { user: CurrentUser }, @Body() body: StokInputDto) { return this.service.createStok(request.user, body); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Delete('stok/:id') removeStok(@Req() request: { user: CurrentUser }, @Param('id', ParseIntPipe) id: number) { return this.service.removeStok(request.user, id); }
  @ApiOperation({ summary: 'Create raw anamnesis transcript input' })
  @ApiResponse({ status: 201, description: 'Anamnesis input saved' })
  @Get('anamnesis') listAnamnesis(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listAnamnesis(request.user, puskesmasId, periode); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('anamnesis') createAnamnesis(@Req() request: { user: CurrentUser }, @Body() body: AnamnesisInputDto) { return this.service.createAnamnesis(request.user, body); }
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Delete('anamnesis/:id') removeAnamnesis(@Req() request: { user: CurrentUser }, @Param('id', ParseIntPipe) id: number) { return this.service.removeAnamnesis(request.user, id); }
}
