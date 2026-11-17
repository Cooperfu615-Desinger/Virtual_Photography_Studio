import { fileURLToPath } from 'node:url';
import { createTestProgress } from '../../../../scripts/lib/testRunContext.mjs';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
export const testMatrixProgress = (label, total) => createTestProgress(label, total, { root });
