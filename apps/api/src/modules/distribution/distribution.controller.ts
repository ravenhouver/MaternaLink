import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import {
  CreateAllocationPlanDto,
  ListRecommendationsQueryDto,
  RejectRecommendationDto,
  ReorderRecommendationsDto,
  TrackingEventDto,
  UpdateRecommendationItemDto,
} from './distribution.dto';
import { DistributionService } from './distribution.service';

@ApiTags('distribution')
@Controller('distribution')
export class DistributionController {
  constructor(private readonly service: DistributionService) {}

  @ApiOperation({ summary: 'List distribution recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations returned' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN)
  @Get('recommendations')
  listRecommendations(@Query() query: ListRecommendationsQueryDto) { return this.service.listRecommendations(query); }

  @ApiOperation({ summary: 'Get distribution recommendation by ID' })
  @ApiResponse({ status: 200, description: 'Recommendation returned' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN)
  @Get('recommendations/:id')
  getRecommendation(@Param('id') id: string) { return this.service.getRecommendation(id); }

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

  @ApiOperation({ summary: 'List shipment tracking events' })
  @ApiResponse({ status: 200, description: 'Tracking events returned' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.BIDAN_PUSKESMAS, UserRole.IFK_ADMIN)
  @Get('recommendations/:id/tracking')
  getTracking(@Param('id') id: string) { return this.service.getTracking(id); }

  @ApiOperation({ summary: 'Add shipment tracking event' })
  @ApiResponse({ status: 201, description: 'Tracking event added' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.IFK_ADMIN)
  @Post('recommendations/:id/tracking/events')
  addTrackingEvent(@Param('id') id: string, @Body() body: TrackingEventDto, @Req() request: { user: CurrentUser }) {
    return this.service.addTrackingEvent(id, request.user.id, body);
  }

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
