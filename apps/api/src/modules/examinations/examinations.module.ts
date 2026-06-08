import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExaminationsController } from './examinations.controller';
import { ExaminationsService } from './examinations.service';

@Module({ imports: [PrismaModule], controllers: [ExaminationsController], providers: [ExaminationsService], exports: [ExaminationsService] })
export class ExaminationsModule {}
