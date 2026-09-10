// Jest mock for src/utils/logger.js — no-op logger for tests
const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
module.exports = logger;
module.exports.default = logger;
