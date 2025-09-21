import { vi } from 'vitest';

// Mock the uuid module
vi.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

// Setup global mocks and test environment
(global as any).beforeEach(() => {
  // Add any global setup here
});

(global as any).afterEach(() => {
  // Add any global teardown here
});