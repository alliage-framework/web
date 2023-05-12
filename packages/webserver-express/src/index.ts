import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';
import { instanceOf, parameter, ServiceContainer } from '@alliage/di';
import { EventManager, AbstractLifeCycleAwareModule } from '@alliage/lifecycle';

import { ExpressAdapter } from './adapter';
import { CONFIG_NAME, schema } from './config';

export default class WebserverExpressModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validators.jsonSchema(schema)),
    };
  }

  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService('webserver-express-adapter', ExpressAdapter, [
      parameter((parameters: any) => parameters[CONFIG_NAME]),
      instanceOf(EventManager),
    ]);
  }
}

export * from './config';
export * from './adapter';
export * from './middleware';
export * from './network';
