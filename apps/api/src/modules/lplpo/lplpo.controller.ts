import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GenerateLplpoDto } from './lplpo.dto';
import { LplpoService } from './lplpo.service';

@ApiTags('lplpo')
@Controller('lplpo')
export class LplpoController {
  constructor(private readonly service: LplpoService) {}

  @ApiOperation({ summary: 'Generate predictive LPLPO request from latest forecast' })
  @ApiResponse({ status: 201, description: 'LPLPO rows generated' })
  @Post('generate') generate(@Body() body: GenerateLplpoDto) { return this.service.generate(body); }
  @ApiOperation({ summary: 'List predictive LPLPO rows' })
  @ApiResponse({ status: 200, description: 'LPLPO rows returned' })
  @Get() list(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.list(puskesmasId, periode); }
}
