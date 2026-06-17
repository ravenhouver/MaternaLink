import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AiWorkflowStateQueryDto, RunAiWorkflowDto } from './workflow.dto';
import { WorkflowService } from './workflow.service';

@ApiTags('workflow')
@UseGuards(AuthGuard, RolesGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @ApiOperation({ summary: 'Start hosted AI demo workflow' })
  @ApiResponse({ status: 201, description: 'Demo workflow job started' })
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('demo/run')
  runDemo(@Req() request: { user: CurrentUser }) {
    return this.service.runDemo(request.user);
  }

  @ApiOperation({ summary: 'Start hosted AI workflow for a puskesmas period' })
  @ApiResponse({ status: 201, description: 'AI workflow job started' })
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Post('ai/run')
  runAi(@Body() body: RunAiWorkflowDto, @Req() request: { user: CurrentUser }) {
    return this.service.runAi(body, request.user);
  }

  @ApiOperation({ summary: 'Get hosted AI demo workflow state' })
  @ApiResponse({ status: 200, description: 'Demo workflow state returned' })
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN)
  @Get('demo/state')
  getDemoState() {
    return this.service.getDemoState();
  }

  @ApiOperation({ summary: 'Get hosted AI workflow state for a puskesmas period' })
  @ApiResponse({ status: 200, description: 'AI workflow state returned' })
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('ai/state')
  getAiState(@Query() query: AiWorkflowStateQueryDto, @Req() request: { user: CurrentUser }) {
    return this.service.getAiState(query, request.user);
  }
}
