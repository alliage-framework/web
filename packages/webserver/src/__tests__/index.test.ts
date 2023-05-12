import { ServiceContainer, allInstancesOf, Constructor, instanceOf, parameter } from '@alliage/di';
import { validators, loadConfig, CONFIG_EVENTS } from '@alliage/config-loader';
import { EventManager } from '@alliage/lifecycle';

import { schema, CONFIG_NAME } from '../config';
import { AbstractAdapter } from '../adapter';
import { AbstractController } from '../controller';
import { AbstractMiddleware } from '../middleware';
import { WebProcess } from '../process';
import WebserverModule from '..';

jest.mock('@alliage/config-loader', () => {
  return {
    ...(jest.requireActual('@alliage/config-loader') as any),
    validators: {
      jsonSchema: jest.fn(),
    },
    loadConfig: jest.fn(),
  };
});
jest.mock('@alliage/di', () => {
  return {
    ...(jest.requireActual('@alliage/di') as any),
    parameter: (path: string) => ({ type: 'DEPENDENCY/PARAMETER', path }),
  };
});

describe('webserver', () => {
  describe('WebserverModule', () => {
    const module = new WebserverModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD events', () => {
        const validateMockReturnValue = () => undefined;
        const loadConfigMockReturnValue = () => undefined;
        (validators.jsonSchema as jest.Mock).mockReturnValueOnce(validateMockReturnValue);
        (loadConfig as jest.Mock).mockReturnValueOnce(loadConfigMockReturnValue);

        expect(module.getEventHandlers()).toEqual({
          [CONFIG_EVENTS.LOAD]: loadConfigMockReturnValue,
        });

        expect(validators.jsonSchema).toHaveBeenCalledWith(schema);
        expect(loadConfig).toHaveBeenCalledWith(CONFIG_NAME, validateMockReturnValue);
      });
    });

    describe('#registerServices', () => {
      it('should register the web process', () => {
        const serviceContainer = new ServiceContainer();
        const registerServiceSpy = jest.spyOn(serviceContainer, 'registerService');

        module.registerServices(serviceContainer);

        expect(registerServiceSpy).toHaveBeenCalledWith('web-process', WebProcess, [
          parameter(CONFIG_NAME),
          instanceOf(<Constructor>AbstractAdapter),
          allInstancesOf(<Constructor>AbstractMiddleware),
          allInstancesOf(<Constructor>AbstractController),
          instanceOf(EventManager),
        ]);
      });
    });
  });
});
