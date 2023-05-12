import { allInstancesOf, Constructor, instanceOf, parameter, ServiceContainer } from '@alliage/di';
import { AbstractLifeCycleAwareModule, EventManager } from '@alliage/lifecycle';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

import { AbstractAdapter } from './adapter';
import { AbstractController } from './controller';
import { AbstractMiddleware } from './middleware';
import { WebProcess } from './process';
import { CONFIG_NAME, schema } from './config';

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

export * from './config';
export * from './process';
export * from './middleware';
export * from './controller';
export * from './adapter';
export * from './network';
