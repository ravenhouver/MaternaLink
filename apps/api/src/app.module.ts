import { Module } from '@nestjs/common';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DistributionModule } from './modules/distribution/distribution.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { AuthModule } from './modules/auth/auth.module';
import { InputsModule } from './modules/inputs/inputs.module';
import { LplpoModule } from './modules/lplpo/lplpo.module';
import { MasterModule } from './modules/master/master.module';
import { PatientsModule } from './modules/patients/patients.module';
import { QueueModule } from './modules/queue/queue.module';
import { SpeechModule } from './modules/speech/speech.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, AiModule, MasterModule, PatientsModule, QueueModule, ExaminationsModule, InputsModule, ForecastModule, LplpoModule, DistributionModule, WorkflowModule, DashboardModule, SpeechModule],
})
export class AppModule {}
