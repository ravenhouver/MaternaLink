import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';

@Module({ imports: [AiModule], controllers: [ForecastController], providers: [ForecastService], exports: [ForecastService] })
export class ForecastModule {}
