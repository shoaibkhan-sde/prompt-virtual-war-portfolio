# OutageIQ Auto-Reporter (Hands-Off Crash Reporting)

This is the "one-time setup, then fully automatic" piece you asked for.
It proves your webhook endpoint can receive REAL crashes with zero manual
terminal commands after setup — exactly how Sentry/Datadog integrations
work in production.

## Files

- **outageiq-reporter.js** — the reusable module. Drop this into any real
  Node.js app you own. Call `init()` once near the top of your entry file.
  From that moment on, every uncaught exception or unhandled promise
  rejection in that app is automatically POSTed to your OutageIQ webhook.
  No further action needed, ever — this is the "one-time setup."

- **demo-crashing-app.js** — a standalone demo app for showing this off
  live (e.g. to hackathon judges). It intentionally crashes itself every
  ~20 seconds with a different realistic error (null pointer, DB
  connection failure, malformed JSON), and the reporter automatically
  sends each one to OutageIQ. You don't touch anything after starting it.

## How to use it

### 1. For a real integration (in your own app)

At the very top of your app's entry file:

```js
const outageiq = require('./outageiq-reporter');

outageiq.init({
  webhookUrl: 'http://localhost:3000/api/v1/webhook/incident',
  serviceName: 'your-actual-service-name',
});
```

That's it. This is the ENTIRE one-time setup. Every real crash in that app
from now on reports itself automatically, forever, with no terminal
commands and no human involvement.

### 2. For a live demo (judges/testing)

1. Make sure your OutageIQ API server is already running
   (`http://localhost:3000` reachable).
2. In a separate terminal, run:
   ```
   node demo-crashing-app.js
   ```
3. Do not touch anything else. Open your OutageIQ dashboard's
   Incident Radar Feed and watch — a new LIVE incident should appear
   automatically roughly every 20 seconds, each with a different error
   type, each fully processed through your AI pipeline (grounding check,
   confidence score, root cause reasoning) with zero manual action.
4. Let it run in the background during your demo/pitch — it's a good
   visual to have live incidents just showing up on their own while
   you talk.

## Why this matters

Before this, every incident in OutageIQ came from either:
- A human manually pasting a stack trace into the simulator, or
- A human manually typing a curl/PowerShell command

This closes that gap: a real crash in a real running app now reports
itself with zero human involvement, the same way Sentry, Datadog, or
Rollbar would report a crash from your production servers. The ONLY
manual step, ever, is the one-time `init()` call — after that, it's
fully autonomous.
