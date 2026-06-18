import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SpeechController } from './speech.controller';
import { SpeechService } from './speech.service';

@Module({ imports: [PrismaModule], controllers: [SpeechController], providers: [SpeechService] })
export class SpeechModule {}
