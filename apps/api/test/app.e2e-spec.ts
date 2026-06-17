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
  const originalFetch = global.fetch;

  function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init)) as jest.MockedFunction<typeof fetch>;
  }

  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }

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
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.AI_MODE = 'fallback';
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
    process.env.AI_MODE = 'fallback';
    const response = await request(app.getHttpServer()).get('/api/ai/health').expect(200);
    expect(response.body).toEqual(expect.objectContaining({ mode: 'fallback', remote: false, status: 'fallback-ready' }));
  });

  it('returns hosted AI gateway health in remote mode', async () => {
    process.env.AI_MODE = 'remote';
    process.env.AI_SERVICE_BASE_URL = 'https://azrilfahmiardi-maternalink-ai.hf.space';
    mockFetch(async (url) => {
      expect(url).toBe('https://azrilfahmiardi-maternalink-ai.hf.space/health');
      return jsonResponse({ service: 'MaternaLink AI', version: '1.0.0', status: 'ok' });
    });

    const response = await request(app.getHttpServer()).get('/api/ai/health').expect(200);
    expect(response.body).toEqual(expect.objectContaining({ mode: 'remote', remote: true, status: 'ok', service: 'MaternaLink AI' }));
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

  it('starts hosted AI demo workflow and exposes completed state after polling', async () => {
    process.env.AI_MODE = 'remote';
    const calls: string[] = [];
    mockFetch(async (url, init) => {
      calls.push(url);
      if (url.endsWith('/api/v1/layer0/extract')) {
        return jsonResponse({
          extraction_results: [],
          condition_estimates: [{ facility_id: 'PKM-001', period: '2026-06-01', condition_id: 'K03', manual_cases: 1, anamnesis_indicated_cases: 0, estimated_total_cases: 2, confidence_level: 'medium' }],
        });
      }
      if (url.endsWith('/api/v1/layer1/forecast')) {
        const body = JSON.parse(String(init?.body));
        return jsonResponse({ facility_id: body.facility_id, drug_id: body.drug_id, period: body.period, forecast_demand: 18, buffer_pct: 0.2, buffer_units: 4, total_requirement: 22, current_stock: body.closing_stock });
      }
      if (url.endsWith('/api/v1/layer2/allocate')) {
        return jsonResponse({
          run_id: 'REC-DEMO-001',
          forecast_period: '2026-06-01',
          summary: { total_allocated_units: 20, facilities_served: 1 },
          allocations: [{ facility_id: 'PKM-001', facility_name: 'Puskesmas Demo', drug_id: 'OBT-010', drug_name: 'MgSO4', category: 'OBAT', requirement: 22, allocated: 20, coverage_ratio: 0.91, unmet: 2, priority_score: 0.9, factors: [], justification: 'AI allocation prioritizes PKM-001 due to low stock.' }],
          redistribution: [],
        });
      }
      return jsonResponse({ status: 'ok' });
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);
    const cookie = login.headers['set-cookie'];

    const run = await request(app.getHttpServer()).post('/api/workflow/demo/run').set('Cookie', cookie).expect(201);
    expect(run.body).toEqual(expect.objectContaining({ jobId: expect.any(String), status: expect.stringMatching(/PENDING|RUNNING/) }));

    let state = await request(app.getHttpServer()).get('/api/workflow/demo/state').set('Cookie', cookie).expect(200);
    for (let attempt = 0; attempt < 10 && state.body.job?.status !== 'COMPLETED'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      state = await request(app.getHttpServer()).get('/api/workflow/demo/state').set('Cookie', cookie).expect(200);
    }

    expect(state.body).toEqual(expect.objectContaining({ puskesmasId: 'PKM-001', periode: '2026-06-01' }));
    expect(state.body.job).toEqual(expect.objectContaining({ id: run.body.jobId, status: 'COMPLETED', errorMessage: null }));
    expect(state.body.recommendation).toEqual(expect.objectContaining({ id: 'REC-DEMO-001', source: 'HF_AI_LAYER2', status: 'PENDING' }));
    expect(state.body.lplpoRows.length).toBeGreaterThan(0);
    expect(calls).toEqual(expect.arrayContaining([
      'https://azrilfahmiardi-maternalink-ai.hf.space/api/v1/layer0/extract',
      'https://azrilfahmiardi-maternalink-ai.hf.space/api/v1/layer1/forecast',
      'https://azrilfahmiardi-maternalink-ai.hf.space/api/v1/layer2/allocate',
    ]));

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

  it('marks workflow failed partial when layer2 fails after forecast and lplpo', async () => {
    process.env.AI_MODE = 'remote';
    mockFetch(async (url, init) => {
      if (url.endsWith('/api/v1/layer0/extract')) return jsonResponse({ extraction_results: [], condition_estimates: [] });
      if (url.endsWith('/api/v1/layer1/forecast')) {
        const body = JSON.parse(String(init?.body));
        return jsonResponse({ facility_id: body.facility_id, drug_id: body.drug_id, period: body.period, forecast_demand: 18, buffer_pct: 0.2, buffer_units: 4, total_requirement: 22, current_stock: body.closing_stock });
      }
      if (url.endsWith('/api/v1/layer2/allocate')) return jsonResponse({ message: 'layer2 unavailable' }, 503);
      return jsonResponse({ status: 'ok' });
    });

    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ username: 'bidan', password: 'password123' }).expect(201);
    const cookie = login.headers['set-cookie'];
    const run = await request(app.getHttpServer()).post('/api/workflow/demo/run').set('Cookie', cookie).expect(201);

    let state = await request(app.getHttpServer()).get('/api/workflow/demo/state').set('Cookie', cookie).expect(200);
    for (let attempt = 0; attempt < 10 && !['FAILED_PARTIAL', 'FAILED'].includes(state.body.job?.status); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      state = await request(app.getHttpServer()).get('/api/workflow/demo/state').set('Cookie', cookie).expect(200);
    }

    expect(state.body.job).toEqual(expect.objectContaining({ id: run.body.jobId, status: 'FAILED_PARTIAL' }));
    expect(state.body.job.errorMessage).toContain('AI service returned HTTP 503');
    expect(state.body.forecastRun).toEqual(expect.objectContaining({ status: 'COMPLETED' }));
    expect(state.body.lplpoRows.length).toBeGreaterThan(0);
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

  it('exposes super admin master-data dashboard metrics', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    const cookie = login.headers['set-cookie'];

    const summary = await request(app.getHttpServer()).get('/api/dashboard/summary').set('Cookie', cookie).expect(200);
    expect(summary.body).toEqual(
      expect.objectContaining({
        role: 'SUPER_ADMIN',
        masterData: expect.objectContaining({
          healthCenters: expect.any(Number),
          users: expect.any(Number),
          medicines: expect.any(Number),
          inactiveAccounts: expect.any(Number),
        }),
      }),
    );
  });

  it('lets super admin list user accounts and blocks non-admin roles', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    const adminCookie = adminLogin.headers['set-cookie'];

    const users = await request(app.getHttpServer()).get('/api/auth/users').set('Cookie', adminCookie).expect(200);
    expect(users.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: 'admin', role: 'SUPER_ADMIN', active: true }),
        expect.objectContaining({ username: 'bidan', role: 'BIDAN_PUSKESMAS', puskesmas: expect.objectContaining({ id: 'PKM-001' }) }),
      ]),
    );
    expect(users.body[0]).not.toHaveProperty('passwordHash');

    const bidanLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);
    await request(app.getHttpServer()).get('/api/auth/users').set('Cookie', bidanLogin.headers['set-cookie']).expect(403);
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
          latitude: expect.any(Number),
          longitude: expect.any(Number),
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

  it('runs a super admin, bidan, and IFK handoff workflow end to end', async () => {
    await prisma.distributionRecommendation.update({
      where: { id: 'REC-DEMO-001' },
      data: { status: 'PENDING', priorityRank: 1 },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password123' })
      .expect(201);
    const adminCookie = adminLogin.headers['set-cookie'];

    await request(app.getHttpServer()).get('/api/auth/users').set('Cookie', adminCookie).expect(200);
    await request(app.getHttpServer()).get('/api/master/puskesmas').set('Cookie', adminCookie).expect(200);
    await request(app.getHttpServer()).get('/api/master/obat').set('Cookie', adminCookie).expect(200);

    const bidanLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'bidan', password: 'password123' })
      .expect(201);
    const bidanCookie = bidanLogin.headers['set-cookie'];

    const workflow = await request(app.getHttpServer()).post('/api/workflow/demo/run').set('Cookie', bidanCookie).expect(201);
    expect(workflow.body.recommendation).toEqual(expect.objectContaining({ id: 'REC-DEMO-001', status: 'PENDING' }));
    await request(app.getHttpServer()).get('/api/dashboard/summary').set('Cookie', bidanCookie).expect(200);

    const ifkLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'ifk', password: 'password123' })
      .expect(201);
    const ifkCookie = ifkLogin.headers['set-cookie'];

    const pending = await request(app.getHttpServer()).get('/api/distribution/recommendations?status=PENDING').set('Cookie', ifkCookie).expect(200);
    expect(pending.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'REC-DEMO-001' })]));

    const approved = await request(app.getHttpServer())
      .patch('/api/distribution/recommendations/REC-DEMO-001/approve')
      .set('Cookie', ifkCookie)
      .expect(200);
    expect(approved.body).toEqual(expect.objectContaining({ status: 'APPROVED' }));

    const tracking = await request(app.getHttpServer())
      .get('/api/distribution/recommendations/REC-DEMO-001/tracking')
      .set('Cookie', bidanCookie)
      .expect(200);
    expect(tracking.body).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'APPROVED' })]));
  });
});
