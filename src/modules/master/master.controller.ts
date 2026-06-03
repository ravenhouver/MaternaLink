import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateObatDto, CreatePuskesmasDto } from './master.dto';
import { MasterService } from './master.service';

@ApiTags('master')
@Controller('master')
export class MasterController {
  constructor(private readonly service: MasterService) {}

  @Get('puskesmas')
  listPuskesmas() {
    return this.service.listPuskesmas();
  }

  @Post('puskesmas')
  createPuskesmas(@Body() body: CreatePuskesmasDto) {
    return this.service.createPuskesmas(body);
  }

  @Get('obat')
  listObat() {
    return this.service.listObat();
  }

  @Post('obat')
  createObat(@Body() body: CreateObatDto) {
    return this.service.createObat(body);
  }

  @Get('kondisi')
  listKondisi() {
    return this.service.listKondisi();
  }

  @Get('gejala')
  listGejala() {
    return this.service.listGejala();
  }
}
