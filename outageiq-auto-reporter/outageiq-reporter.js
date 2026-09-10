/**
 * outageiq-reporter.js
 *
 * Drop this file into any Node.js app and call init() once, near the top
 * of your entry file (e.g. index.js / server.js). From that point on,
 * ANY uncaught exception or unhandled promise rejection in that app is
 * automatically reported to your OutageIQ webhook endpoint — no manual
 * curl commands, no terminal, no human involved. This is what a real
 * error-tracking integration (like Sentry) does under the hood.
 *
 * Usage:
 *   const outageiq = require('./outageiq-reporter');
 *   outageiq.init({
 *     webhookUrl: 'http://localhost:3000/api/v1/webhook/incident',
 *     serviceName: 'checkout-service-v2',
 *   });
 *
 * That's the entire setup. Everything after this is automatic.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

let config = {
  webhookUrl: null,
  serviceName: 'unknown-service',
  severity: 'CRITICAL',
};

function sendToWebhook(errorType, message, stackTrace) {
  if (!config.webhookUrl) {
    console.error('[OutageIQ Reporter] Not initialized — call init() first.');
    return;
  }

  const payload = JSON.stringify({
    service: config.serviceName,
    errorType,
    message,
    stackTrace,
    severity: config.severity,
  });

  const url = new URL(config.webhookUrl);
  const lib = url.protocol === 'https:' ? https : http;

  const req = lib.request(
    {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log(
          `[OutageIQ Reporter] Crash reported automatically. Status: ${res.statusCode}`
        );
      });
    }
  );

  req.on('error', (err) => {
    // Deliberately non-fatal: if OutageIQ itself is unreachable, we do NOT
    // want the reporter to crash the host app a second time.
    console.error('[OutageIQ Reporter] Failed to report crash:', err.message);
  });

  req.write(payload);
  req.end();
}

function init(options) {
  config = { ...config, ...options };

  if (!config.webhookUrl) {
    throw new Error(
      '[OutageIQ Reporter] init() requires a webhookUrl (e.g. http://localhost:3000/api/v1/webhook/incident)'
    );
  }

  // Catches synchronous crashes anywhere in the app.
  process.on('uncaughtException', (err) => {
    console.error('[OutageIQ Reporter] Uncaught exception detected:', err.message);
    sendToWebhook(err.name || 'Error', err.message, err.stack || String(err));
    // Give the HTTP request a moment to actually leave before the process
    // potentially exits, then exit non-zero as Node normally would.
    setTimeout(() => process.exit(1), 300);
  });

  // Catches crashes inside unhandled Promise rejections (async code).
  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    console.error('[OutageIQ Reporter] Unhandled rejection detected:', err.message);
    sendToWebhook(err.name || 'UnhandledPromiseRejectionWarning', err.message, err.stack || String(err));
  });

  console.log(
    `[OutageIQ Reporter] Initialized. Watching "${config.serviceName}" for crashes → ${config.webhookUrl}`
  );
}

module.exports = { init };
