import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
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
  @Get('diagnosis') listDiagnosis(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listDiagnosis(puskesmasId, periode); }
  @Post('diagnosis') createDiagnosis(@Body() body: DiagnosisInputDto) { return this.service.createDiagnosis(body); }
  @Delete('diagnosis/:id') removeDiagnosis(@Param('id', ParseIntPipe) id: number) { return this.service.removeDiagnosis(id); }
  @ApiOperation({ summary: 'Upsert monthly symptom input' })
  @ApiResponse({ status: 201, description: 'Symptom input saved' })
  @Get('gejala') listGejala(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listGejala(puskesmasId, periode); }
  @Post('gejala') createGejala(@Body() body: GejalaInputDto) { return this.service.createGejala(body); }
  @Delete('gejala/:id') removeGejala(@Param('id', ParseIntPipe) id: number) { return this.service.removeGejala(id); }
  @ApiOperation({ summary: 'Upsert monthly puskesmas context input' })
  @ApiResponse({ status: 201, description: 'Context input saved' })
  @Get('konteks') listKonteks(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listKonteks(puskesmasId, periode); }
  @Post('konteks') createKonteks(@Body() body: KonteksInputDto) { return this.service.createKonteks(body); }
  @Delete('konteks/:id') removeKonteks(@Param('id', ParseIntPipe) id: number) { return this.service.removeKonteks(id); }
  @ApiOperation({ summary: 'Upsert monthly medicine stock input' })
  @ApiResponse({ status: 201, description: 'Stock input saved' })
  @Get('stok') listStok(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listStok(puskesmasId, periode); }
  @Post('stok') createStok(@Body() body: StokInputDto) { return this.service.createStok(body); }
  @Delete('stok/:id') removeStok(@Param('id', ParseIntPipe) id: number) { return this.service.removeStok(id); }
  @ApiOperation({ summary: 'Create raw anamnesis transcript input' })
  @ApiResponse({ status: 201, description: 'Anamnesis input saved' })
  @Get('anamnesis') listAnamnesis(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.listAnamnesis(puskesmasId, periode); }
  @Post('anamnesis') createAnamnesis(@Body() body: AnamnesisInputDto) { return this.service.createAnamnesis(body); }
  @Delete('anamnesis/:id') removeAnamnesis(@Param('id', ParseIntPipe) id: number) { return this.service.removeAnamnesis(id); }
}
