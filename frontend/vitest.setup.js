import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Manual cleanup after each test to prevent memory leaks and state pollution
afterEach(() => {
  cleanup();
});
