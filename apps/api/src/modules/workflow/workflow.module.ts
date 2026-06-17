import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ForecastModule } from '../forecast/forecast.module';
import { LplpoModule } from '../lplpo/lplpo.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({ imports: [AiModule, ForecastModule, LplpoModule], controllers: [WorkflowController], providers: [WorkflowService] })
export class WorkflowModule {}
