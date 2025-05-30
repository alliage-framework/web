import { REQUEST_PHASE } from '../adapter/index.js';

import { Context } from './context.js';

export abstract class AbstractMiddleware {
  applyBefore = (): Array<typeof AbstractMiddleware> => [];

  applyAfter = (): Array<typeof AbstractMiddleware> => [];

  abstract getRequestPhase(): REQUEST_PHASE;

  abstract apply(context: Context, error?: Error): Promise<void> | void;
}