import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient, setMockLatency, DEMO_CREDENTIALS } from '@/api/mock/mockClient';
import { resetState } from '@/api/mock/store';
import { ApiError } from '@/api/errors';
import { DEFAULT_FILTERS } from '@/domain/filters';
import { NewFeedbackInput } from '@/types/feedback';

function baseInput(departmentId: string, serviceId: string): NewFeedbackInput {
  return {
    location: { state: 'Kerala', district: 'Ernakulam', localArea: 'Kanayannur (Kochi)', coordinates: [9.97, 76.28] },
    departmentId,
    serviceId,
    overallRating: 2,
    categoryRatings: { helpfulness: 2, communication: 2, professionalism: 2, responseTime: 1 },
    structuredAnswers: { timelyDelivery: 'significant_delay', processClarity: 'confusing', digitalAccessUsed: true },
    summaryComment: 'There was a long delay at the counter today.',
    detailedDescription: 'I waited for several hours without any update.',
    isAnonymous: true,
    attachments: [],
  };
}

describe('mockClient', () => {
  beforeEach(() => {
    setMockLatency(0);
    resetState();
  });

  it('loads the seeded dataset', async () => {
    const page = await mockClient.listFeedback(DEFAULT_FILTERS, { pageSize: 1000 });
    expect(page.count).toBeGreaterThan(0);
    expect(page.results.length).toBe(Math.min(page.count, 1000));
  });

  it('creates feedback, generates a reference, and persists it', async () => {
    const departments = await mockClient.listDepartments();
    const dept = departments[0];
    const service = dept.services[0];

    const before = await mockClient.listFeedback(DEFAULT_FILTERS, { pageSize: 1000 });

    const created = await mockClient.createFeedback(
      baseInput(dept.id, service.id),
      'idem-key-1'
    );
    expect(created.referenceId).toMatch(/^CC-KL-\d{4}-\d+$/);
    expect(created.departmentName).toBe(dept.name);
    expect(created.serviceName).toBe(service.name);
    expect(created.sentiment).toBeTypeOf('string');

    const after = await mockClient.listFeedback(DEFAULT_FILTERS, { pageSize: 1000 });
    expect(after.count).toBe(before.count + 1);
  });

  it('is idempotent for a repeated idempotency key', async () => {
    const departments = await mockClient.listDepartments();
    const dept = departments[0];
    const service = dept.services[0];

    const first = await mockClient.createFeedback(baseInput(dept.id, service.id), 'same-key');
    const second = await mockClient.createFeedback(baseInput(dept.id, service.id), 'same-key');
    expect(second.id).toBe(first.id);

    const all = await mockClient.listFeedback(DEFAULT_FILTERS, { pageSize: 1000 });
    const matches = all.results.filter((f) => f.id === first.id);
    expect(matches).toHaveLength(1);
  });

  it('rejects invalid input with a 400 and field errors', async () => {
    const departments = await mockClient.listDepartments();
    const dept = departments[0];
    const service = dept.services[0];

    const invalid = baseInput(dept.id, service.id);
    invalid.summaryComment = 'too short';

    await expect(mockClient.createFeedback(invalid, 'bad-key')).rejects.toMatchObject({
      status: 400,
    });

    try {
      await mockClient.createFeedback(invalid, 'bad-key-2');
      throw new Error('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).fieldErrors?.summaryComment).toBeDefined();
    }
  });

  it('deletes feedback', async () => {
    const departments = await mockClient.listDepartments();
    const dept = departments[0];
    const service = dept.services[0];
    const created = await mockClient.createFeedback(baseInput(dept.id, service.id), 'del-key');

    await mockClient.deleteFeedback(created.id);
    await expect(mockClient.getFeedback(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('protects departments and services that have feedback from deletion', async () => {
    const departments = await mockClient.listDepartments();
    const dept = departments[0];
    const service = dept.services[0];
    await mockClient.createFeedback(baseInput(dept.id, service.id), 'protect-key');

    await expect(mockClient.deleteDepartment(dept.id)).rejects.toMatchObject({ status: 409 });
    await expect(mockClient.deleteService(dept.id, service.id)).rejects.toMatchObject({ status: 409 });
  });

  it('authenticates with the demo credentials and rejects others', async () => {
    await expect(mockClient.login('x@y.z', 'wrong')).rejects.toMatchObject({ status: 401 });

    const session = await mockClient.login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    expect(session.token).toBeTruthy();
    expect(session.user.role).toBe('admin');
  });

  it('keeps analytics totals consistent with the feedback list (cross-view invariant)', async () => {
    const filters = { ...DEFAULT_FILTERS, district: 'Ernakulam' };
    const list = await mockClient.listFeedback(filters, { pageSize: 1000 });
    const summary = await mockClient.getAnalyticsSummary(filters);

    expect(summary.total).toBe(list.count);
    const counts = summary.sentiment;
    expect(counts.positive + counts.neutral + counts.negative).toBe(summary.total);
  });

  it('exports a CSV blob whose row count matches the filtered list', async () => {
    const filters = { ...DEFAULT_FILTERS };
    const list = await mockClient.listFeedback(filters, { pageSize: 1000 });
    const blob = await mockClient.exportReportCsv(filters);
    const text = await blob.text();
    const rows = text.split('\r\n');
    // header + one row per record
    expect(rows.length).toBe(list.count + 1);
  });

  it('does not expose citizen identity for anonymous records', async () => {
    const page = await mockClient.listFeedback(DEFAULT_FILTERS, { pageSize: 1000 });
    for (const record of page.results.filter((f) => f.isAnonymous)) {
      expect(record.citizenName).toBeUndefined();
      expect(record.citizenContact).toBeUndefined();
    }
  });
});
