import { allInstancesOf, Constructor, instanceOf, parameter, ServiceContainer } from '@alliage/di';
import { AbstractLifeCycleAwareModule, EventManager } from '@alliage/lifecycle';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

import { AbstractAdapter } from './adapter/index.js';
import { AbstractController } from './controller/index.js';
import { AbstractMiddleware } from './middleware/index.js';
import { WebProcess } from './process/index.js';
import { CONFIG_NAME, schema } from './config.js';

export default class WebserverModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validators.jsonSchema(schema)),
    };
  }

  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService('web-process', WebProcess, [
      parameter(CONFIG_NAME),
      instanceOf(<Constructor>AbstractAdapter),
      allInstancesOf(<Constructor>AbstractMiddleware),
      allInstancesOf(<Constructor>AbstractController),
      instanceOf(EventManager),
    ]);
  }
}

export * from './config.js';
export * from './process/index.js';
export * from './middleware/index.js';
export * from './controller/index.js';
export * from './adapter/index.js';
export * from './network/index.js';
