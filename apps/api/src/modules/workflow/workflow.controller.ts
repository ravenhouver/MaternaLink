import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { WorkflowService } from './workflow.service';

@ApiTags('workflow')
@UseGuards(AuthGuard, RolesGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @ApiOperation({ summary: 'Run deterministic end-to-end demo workflow' })
  @ApiResponse({ status: 201, description: 'Demo workflow completed' })
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.SUPER_ADMIN)
  @Post('demo/run')
  runDemo(@Req() request: { user: CurrentUser }) {
    return this.service.runDemo(request.user);
  }

  @ApiOperation({ summary: 'Get deterministic demo workflow state' })
  @ApiResponse({ status: 200, description: 'Demo workflow state returned' })
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('demo/state')
  getDemoState() {
    return this.service.getDemoState();
  }
}
