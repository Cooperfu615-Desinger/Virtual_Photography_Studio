// The first-batch assertions and evidence remain exact while batch 2 owns its new contract.
import { after } from 'node:test';
import { pathToFileURL } from 'node:url';
import { openPrePoseUpperBodyStateBatch2Runtime } from '../../../../scripts/lib/poseUpperBodyStateBatch2HistoricalReplay.mjs';

const replay = openPrePoseUpperBodyStateBatch2Runtime();
after(() => replay.cleanup());
await import(pathToFileURL(`${replay.directory}/webapp/src/lib/engine/specifiedActionUpperBodyState.test.js`).href);
