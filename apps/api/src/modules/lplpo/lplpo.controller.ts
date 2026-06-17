import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { GenerateLplpoDto } from './lplpo.dto';
import { LplpoService } from './lplpo.service';

@ApiTags('lplpo')
@Controller('lplpo')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
export class LplpoController {
  constructor(private readonly service: LplpoService) {}

  @ApiOperation({ summary: 'Generate predictive LPLPO request from latest forecast' })
  @ApiResponse({ status: 201, description: 'LPLPO rows generated' })
  @Post('generate') generate(@Body() body: GenerateLplpoDto) { return this.service.generate(body); }
  @ApiOperation({ summary: 'List predictive LPLPO rows' })
  @ApiResponse({ status: 200, description: 'LPLPO rows returned' })
  @Get() list(@Query('puskesmasId') puskesmasId?: string, @Query('periode') periode?: string) { return this.service.list(puskesmasId, periode); }
}
