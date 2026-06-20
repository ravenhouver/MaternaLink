import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { ExaminationsController } from './examinations.controller';
import { ExaminationsService } from './examinations.service';

@Module({ imports: [PrismaModule, AiModule], controllers: [ExaminationsController], providers: [ExaminationsService], exports: [ExaminationsService] })
export class ExaminationsModule {}
