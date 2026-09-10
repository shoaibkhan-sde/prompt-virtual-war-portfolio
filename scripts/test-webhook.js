// test-webhook.js
// Run with: node scripts/test-webhook.js
// 
// Requires the apps/api gateway to be running on localhost:3000

const targetUrl = 'http://localhost:3000/api/v1/webhook/incident';

const payload = {
    service: "billing-worker",
    errorType: "MongoServerSelectionError",
    message: "MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017",
    severity: "CRITICAL",
    stackTrace: `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
    at Timeout._onTimeout (/app/node_modules/mongodb/lib/sdam/topology.js:278:38)
    at listOnTimeout (node:internal/timers:573:17)
    at processTimers (node:internal/timers:514:7)
    at /app/src/billing-worker.js:15:22`
};

console.log(`Sending test webhook to ${targetUrl}...`);

fetch(targetUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
})
.then(async (res) => {
    const data = await res.json();
    if (res.ok) {
        console.log("✅ Webhook accepted successfully!");
        console.log("Response:", JSON.stringify(data, null, 2));
    } else {
        console.error("❌ Webhook failed:", res.status, res.statusText);
        console.error("Response:", JSON.stringify(data, null, 2));
    }
})
.catch((err) => {
    console.error("❌ Network or Fetch error:");
    console.error(err);
    console.log("\nMake sure the API Gateway is running on port 3000 (npm run dev in apps/api).");
});
