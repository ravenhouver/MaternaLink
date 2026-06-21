import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import {
  CreateAllocationPlanDto,
  CreateShipmentRequestDto,
  ListRecommendationsQueryDto,
  RejectRecommendationDto,
  ReorderRecommendationsDto,
  RunAiAllocationDto,
  TrackingEventDto,
  UpdateAllocationPlanDto,
  UpdateRecommendationItemDto,
} from './distribution.dto';
import { DistributionService } from './distribution.service';

@ApiTags('distribution')
@Controller('distribution')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
export class DistributionController {
  constructor(private readonly service: DistributionService) {}

  @ApiOperation({ summary: 'Get IFK dashboard operations summary' })
  @ApiResponse({ status: 200, description: 'IFK dashboard summary returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('ifk/dashboard')
  getIfkDashboard() { return this.service.getIfkDashboard(); }

  @ApiOperation({ summary: 'Get IFK facility operational registry' })
  @ApiResponse({ status: 200, description: 'IFK facility registry returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('ifk/facilities')
  getIfkFacilities() { return this.service.getIfkFacilities(); }

  @ApiOperation({ summary: 'Get IFK decision history ledger' })
  @ApiResponse({ status: 200, description: 'IFK decision history returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('ifk/decision-history')
  getIfkDecisionHistory() { return this.service.getIfkDecisionHistory(); }

  @ApiOperation({ summary: 'Get IFK environment risk summary' })
  @ApiResponse({ status: 200, description: 'IFK environment summary returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('ifk/environment')
  getIfkEnvironment() { return this.service.getIfkEnvironment(); }

  @ApiOperation({ summary: 'List distribution recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations returned' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('recommendations')
  listRecommendations(@Req() request: { user: CurrentUser }, @Query() query: ListRecommendationsQueryDto) { return this.service.listRecommendations(query, request.user); }

  @ApiOperation({ summary: 'Get distribution recommendation by ID' })
  @ApiResponse({ status: 200, description: 'Recommendation returned' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('recommendations/:id')
  getRecommendation(@Param('id') id: string, @Req() request: { user: CurrentUser }) { return this.service.getRecommendation(id, request.user); }

  @ApiOperation({ summary: 'Create shipment request from puskesmas forecast' })
  @ApiResponse({ status: 201, description: 'Shipment request created' })
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('requests')
  createShipmentRequest(@Body() body: CreateShipmentRequestDto, @Req() request: { user: CurrentUser }) { return this.service.createShipmentRequest(body, request.user); }

  @ApiOperation({ summary: 'Run hosted AI allocation for IFK recommendations' })
  @ApiResponse({ status: 201, description: 'Hosted AI allocation recommendations generated' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Post('ifk/ai-allocation')
  runAiAllocation(@Body() body: RunAiAllocationDto) { return this.service.runAiAllocation(body); }

  @ApiOperation({ summary: 'Reorder recommendation priority' })
  @ApiResponse({ status: 200, description: 'Recommendations reordered' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.IFK_ADMIN)
  @Patch('recommendations/reorder')
  reorderRecommendations(@Body() body: ReorderRecommendationsDto) { return this.service.reorderRecommendations(body.orderedIds); }

  @ApiOperation({ summary: 'Override recommendation item quantity' })
  @ApiResponse({ status: 200, description: 'Recommendation item updated' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.IFK_ADMIN)
  @Patch('recommendations/:id/items/:itemId')
  updateRecommendationItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() body: UpdateRecommendationItemDto) {
    return this.service.updateRecommendationItem(id, itemId, body);
  }

  @ApiOperation({ summary: 'Approve distribution recommendation' })
  @ApiResponse({ status: 200, description: 'Recommendation approved' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.IFK_ADMIN)
  @Patch('recommendations/:id/approve')
  approveRecommendation(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.approveRecommendation(id, request.user.id);
  }

  @ApiOperation({ summary: 'Reject distribution recommendation' })
  @ApiResponse({ status: 200, description: 'Recommendation rejected' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.IFK_ADMIN)
  @Patch('recommendations/:id/reject')
  rejectRecommendation(@Param('id') id: string, @Body() body: RejectRecommendationDto, @Req() request: { user: CurrentUser }) {
    return this.service.rejectRecommendation(id, request.user.id, body.note);
  }

  @ApiOperation({ summary: 'Re-request a rejected distribution recommendation' })
  @ApiResponse({ status: 200, description: 'Recommendation moved back to pending review' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS)
  @Post('recommendations/:id/rerequest')
  rerequestRecommendation(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.rerequestRecommendation(id, request.user);
  }

  @ApiOperation({ summary: 'List shipment tracking events' })
  @ApiResponse({ status: 200, description: 'Tracking events returned' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('recommendations/:id/tracking')
  getTracking(@Param('id') id: string, @Req() request: { user: CurrentUser }) { return this.service.getTracking(id, request.user); }

  @ApiOperation({ summary: 'Add shipment tracking event' })
  @ApiResponse({ status: 201, description: 'Tracking event added' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN)
  @Post('recommendations/:id/tracking/events')
  addTrackingEvent(@Param('id') id: string, @Body() body: TrackingEventDto, @Req() request: { user: CurrentUser }) {
    return this.service.addTrackingEvent(id, request.user, body);
  }

  @ApiOperation({ summary: 'List distribution alerts' })
  @ApiResponse({ status: 200, description: 'Alerts returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('alerts') listAlerts() { return this.service.listAlerts(); }
  @ApiOperation({ summary: 'Create allocation plan' })
  @ApiResponse({ status: 201, description: 'Allocation plan created' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Post('plans') createPlan(@Body() body: CreateAllocationPlanDto) { return this.service.createPlan(body); }
  @ApiOperation({ summary: 'List allocation plans' })
  @ApiResponse({ status: 200, description: 'Allocation plans returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('plans') listPlans(@Query('puskesmasId') puskesmasId?: string) { return this.service.listPlans(puskesmasId); }
  @ApiOperation({ summary: 'Get allocation plan by ID' })
  @ApiResponse({ status: 200, description: 'Allocation plan returned' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Get('plans/:id') getPlan(@Param('id', ParseIntPipe) id: number) { return this.service.getPlan(id); }
  @ApiOperation({ summary: 'Update allocation plan' })
  @ApiResponse({ status: 200, description: 'Allocation plan updated' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Patch('plans/:id') updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAllocationPlanDto) { return this.service.updatePlan(id, body); }
  @ApiOperation({ summary: 'Delete allocation plan' })
  @ApiResponse({ status: 200, description: 'Allocation plan deleted' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Delete('plans/:id') removePlan(@Param('id', ParseIntPipe) id: number) { return this.service.removePlan(id); }
  @ApiOperation({ summary: 'Simulate allocation route and cold-chain risk' })
  @ApiResponse({ status: 201, description: 'Simulation result returned with alerts' })
  @Roles(UserRole.IFK_ADMIN, UserRole.SUPER_ADMIN)
  @Post('plans/:id/simulate') simulate(@Param('id', ParseIntPipe) id: number) { return this.service.simulate(id); }
}
