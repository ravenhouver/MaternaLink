import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';

@Module({ imports: [AiModule], controllers: [MasterController], providers: [MasterService] })
export class MasterModule {}
