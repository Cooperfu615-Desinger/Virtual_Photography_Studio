// The second-batch assertions and evidence remain exact while batch 3 owns its new contract.
import { after } from 'node:test';
import { pathToFileURL } from 'node:url';
import { openPrePoseUpperBodyStateBatch3Runtime } from '../../../../scripts/lib/poseUpperBodyStateBatch3HistoricalReplay.mjs';

const replay = openPrePoseUpperBodyStateBatch3Runtime();
after(() => replay.cleanup());
await import(pathToFileURL(`${replay.directory}/webapp/src/lib/engine/specifiedActionUpperBodyStateBatch2.test.js`).href);
