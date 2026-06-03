import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenerateLplpoDto } from './lplpo.dto';
import { LplpoService } from './lplpo.service';

@ApiTags('lplpo')
@Controller('lplpo')
export class LplpoController {
  constructor(private readonly service: LplpoService) {}

  @Post('generate') generate(@Body() body: GenerateLplpoDto) { return this.service.generate(body); }
  @Get() list(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.list(puskesmasId, periode); }
}
