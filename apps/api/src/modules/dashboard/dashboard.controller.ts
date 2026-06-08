import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { RolesGuard } from '../../common/auth/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@UseGuards(AuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @ApiOperation({ summary: 'Get role-aware dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary returned' })
  @Get('summary')
  getSummary(@Req() request: { user: CurrentUser }) {
    return this.service.getSummary(request.user);
  }
}
