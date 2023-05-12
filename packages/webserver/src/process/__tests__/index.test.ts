// eslint-disable-next-line max-classes-per-file
import http from 'http';

import { Arguments, CommandBuilder } from '@alliage/framework';
import { EventManager } from '@alliage/lifecycle';
import {
  AdapterServerInitializedEvent,
  AdapterServerStartedEvent,
  AdapterServerStoppedEvent,
  ADAPTER_EVENTS,
} from '@alliage/webserver';

import { WebProcess } from '..';
import { AbstractAdapter, REQUEST_PHASE } from '../../adapter';
import { AbstractController } from '../../controller';
import { AbstractMiddleware } from '../../middleware';

class DummyAdapter extends AbstractAdapter {
  getName = () => 'dummy_adapter';

  initialize = jest.fn().mockReturnThis();

  setMiddlewares = jest.fn().mockReturnThis();

  setControllers = jest.fn().mockReturnThis();

  getNativeServer = jest.fn().mockReturnValue(http.createServer());

  start = jest.fn().mockResolvedValue(undefined);

  stop = jest.fn().mockResolvedValue(undefined);
}

class DummyController1 extends AbstractController {}
class DummyController2 extends AbstractController {}

function createMiddleware(
  name: string,
  after: () => typeof AbstractMiddleware[] = () => [],
  before: () => typeof AbstractMiddleware[] = () => [],
) {
  class Middleware extends AbstractMiddleware {
    public name = name;

    getRequestPhase = () => REQUEST_PHASE.PRE_CONTROLLER;

    applyBefore = () => before();

    applyAfter = () => after();

    apply() {
      // empty
    }
  }

  return Middleware;
}

let Middleware2: any;
let Middleware3: any;
let Middleware4: any;
let Middleware5: any;
let Middleware6: any;

const Middleware1 = createMiddleware(
  'Middleware1',
  () => [],
  () => [Middleware2!],
);
Middleware2 = createMiddleware(
  'Middleware2',
  () => [],
  () => [Middleware3!],
);
Middleware3 = createMiddleware(
  'Middleware3',
  () => [Middleware1!],
  () => [Middleware4!],
);
Middleware4 = createMiddleware(
  'Middleware4',
  () => [],
  () => [Middleware5!, Middleware6!],
);
Middleware5 = createMiddleware('Middleware5', () => [Middleware1, Middleware3!]);
Middleware6 = createMiddleware('Middleware6', () => [Middleware1, Middleware3!]);

describe('webserver/process', () => {
  describe('WebProcess', () => {
    const middleware1 = new Middleware1();
    const middleware2 = new Middleware2();
    const middleware3 = new Middleware3();
    const middleware4 = new Middleware4();
    const middleware5 = new Middleware5();
    const middleware6 = new Middleware6();

    const controller1 = new DummyController1();
    const controller2 = new DummyController2();

    const adapter = new DummyAdapter();

    const eventManager = new EventManager();

    const processWriteSpy = jest.spyOn(process.stdout, 'write');

    const adapterServerInitializedEventHandler = jest.fn();
    const adapterServerStartedEventHandler = jest.fn();
    const adapterServerStoppedEventHandler = jest.fn();

    eventManager.on(ADAPTER_EVENTS.SERVER_INITIALIZED, adapterServerInitializedEventHandler);
    eventManager.on(ADAPTER_EVENTS.SERVER_STARTED, adapterServerStartedEventHandler);
    eventManager.on(ADAPTER_EVENTS.SERVER_STOPPED, adapterServerStoppedEventHandler);

    const webProcess = new WebProcess(
      {
        port: 4242,
        host: 'localhost',
      },
      adapter,
      [middleware3, middleware2, middleware4, middleware1, middleware5, middleware6],
      [controller1, controller2],
      eventManager,
    );

    describe('#getName', () => {
      it('should return the process name', () => {
        expect(webProcess.getName()).toEqual('web');
      });
    });

    describe('#configure', () => {
      const commandBuilder = CommandBuilder.create();
      webProcess.configure(commandBuilder);

      expect(commandBuilder.getArguments()).toEqual([
        { name: 'port', type: 'number', describe: "Server's port", default: 4242 },
      ]);
    });

    describe('#execute', () => {
      beforeAll(async () => {
        const args = Arguments.create({ port: 4242 });
        setTimeout(() => webProcess.shutdown(true), 1);
        await webProcess.execute(args);
      });

      it('should initialize the adapter by providing the controllers, middlewares and server options', () => {
        expect(adapter.initialize).toHaveBeenCalledWith({
          middlewares: [
            middleware1,
            middleware2,
            middleware3,
            middleware4,
            middleware5,
            middleware6,
          ],
          controllers: [controller1, controller2],
          options: {
            port: 4242,
            host: 'localhost',
          },
        });
      });

      it('should have triggered the ADAPTER_EVENT.SERVER_INITIALIZED event', () => {
        expect(adapterServerInitializedEventHandler).toHaveBeenCalled();

        const event: AdapterServerInitializedEvent =
          adapterServerInitializedEventHandler.mock.calls[0][0];

        expect(event.getType()).toEqual(ADAPTER_EVENTS.SERVER_INITIALIZED);
        expect(event.getAdapter()).toEqual('dummy_adapter');
        expect(event.getOptions()).toEqual({
          port: 4242,
          host: 'localhost',
        });
        expect(event.getServer()).toBe(adapter.getNativeServer());
      });

      it('should start the adapter', () => {
        expect(adapter.start).toHaveBeenCalledWith({
          port: 4242,
          host: 'localhost',
        });
      });

      it('should have triggered the ADAPTER_EVENT.SERVER_STARTED event', () => {
        expect(adapterServerStartedEventHandler).toHaveBeenCalled();

        const event: AdapterServerStartedEvent = adapterServerStartedEventHandler.mock.calls[0][0];

        expect(event.getType()).toEqual(ADAPTER_EVENTS.SERVER_STARTED);
        expect(event.getAdapter()).toEqual('dummy_adapter');
        expect(event.getOptions()).toEqual({
          port: 4242,
          host: 'localhost',
        });
      });

      it('should display a message containing the port when the server is started', () => {
        expect(processWriteSpy).toHaveBeenCalledWith('Webserver started - Listening on: 4242\n');
      });
    });

    describe('#terminate', () => {
      it('should stop the adapter', async () => {
        await webProcess.terminate();
        expect(adapter.stop).toHaveBeenCalled();
      });

      it('should have triggered the ADAPTER_EVENT.SERVER_STOPPED event', () => {
        expect(adapterServerStoppedEventHandler).toHaveBeenCalled();

        const event: AdapterServerStoppedEvent = adapterServerStoppedEventHandler.mock.calls[0][0];

        expect(event.getType()).toEqual(ADAPTER_EVENTS.SERVER_STOPPED);
        expect(event.getAdapter()).toEqual('dummy_adapter');
      });
    });
  });
});
