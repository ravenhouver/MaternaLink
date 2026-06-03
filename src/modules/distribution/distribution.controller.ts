import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAllocationPlanDto } from './distribution.dto';
import { DistributionService } from './distribution.service';

@ApiTags('distribution')
@Controller('distribution')
export class DistributionController {
  constructor(private readonly service: DistributionService) {}

  @ApiOperation({ summary: 'List distribution alerts' })
  @ApiResponse({ status: 200, description: 'Alerts returned' })
  @Get('alerts') listAlerts() { return this.service.listAlerts(); }
  @ApiOperation({ summary: 'Create allocation plan' })
  @ApiResponse({ status: 201, description: 'Allocation plan created' })
  @Post('plans') createPlan(@Body() body: CreateAllocationPlanDto) { return this.service.createPlan(body); }
  @ApiOperation({ summary: 'Get allocation plan by ID' })
  @ApiResponse({ status: 200, description: 'Allocation plan returned' })
  @Get('plans/:id') getPlan(@Param('id', ParseIntPipe) id: number) { return this.service.getPlan(id); }
  @ApiOperation({ summary: 'Simulate allocation route and cold-chain risk' })
  @ApiResponse({ status: 201, description: 'Simulation result returned with alerts' })
  @Post('plans/:id/simulate') simulate(@Param('id', ParseIntPipe) id: number) { return this.service.simulate(id); }
}
