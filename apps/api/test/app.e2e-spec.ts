import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { loadRuntimeEnv } from '../src/runtime-env';

loadRuntimeEnv();

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

  it('logs in with username and password and returns current user', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);

    const cookie = login.headers['set-cookie'];
    expect(cookie?.[0]).toContain('maternalink_session=');

    const me = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body).toEqual(expect.objectContaining({ username: 'bidan', role: 'BIDAN_PUSKESMAS', puskesmasId: 'PKM-001' }));
  });

  it('rejects invalid login and missing session', async () => {
    await request(app.getHttpServer()).post('/api/auth/login').send({ username: 'bidan', password: 'wrong123' }).expect(401);
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('returns fallback AI gateway health', async () => {
    const response = await request(app.getHttpServer()).get('/api/ai/health').expect(200);
    expect(response.body).toEqual(expect.objectContaining({ mode: 'fallback', remote: false, status: 'fallback-ready' }));
  });

  it('lets bidan create patient, queue patient, call patient, and save examination', async () => {
    const nik = `340401520398${Date.now().toString().slice(-4)}`;
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);
    const cookie = login.headers['set-cookie'];

    const created = await request(app.getHttpServer())
      .post('/api/patients')
      .set('Cookie', cookie)
      .send({
        fullName: 'Ny. Test Flow',
        nik,
        phone: '081200009999',
        address: 'Umbulharjo',
        gestationalAge: 28,
        ancVisit: 'K3',
        riskLevel: 'MEDIUM',
      })
      .expect(201);

    const queued = await request(app.getHttpServer())
      .post('/api/queue')
      .set('Cookie', cookie)
      .send({ patientId: created.body.patient.id, pregnancyId: created.body.pregnancy.id })
      .expect(201);

    await request(app.getHttpServer()).patch(`/api/queue/${queued.body.id}/status`).set('Cookie', cookie).send({ status: 'EXAMINING' }).expect(200);

    const exam = await request(app.getHttpServer())
      .post('/api/examinations')
      .set('Cookie', cookie)
      .send({
        queueId: queued.body.id,
        patientId: created.body.patient.id,
        pregnancyId: created.body.pregnancy.id,
        complaint: 'Pusing dan bengkak kaki',
        gestationalAge: 28,
        ancVisit: 'K3',
        diagnosis: [{ kondisiId: 'K03', jumlahKasus: 1 }],
        symptoms: [{ gejalaId: 'G05', jumlah: 1 }],
        medication: [{ obatId: 'OBT-008', quantity: 10 }],
      })
      .expect(201);

    expect(exam.body).toEqual(expect.objectContaining({ queueId: queued.body.id, source: 'MANUAL' }));

    const queue = await request(app.getHttpServer()).get('/api/queue/today').set('Cookie', cookie).expect(200);
    expect(queue.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: queued.body.id, status: 'COMPLETED' })]));
  });

  it('enforces IFK recommendation review, reorder, approval, and tracking workflow', async () => {
    await prisma.distributionRecommendation.update({
      where: { id: 'REC-DEMO-001' },
      data: { status: 'PENDING', priorityRank: 2 },
    });
    await prisma.distributionRecommendationItem.update({
      where: { id: 'RECITEM-DEMO-001' },
      data: { aiQuantity: 20, finalQuantity: 20, overrideQuantity: null, overrideReason: null },
    });

    const reorderId = `REC-TEST-${Date.now()}`;
    await prisma.distributionRecommendation.create({
      data: {
        id: reorderId,
        puskesmasId: 'PKM-001',
        periode: new Date('2026-06-01'),
        urgency: 'WARNING',
        status: 'PENDING',
        source: 'RULE_BASED_FALLBACK',
        priorityRank: 1,
        justification: 'Reorder test recommendation.',
      },
    });

    const bidanLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);
    const bidanCookie = bidanLogin.headers['set-cookie'];

    await request(app.getHttpServer())
      .patch('/api/distribution/recommendations/REC-DEMO-001/approve')
      .set('Cookie', bidanCookie)
      .expect(403);

    const ifkLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'ifk', password: 'password123' })
      .expect(201);
    const ifkCookie = ifkLogin.headers['set-cookie'];

    const list = await request(app.getHttpServer()).get('/api/distribution/recommendations').set('Cookie', ifkCookie).expect(200);
    expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'REC-DEMO-001', status: 'PENDING' })]));

    await request(app.getHttpServer())
      .patch('/api/distribution/recommendations/REC-DEMO-001/items/RECITEM-DEMO-001')
      .set('Cookie', ifkCookie)
      .send({ overrideQuantity: 24 })
      .expect(400);

    const overridden = await request(app.getHttpServer())
      .patch('/api/distribution/recommendations/REC-DEMO-001/items/RECITEM-DEMO-001')
      .set('Cookie', ifkCookie)
      .send({ overrideQuantity: 24, overrideReason: 'Additional high-risk pregnancy buffer.' })
      .expect(200);
    expect(overridden.body).toEqual(expect.objectContaining({ overrideQuantity: 24, finalQuantity: 24 }));

    const reordered = await request(app.getHttpServer())
      .patch('/api/distribution/recommendations/reorder')
      .set('Cookie', ifkCookie)
      .send({ orderedIds: ['REC-DEMO-001', reorderId] })
      .expect(200);
    expect(reordered.body[0]).toEqual(expect.objectContaining({ id: 'REC-DEMO-001', priorityRank: 1 }));

    const approved = await request(app.getHttpServer())
      .patch('/api/distribution/recommendations/REC-DEMO-001/approve')
      .set('Cookie', ifkCookie)
      .expect(200);
    expect(approved.body).toEqual(expect.objectContaining({ id: 'REC-DEMO-001', status: 'APPROVED' }));

    const tracking = await request(app.getHttpServer())
      .get('/api/distribution/recommendations/REC-DEMO-001/tracking')
      .set('Cookie', ifkCookie)
      .expect(200);
    expect(tracking.body).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'APPROVED' })]));
  });

  it('runs demo workflow and exposes bidan dashboard state', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);
    const cookie = login.headers['set-cookie'];

    const run = await request(app.getHttpServer()).post('/api/workflow/demo/run').set('Cookie', cookie).expect(201);
    expect(run.body.recommendation).toEqual(expect.objectContaining({ id: 'REC-DEMO-001', source: 'RULE_BASED_FALLBACK', status: 'PENDING' }));
    expect(run.body.lplpoRows.length).toBeGreaterThan(0);

    const state = await request(app.getHttpServer()).get('/api/workflow/demo/state').set('Cookie', cookie).expect(200);
    expect(state.body).toEqual(expect.objectContaining({ puskesmasId: 'PKM-001', periode: '2026-06-01' }));
    expect(state.body.recommendation).toEqual(expect.objectContaining({ id: 'REC-DEMO-001' }));

    const summary = await request(app.getHttpServer()).get('/api/dashboard/summary').set('Cookie', cookie).expect(200);
    expect(summary.body).toEqual(
      expect.objectContaining({
        role: 'BIDAN_PUSKESMAS',
        queue: expect.objectContaining({ waiting: expect.any(Number), examining: expect.any(Number), completed: expect.any(Number) }),
        patients: expect.objectContaining({ total: expect.any(Number) }),
        medicine: expect.objectContaining({ criticalCount: expect.any(Number) }),
      }),
    );
  });

  it('exposes IFK dashboard recommendation metrics', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'ifk', password: 'password123' })
      .expect(201);
    const cookie = login.headers['set-cookie'];

    const summary = await request(app.getHttpServer()).get('/api/dashboard/summary').set('Cookie', cookie).expect(200);
    expect(summary.body).toEqual(
      expect.objectContaining({
        role: 'IFK_ADMIN',
        recommendations: expect.objectContaining({ pending: expect.any(Number), approved: expect.any(Number), rejected: expect.any(Number), critical: expect.any(Number) }),
        deliveries: expect.objectContaining({ active: expect.any(Number) }),
      }),
    );
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

  it('exposes remote puskesmas logistics metadata from master data', async () => {
    const response = await request(app.getHttpServer()).get('/api/master/puskesmas').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'PKM-REMOTE-001',
          kabupatenKota: 'Kab. Manggarai',
          provinsi: 'NTT',
          skorAksesibilitas: 1,
          leadTimeHari: 7,
          coldChainReady: false,
        }),
      ]),
    );
  });

  it('stores maternal context fields used by forecast and logistics reasoning', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/inputs/konteks')
      .send({
        puskesmasId: 'PKM-REMOTE-001',
        periode: '2025-04-01',
        season: 'HUJAN',
        accessScore: 1,
        rainyAccess: 'TERGANGGU',
        routeDisrupted: true,
        jumlahBumilT1: 10,
        jumlahBumilT2: 15,
        jumlahBumilT3: 12,
        statusKlb: false,
        riwayatStockout6Bln: { 'OBT-010': 2 },
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        puskesmasId: 'PKM-REMOTE-001',
        jumlahBumilT1: 10,
        jumlahBumilT2: 15,
        jumlahBumilT3: 12,
        statusKlb: false,
        riwayatStockout6Bln: { 'OBT-010': 2 },
      }),
    );
  });

  it('simulates route and cold-chain alerts for remote allocation plan', async () => {
    const planResponse = await request(app.getHttpServer())
      .post('/api/distribution/plans')
      .send({
        puskesmasId: 'PKM-REMOTE-001',
        periode: '2025-04-01',
        items: [{ obatId: 'OBT-010', jumlah: 12, note: 'Emergency preeclampsia stock' }],
      })
      .expect(201);

    const simulationResponse = await request(app.getHttpServer())
      .post(`/api/distribution/plans/${planResponse.body.id}/simulate`)
      .expect(201);

    expect(simulationResponse.body.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ROUTE_DISRUPTION', severity: 'HIGH' }),
        expect.objectContaining({ type: 'COLD_CHAIN_MISMATCH', severity: 'CRITICAL' }),
      ]),
    );
  });
});
