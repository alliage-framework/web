import { EventManager } from '@alliage/lifecycle';
import { AbstractProcess } from '@alliage/process-manager';
import { Arguments, CommandBuilder } from '@alliage/framework';

import {
  AdapterServerInitializedEvent,
  AdapterServerStartedEvent,
  AdapterServerStoppedEvent,
  AbstractAdapter,
} from '../adapter';
import { Config } from '../config';
import { AbstractController } from '../controller';
import { AbstractMiddleware } from '../middleware';

export class WebProcess extends AbstractProcess {
  constructor(
    private config: Config,
    private adapter: AbstractAdapter,
    private middlewares: AbstractMiddleware[],
    private controllers: AbstractController[],
    private eventManager: EventManager,
  ) {
    super();
  }

  getName = () => 'web';

  configure(config: CommandBuilder) {
    config.addArgument('port', {
      describe: "Server's port",
      type: 'number',
      default: this.config.port,
    });
  }

  async execute(args: Arguments) {
    const port = args.get<number>('port');

    const options = {
      ...this.config,
      port,
    };

    this.adapter.initialize({
      controllers: this.controllers,
      middlewares: this.getSortedMiddlewares(),
      options,
    });
    const initializedEvent = new AdapterServerInitializedEvent(
      options,
      this.adapter.getName(),
      this.adapter.getNativeServer(),
    );
    await this.eventManager.emit(initializedEvent.getType(), initializedEvent);

    await this.adapter.start(options);
    const startedEvent = new AdapterServerStartedEvent(options, this.adapter.getName());
    await this.eventManager.emit(startedEvent.getType(), startedEvent);

    process.stdout.write(`Webserver started - Listening on: ${port}\n`);

    return this.waitToBeShutdown();
  }

  async terminate() {
    await this.adapter.stop();
    const stoppedEvent = new AdapterServerStoppedEvent(this.adapter.getName());
    await this.eventManager.emit(stoppedEvent.getType(), stoppedEvent);
  }

  private getSortedMiddlewares() {
    return this.middlewares.sort((m1, m2) => {
      // m1 before m2
      if (
        m1.applyBefore().includes(m2.constructor as typeof AbstractMiddleware) ||
        m2.applyAfter().includes(m1.constructor as typeof AbstractMiddleware)
      ) {
        return -1;
      }
      // m2 before m1
      if (
        m1.applyAfter().includes(m2.constructor as typeof AbstractMiddleware) ||
        m2.applyBefore().includes(m1.constructor as typeof AbstractMiddleware)
      ) {
        return 1;
      }
      return 0;
    });
  }
}
