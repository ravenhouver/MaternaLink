import { Module } from '@nestjs/common';
import { LplpoController } from './lplpo.controller';
import { LplpoService } from './lplpo.service';

@Module({ controllers: [LplpoController], providers: [LplpoService], exports: [LplpoService] })
export class LplpoModule {}
