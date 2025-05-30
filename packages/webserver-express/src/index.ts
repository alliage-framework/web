import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';
import { instanceOf, parameter, ServiceContainer } from '@alliage/di';
import { EventManager, AbstractLifeCycleAwareModule } from '@alliage/lifecycle';

import { ExpressAdapter } from './adapter/index.js';
import { CONFIG_NAME, schema } from './config.js';

export default class WebserverExpressModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validators.jsonSchema(schema)),
    };
  }

  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService('webserver-express-adapter', ExpressAdapter, [
      parameter(CONFIG_NAME),
      instanceOf(EventManager),
    ]);
  }
}

export * from './config.js';
export * from './adapter/index.js';
export * from './middleware/index.js';
export * from './network/index.js';
