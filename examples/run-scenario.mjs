import {readFile} from 'node:fs/promises';
import {SignalCatalog} from '../src/domain/catalog.mjs';
import {TwinEngine} from '../src/domain/engine.mjs';
import {createEvidence} from '../src/domain/evidence.mjs';

const catalogData = JSON.parse(await readFile(new URL('../config/catalog.json', import.meta.url)));
const scenario = JSON.parse(await readFile(new URL('../scenarios/thermal-network-fault.json', import.meta.url)));
const run = await new TwinEngine({catalog: new SignalCatalog(catalogData.signals)}).run(scenario);
const evidence = createEvidence(run);
console.log(JSON.stringify({runId: run.runId, scenario: run.scenario, result: run.result, statistics: run.statistics, assertions: run.assertions, evidenceDigest: evidence.integrity.digest}, null, 2));
