import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @ApiOperation({ summary: 'Check AI gateway health' })
  @ApiResponse({ status: 200, description: 'AI gateway health returned' })
  @Get('health')
  getHealth() {
    return this.service.getHealth();
  }
}
