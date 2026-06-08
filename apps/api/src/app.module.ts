import { Module } from '@nestjs/common';
import { DistributionModule } from './modules/distribution/distribution.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { AuthModule } from './modules/auth/auth.module';
import { InputsModule } from './modules/inputs/inputs.module';
import { LplpoModule } from './modules/lplpo/lplpo.module';
import { MasterModule } from './modules/master/master.module';
import { PatientsModule } from './modules/patients/patients.module';
import { QueueModule } from './modules/queue/queue.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, MasterModule, PatientsModule, QueueModule, ExaminationsModule, InputsModule, ForecastModule, LplpoModule, DistributionModule],
})
export class AppModule {}
