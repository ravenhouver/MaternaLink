import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateObatDto, CreatePuskesmasDto, UpdateObatDto, UpdatePuskesmasDto } from './master.dto';
import { MasterService } from './master.service';

@ApiTags('master')
@Controller('master')
export class MasterController {
  constructor(private readonly service: MasterService) {}

  @ApiOperation({ summary: 'List puskesmas master data with logistics metadata' })
  @ApiResponse({ status: 200, description: 'Puskesmas list returned' })
  @Get('puskesmas')
  listPuskesmas() {
    return this.service.listPuskesmas();
  }

  @ApiOperation({ summary: 'Create puskesmas master data' })
  @ApiResponse({ status: 201, description: 'Puskesmas created' })
  @Post('puskesmas')
  createPuskesmas(@Body() body: CreatePuskesmasDto) {
    return this.service.createPuskesmas(body);
  }

  @Patch('puskesmas/:id')
  updatePuskesmas(@Param('id') id: string, @Body() body: UpdatePuskesmasDto) {
    return this.service.updatePuskesmas(id, body);
  }

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
  @Post('obat')
  createObat(@Body() body: CreateObatDto) {
    return this.service.createObat(body);
  }

  @Patch('obat/:id')
  updateObat(@Param('id') id: string, @Body() body: UpdateObatDto) {
    return this.service.updateObat(id, body);
  }

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
