import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CreateObatDto, CreatePuskesmasDto, UpdateObatDto, UpdatePuskesmasDto } from './master.dto';
import { MasterService } from './master.service';

@ApiTags('master')
@Controller('master')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
export class MasterController {
  constructor(private readonly service: MasterService) {}

  @ApiOperation({ summary: 'List puskesmas master data with logistics metadata' })
  @ApiResponse({ status: 200, description: 'Puskesmas list returned' })
  @Get('puskesmas')
  listPuskesmas() {
    return this.service.listPuskesmas();
  }

  @ApiOperation({ summary: 'Sync hosted AI master data into local tables' })
  @ApiResponse({ status: 201, description: 'Hosted AI master data synced' })
  @Roles(UserRole.SUPER_ADMIN)
  @Post('ai/sync')
  syncAiMasterData() {
    return this.service.syncAiMasterData();
  }

  @ApiOperation({ summary: 'Create puskesmas master data' })
  @ApiResponse({ status: 201, description: 'Puskesmas created' })
  @Roles(UserRole.SUPER_ADMIN)
  @Post('puskesmas')
  createPuskesmas(@Body() body: CreatePuskesmasDto) {
    return this.service.createPuskesmas(body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('puskesmas/:id')
  updatePuskesmas(@Param('id') id: string, @Body() body: UpdatePuskesmasDto) {
    return this.service.updatePuskesmas(id, body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('puskesmas/:id')
  removePuskesmas(@Param('id') id: string) {
    return this.service.removePuskesmas(id);
  }

  @ApiOperation({ summary: 'List medicine master data' })
  @ApiResponse({ status: 200, description: 'Medicine list returned' })
  @Get('obat')
  listObat() {
    return this.service.listObat();
  }

  @ApiOperation({ summary: 'Create medicine master data' })
  @ApiResponse({ status: 201, description: 'Medicine created' })
  @Roles(UserRole.SUPER_ADMIN)
  @Post('obat')
  createObat(@Body() body: CreateObatDto) {
    return this.service.createObat(body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('obat/:id')
  updateObat(@Param('id') id: string, @Body() body: UpdateObatDto) {
    return this.service.updateObat(id, body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('obat/:id')
  removeObat(@Param('id') id: string) {
    return this.service.removeObat(id);
  }

  @ApiOperation({ summary: 'List clinical conditions' })
  @ApiResponse({ status: 200, description: 'Condition list returned' })
  @Get('kondisi')
  listKondisi() {
    return this.service.listKondisi();
  }

  @ApiOperation({ summary: 'List maternal symptoms' })
  @ApiResponse({ status: 200, description: 'Symptom list returned' })
  @Get('gejala')
  listGejala() {
    return this.service.listGejala();
  }
}
