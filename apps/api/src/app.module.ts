import { Module } from '@nestjs/common';
import { DistributionModule } from './modules/distribution/distribution.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { InputsModule } from './modules/inputs/inputs.module';
import { LplpoModule } from './modules/lplpo/lplpo.module';
import { MasterModule } from './modules/master/master.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, MasterModule, InputsModule, ForecastModule, LplpoModule, DistributionModule],
})
export class AppModule {}
