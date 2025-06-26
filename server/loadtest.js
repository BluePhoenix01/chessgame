// loadtest-createroom.js

const CONCURRENCY = 50; // Number of concurrent requests
const REQUESTS = 200;   // Total number of requests
const URL = 'http://localhost:3001/createroom';

async function createRoom() {
  const res = await fetch(URL, { method: 'POST' });
  if (!res.ok) throw new Error(`Status: ${res.status}`);
  return res.json();
}

(async () => {
  let successes = 0, failures = 0;
  const start = Date.now();

  const tasks = Array.from({ length: REQUESTS }, (_, i) => (async () => {
    try {
      await createRoom();
      successes++;
    } catch (e) {
      failures++;
      console.error(`Request ${i + 1} failed:`, e.message);
    }
  })());

  // Run in batches for concurrency control
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    await Promise.all(tasks.slice(i, i + CONCURRENCY));
  }

  const duration = (Date.now() - start) / 1000;
  console.log(`Done in ${duration}s. Success: ${successes}, Failures: ${failures}`);
})();