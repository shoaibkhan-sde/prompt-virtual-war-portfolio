/**
 * demo-crashing-app.js
 *
 * A tiny standalone "production" app that deliberately crashes itself
 * every ~20 seconds with a different realistic error, using the
 * outageiq-reporter to automatically report each crash — with zero
 * manual triggering. Run this alongside your OutageIQ app to watch
 * incidents appear in the Incident Radar Feed on their own.
 *
 * Usage:
 *   node demo-crashing-app.js
 *
 * Then just watch your OutageIQ dashboard — new LIVE incidents should
 * appear automatically every ~20 seconds, with no terminal commands,
 * no simulator form, no human interaction after this point.
 */

const outageiq = require('./outageiq-reporter');

outageiq.init({
  webhookUrl: 'http://localhost:3000/api/v1/webhook/incident',
  serviceName: 'demo-order-service',
});

// A rotating set of realistic crash scenarios, so each run looks different.
const scenarios = [
  () => {
    // Simulated null pointer style crash
    const order = undefined;
    console.log(order.total); // throws synchronously -> uncaughtException
  },
  () => {
    // Simulated unhandled async rejection (e.g. a failed DB call)
    Promise.reject(
      new Error('MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017')
    );
  },
  () => {
    // Simulated malformed data crash
    JSON.parse('{ this is not valid json');
  },
];

let count = 0;

function triggerRandomCrash() {
  // NOTE: each of these calls the reporter's process-level handlers via
  // the actual Node crash mechanisms (throw / unhandled rejection) —
  // this is not a fake call to the reporter, it's a REAL crash.
  const scenario = scenarios[count % scenarios.length];
  count++;

  console.log(`\n--- Triggering demo crash #${count} in 3 seconds... ---`);
  setTimeout(() => {
    try {
      scenario();
    } catch (err) {
      // Re-throw asynchronously so it becomes a true uncaughtException,
      // exactly like a real bug would in production.
      setImmediate(() => {
        throw err;
      });
    }
  }, 3000);
}

console.log('Demo crashing app started. It will crash itself automatically every ~20s.');
console.log('Watch your OutageIQ Incident Radar Feed — no manual action needed.\n');

triggerRandomCrash();
setInterval(triggerRandomCrash, 20000);

// Keep process alive between crashes for scenarios that don't hard-exit
// (e.g. the unhandledRejection case doesn't call process.exit()).
setInterval(() => {}, 1000);
