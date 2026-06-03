import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObatDto, CreatePuskesmasDto } from './master.dto';

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

  listPuskesmas() {
    return this.prisma.puskesmas.findMany({ orderBy: { id: 'asc' } });
  }

  createPuskesmas(data: CreatePuskesmasDto) {
    return this.prisma.puskesmas.create({ data });
  }

  listObat() {
    return this.prisma.obat.findMany({ orderBy: { id: 'asc' } });
  }

  createObat(data: CreateObatDto) {
    return this.prisma.obat.create({ data });
  }

  listKondisi() {
    return this.prisma.kondisi.findMany({ orderBy: { id: 'asc' } });
  }

  listGejala() {
    return this.prisma.gejala.findMany({ orderBy: { id: 'asc' } });
  }
}
