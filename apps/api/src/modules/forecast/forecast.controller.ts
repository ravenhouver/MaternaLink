import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RunForecastDto } from './forecast.dto';
import { ForecastService } from './forecast.service';

@ApiTags('forecast')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly service: ForecastService) {}

  @ApiOperation({ summary: 'Run deterministic stock forecast' })
  @ApiResponse({ status: 201, description: 'Forecast run created with prediction rows' })
  @Post('run') run(@Body() body: RunForecastDto) { return this.service.run(body); }
  @ApiOperation({ summary: 'List forecast runs' })
  @ApiResponse({ status: 200, description: 'Forecast runs returned' })
  @Get('runs') listRuns() { return this.service.listRuns(); }
  @ApiOperation({ summary: 'Get forecast result rows by run ID' })
  @ApiResponse({ status: 200, description: 'Forecast result returned' })
  @Get('runs/:id/results') getResults(@Param('id', ParseIntPipe) id: number) { return this.service.getResults(id); }
}
