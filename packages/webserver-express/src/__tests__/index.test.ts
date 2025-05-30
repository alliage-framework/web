import { describe, it, expect, vi } from 'vitest';
import { DEPENDENCY, instanceOf, ParameterDependency, ServiceContainer } from '@alliage/di';
import { validators, loadConfig, CONFIG_EVENTS } from '@alliage/config-loader';
import { EventManager } from '@alliage/lifecycle';

import { schema, CONFIG_NAME } from '../config.js';
import WebserverExpressModule from '../index.js';
import { ExpressAdapter } from '../adapter/index.js';

vi.mock('@alliage/config-loader', async () => {
  const actual = await vi.importActual('@alliage/config-loader');
  return {
    ...actual,
    validators: {
      jsonSchema: vi.fn(),
    },
    loadConfig: vi.fn(),
  };
});

describe('webserver-express', () => {
  describe('WebserverExpressModule', () => {
    const module = new WebserverExpressModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD events', () => {
        const validateMockReturnValue = () => undefined;
        const loadConfigMockReturnValue = () => undefined;
        vi.mocked(validators.jsonSchema).mockReturnValueOnce(validateMockReturnValue);
        vi.mocked(loadConfig).mockReturnValueOnce(loadConfigMockReturnValue);

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
        const registerServiceSpy = vi.spyOn(serviceContainer, 'registerService');

        module.registerServices(serviceContainer);

        expect(registerServiceSpy).toHaveBeenCalledWith(
          'webserver-express-adapter',
          ExpressAdapter,
          [
            expect.objectContaining({
              type: DEPENDENCY.PARAMETER,
              getter: expect.any(Function),
            }),
            instanceOf(EventManager),
          ],
        );
        const parameterDependency: ParameterDependency = registerServiceSpy.mock
          .calls[0][2]![0] as any;
        const parameters = { [CONFIG_NAME]: 'ok' };
        expect(parameterDependency.getter(parameters)).toEqual('ok');
      });
    });
  });
});
