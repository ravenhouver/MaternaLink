import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RunForecastDto } from './forecast.dto';
import { ForecastService } from './forecast.service';

@ApiTags('forecast')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly service: ForecastService) {}

  @Post('run') run(@Body() body: RunForecastDto) { return this.service.run(body); }
  @Get('runs') listRuns() { return this.service.listRuns(); }
  @Get('runs/:id/results') getResults(@Param('id', ParseIntPipe) id: number) { return this.service.getResults(id); }
}
