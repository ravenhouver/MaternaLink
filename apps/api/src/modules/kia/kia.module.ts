import { Module } from '@nestjs/common';
import { KiaController } from './kia.controller';
import { KiaOcrService } from './kia-ocr.service';

@Module({ controllers: [KiaController], providers: [KiaOcrService] })
export class KiaModule {}
