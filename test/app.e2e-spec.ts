import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('MaternaLink API', () => {
  let app: Awaited<ReturnType<import('@nestjs/common').INestApplication['init']>>;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('lists puskesmas master data', async () => {
    const response = await request(app.getHttpServer()).get('/api/master/puskesmas').expect(200);
    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'PKM-001' })]));
  });

  it('lists medicine master data', async () => {
    const response = await request(app.getHttpServer()).get('/api/master/obat').expect(200);
    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'OBT-001' })]));
  });

  it('runs deterministic forecast and lists runs', async () => {
    const runResponse = await request(app.getHttpServer())
      .post('/api/forecast/run')
      .send({ puskesmasId: 'PKM-001', periode: '2025-03-01' })
      .expect(201);

    expect(runResponse.body).toEqual(
      expect.objectContaining({
        puskesmasId: 'PKM-001',
        prediksi: expect.arrayContaining([
          expect.objectContaining({ obatId: 'OBT-001', kebutuhanObat: 80, totalRekomendasi: 96 }),
        ]),
      }),
    );

    const listResponse = await request(app.getHttpServer()).get('/api/forecast/runs').expect(200);
    expect(listResponse.body.length).toBeGreaterThan(0);
  });
});
