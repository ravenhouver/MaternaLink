import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObatDto, CreatePuskesmasDto, UpdateObatDto, UpdatePuskesmasDto } from './master.dto';

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

  listPuskesmas() {
    return this.prisma.puskesmas.findMany({ orderBy: { id: 'asc' } });
  }

  createPuskesmas(data: CreatePuskesmasDto) {
    return this.prisma.puskesmas.create({ data });
  }

  updatePuskesmas(id: string, data: UpdatePuskesmasDto) {
    return this.prisma.puskesmas.update({ where: { id }, data });
  }

  async removePuskesmas(id: string) {
    try {
      await this.prisma.puskesmas.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Puskesmas masih dipakai oleh data lain');
      }
      throw error;
    }
  }

  listObat() {
    return this.prisma.obat.findMany({ orderBy: { id: 'asc' } });
  }

  createObat(data: CreateObatDto) {
    return this.prisma.obat.create({ data });
  }

  updateObat(id: string, data: UpdateObatDto) {
    return this.prisma.obat.update({ where: { id }, data });
  }

  async removeObat(id: string) {
    try {
      await this.prisma.obat.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Obat masih dipakai oleh data lain');
      }
      throw error;
    }
  }

  listKondisi() {
    return this.prisma.kondisi.findMany({ orderBy: { id: 'asc' } });
  }

  listGejala() {
    return this.prisma.gejala.findMany({ orderBy: { id: 'asc' } });
  }
}
