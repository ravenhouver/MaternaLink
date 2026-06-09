import assert from 'node:assert/strict';
import { test } from 'node:test';
import { performLogout } from './logout-action.js';

test('performLogout redirects to login after logout succeeds', async () => {
  const calls = [];

  await performLogout({
    logout: async () => {
      calls.push('logout');
    },
    redirectToLogin: () => {
      calls.push('redirect');
    },
  });

  assert.deepEqual(calls, ['logout', 'redirect']);
});

test('performLogout still redirects to login when logout fails', async () => {
  const calls = [];

  await performLogout({
    logout: async () => {
      calls.push('logout');
      throw new Error('network down');
    },
    redirectToLogin: () => {
      calls.push('redirect');
    },
  });

  assert.deepEqual(calls, ['logout', 'redirect']);
});
