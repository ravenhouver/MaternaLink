import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { RunForecastDto } from './forecast.dto';
import { ForecastService } from './forecast.service';

@ApiTags('forecast')
@Controller('forecast')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
export class ForecastController {
  constructor(private readonly service: ForecastService) {}

  @ApiOperation({ summary: 'Run deterministic stock forecast' })
  @ApiResponse({ status: 201, description: 'Forecast run created with prediction rows' })
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('run') run(@Body() body: RunForecastDto) { return this.service.run(body); }
  @ApiOperation({ summary: 'List forecast runs' })
  @ApiResponse({ status: 200, description: 'Forecast runs returned' })
  @Get('runs') listRuns() { return this.service.listRuns(); }
  @ApiOperation({ summary: 'Get forecast result rows by run ID' })
  @ApiResponse({ status: 200, description: 'Forecast result returned' })
  @Get('runs/:id/results') getResults(@Param('id', ParseIntPipe) id: number) { return this.service.getResults(id); }
}
