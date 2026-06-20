import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DistributionController } from './distribution.controller';
import { DistributionService } from './distribution.service';

@Module({ imports: [AiModule], controllers: [DistributionController], providers: [DistributionService] })
export class DistributionModule {}
