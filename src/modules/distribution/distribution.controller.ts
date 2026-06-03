import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateAllocationPlanDto } from './distribution.dto';
import { DistributionService } from './distribution.service';

@ApiTags('distribution')
@Controller('distribution')
export class DistributionController {
  constructor(private readonly service: DistributionService) {}

  @Get('alerts') listAlerts() { return this.service.listAlerts(); }
  @Post('plans') createPlan(@Body() body: CreateAllocationPlanDto) { return this.service.createPlan(body); }
  @Get('plans/:id') getPlan(@Param('id', ParseIntPipe) id: number) { return this.service.getPlan(id); }
  @Post('plans/:id/simulate') simulate(@Param('id', ParseIntPipe) id: number) { return this.service.simulate(id); }
}
