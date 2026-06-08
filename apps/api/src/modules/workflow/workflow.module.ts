import { Module } from '@nestjs/common';
import { ForecastModule } from '../forecast/forecast.module';
import { LplpoModule } from '../lplpo/lplpo.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({ imports: [ForecastModule, LplpoModule], controllers: [WorkflowController], providers: [WorkflowService] })
export class WorkflowModule {}
