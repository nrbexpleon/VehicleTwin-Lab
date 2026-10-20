import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {SignalCatalog} from './domain/catalog.mjs';
import {TwinEngine} from './domain/engine.mjs';
import {createEvidence, verifyEvidence} from './domain/evidence.mjs';

const catalogData = JSON.parse(await readFile(new URL('../config/catalog.json', import.meta.url)));
const catalog = new SignalCatalog(catalogData.signals);
const engine = new TwinEngine({catalog});
const runs = new Map();
const port = Number(process.env.PORT ?? 8080);
const apiToken = process.env.API_TOKEN;
const maxRuns = 100;

const server = http.createServer(async (request, response) => {
  try {
    setSecurityHeaders(response);
    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
    if (url.pathname.startsWith('/api/') && apiToken && request.headers.authorization !== `Bearer ${apiToken}`) {
      return json(response, 401, {error: 'unauthorized'});
    }
    if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, {status: 'healthy', version: '0.1.0'});
    if (request.method === 'GET' && url.pathname === '/api/catalog') return json(response, 200, {signals: catalog.list()});
    if (request.method === 'GET' && url.pathname === '/api/scenarios/example') {
      return json(response, 200, JSON.parse(await readFile(new URL('../scenarios/thermal-network-fault.json', import.meta.url))));
    }
    if (request.method === 'POST' && url.pathname === '/api/runs') {
      const scenario = await body(request);
      const run = await engine.run(scenario);
      const evidence = createEvidence(run);
      runs.set(run.runId, {run, evidence});
      if (runs.size > maxRuns) runs.delete(runs.keys().next().value);
      return json(response, 201, {runId: run.runId, result: run.result, statistics: run.statistics, assertions: run.assertions});
    }
    const match = url.pathname.match(/^\/api\/runs\/([a-f0-9-]+)(\/evidence)?$/i);
    if (request.method === 'GET' && match) {
      const record = runs.get(match[1]);
      if (!record) return json(response, 404, {error: 'run-not-found'});
      return json(response, 200, match[2] ? record.evidence : record.run);
    }
    if (request.method === 'POST' && url.pathname === '/api/evidence/verify') {
      const evidence = await body(request);
      return json(response, 200, {valid: verifyEvidence(evidence)});
    }
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) return file(response, '../public/index.html', 'text/html; charset=utf-8');
    if (request.method === 'GET' && url.pathname === '/app.js') return file(response, '../public/app.js', 'text/javascript; charset=utf-8');
    if (request.method === 'GET' && url.pathname === '/styles.css') return file(response, '../public/styles.css', 'text/css; charset=utf-8');
    return json(response, 404, {error: 'not-found'});
  } catch (error) {
    const status = error.message === 'body-too-large' ? 413 : 400;
    return json(response, status, {error: error.message});
  }
});

async function body(request) {
  const chunks = []; let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 1_000_000) throw new Error('body-too-large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function file(response, relative, type) {
  const data = await readFile(new URL(relative, import.meta.url));
  response.writeHead(200, {'content-type': type, 'cache-control': 'no-store'}); response.end(data);
}
function json(response, status, value) {
  response.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}); response.end(JSON.stringify(value));
}
function setSecurityHeaders(response) {
  response.setHeader('content-security-policy', "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('referrer-policy', 'no-referrer');
}

server.listen(port, '127.0.0.1', () => console.log(`VehicleTwin Lab listening on http://127.0.0.1:${port}`));
export {server};
