import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getVisibleNavItems, resolveSelectedKey } from './layout-menu.js';

test('getVisibleNavItems returns bidan menu without IFK-only items', () => {
  const labels = getVisibleNavItems('BIDAN_PUSKESMAS').map((item) => item.label);

  assert.deepEqual(labels, ['Dashboard', 'Patient Queue', 'Patient List', 'Prediction Calendar', 'Medicine Needs']);
});

test('getVisibleNavItems returns IFK menu without bidan-only items', () => {
  const labels = getVisibleNavItems('IFK_ADMIN').map((item) => item.label);

  assert.deepEqual(labels, ['IFK Dashboard', 'Recommendations', 'Clinics', 'Environment', 'Decision History', 'Delivering']);
});

test('resolveSelectedKey maps nested mobile drawer routes to their parent menu item', () => {
  assert.equal(resolveSelectedKey('/patients/new/manual'), '/patients');
  assert.equal(resolveSelectedKey('/ifk/recommendations/detail'), '/ifk/recommendations');
});
