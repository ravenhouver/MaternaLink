import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import type { CurrentUser } from '../../common/auth/current-user';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CreateQueueDto, UpdateQueueStatusDto } from './queue.dto';
import { QueueService } from './queue.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.BIDAN_PUSKESMAS)
@Controller('queue')
export class QueueController {
  constructor(private readonly service: QueueService) {}

  @Post()
  create(@Body() body: CreateQueueDto, @Req() request: { user: CurrentUser }) {
    return this.service.create(body, request.user);
  }

  @Get('today')
  today(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string) {
    return this.service.today(request.user, puskesmasId);
  }

  @Get()
  list(@Req() request: { user: CurrentUser }, @Query('puskesmasId') puskesmasId?: string, @Query('status') status?: string) {
    return this.service.list(request.user, { puskesmasId, status });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateQueueStatusDto, @Req() request: { user: CurrentUser }) {
    return this.service.updateStatus(id, body, request.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: { user: CurrentUser }) {
    return this.service.remove(id, request.user);
  }
}
