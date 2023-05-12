/* eslint-disable max-classes-per-file */
import { NextFunction, Request as NativeRequest, Response as NativeResponse } from 'express';
import { REQUEST_PHASE, AbstractMiddleware, Context } from '@alliage/webserver';

import { Request } from '../../network/request';
import { Response } from '../../network/response';
import { createNativeMiddleware } from '../native-middleware';

describe('webserver-express/middleware/native-middleware', () => {
  describe('#createNativeMiddleware', () => {
    describe('simple use case', () => {
      const dummyMiddleware = jest.fn();
      const NativeMiddleware = createNativeMiddleware(dummyMiddleware);

      let middleware: AbstractMiddleware;
      it('should create a middleware', () => {
        middleware = new NativeMiddleware();
        expect(middleware).toBeInstanceOf(AbstractMiddleware);
      });

      it('should have 0 applyBefore by default', () => {
        expect(middleware.applyBefore()).toEqual([]);
      });

      it('should have 0 applyAfter by default', () => {
        expect(middleware.applyAfter()).toEqual([]);
      });

      it('should have a REQUEST_PHASE.PRE_CONTROLLER by default', () => {
        expect(middleware.getRequestPhase()).toEqual(REQUEST_PHASE.PRE_CONTROLLER);
      });

      it('should have an apply method taking only 1 arg', () => {
        expect(middleware.apply.length).toEqual(1);
      });

      it("should call the middleware when 'apply' method is executed", () => {
        const dummyNativeRequest = ({ dummy: 'request' } as unknown) as NativeRequest;
        const dummyNativeResponse = ({
          dummy: 'response',
          on: () => undefined,
        } as unknown) as NativeResponse;
        const dummyRequest = new Request(dummyNativeRequest);
        const dummyResponse = new Response(dummyNativeResponse);
        const context = new Context(dummyRequest, dummyResponse, 'test-adapter');

        middleware.apply(context);

        expect(dummyMiddleware).toHaveBeenCalledWith(
          dummyNativeRequest,
          dummyNativeResponse,
          expect.any(Function),
        );
      });
    });

    describe('complex use case', () => {
      class DummyDependency1 extends AbstractMiddleware {
        getRequestPhase = () => REQUEST_PHASE.POST_CONTROLLER;

        apply() {
          // empty
        }
      }

      class DummyDependency2 extends AbstractMiddleware {
        getRequestPhase = () => REQUEST_PHASE.POST_CONTROLLER;

        apply() {
          // empty
        }
      }
      const dummyMiddleware = jest.fn();
      const dummyMiddlewareCreator = jest
        .fn()
        .mockReturnValue(
          (err: Error, req: NativeRequest, res: NativeResponse, next: NextFunction) =>
            dummyMiddleware(err, req, res, next),
        );
      const argsBuilder = jest.fn().mockReturnValue(['arg1', 'arg2']);
      const NativeMiddleware = createNativeMiddleware(dummyMiddlewareCreator, {
        args: argsBuilder,
        requestPhase: REQUEST_PHASE.POST_CONTROLLER,
        applyBefore: [DummyDependency1],
        applyAfter: [DummyDependency2],
      });
      const middleware = new NativeMiddleware('dep1', 'dep2', 'dep3');
      it('should have the applyBefore defined during the creation', () => {
        expect(middleware.applyBefore()).toEqual([DummyDependency1]);
      });

      it('should have the applyAfter defined during the creation', () => {
        expect(middleware.applyAfter()).toEqual([DummyDependency2]);
      });

      it('should have a REQUEST_PHASE.POST_CONTROLLER as defined during the creation', () => {
        expect(middleware.getRequestPhase()).toEqual(REQUEST_PHASE.POST_CONTROLLER);
      });

      it("should have called the 'args' function with the arguments passed to the constructor", () => {
        expect(argsBuilder).toHaveBeenCalledWith('dep1', 'dep2', 'dep3');
      });

      it("should have instanciated the native middleware with the arguments returned by the 'args' function", () => {
        expect(dummyMiddlewareCreator).toHaveBeenCalledWith('arg1', 'arg2');
      });

      it('should have an apply method taking 2 args', () => {
        expect(middleware.apply.length).toEqual(2);
      });

      it("should call the middleware when 'apply' method is executed", () => {
        const error = new Error();
        const dummyNativeRequest = ({ dummy: 'request' } as unknown) as NativeRequest;
        const dummyNativeResponse = ({
          dummy: 'response',
          on: () => undefined,
        } as unknown) as NativeResponse;
        const dummyRequest = new Request(dummyNativeRequest);
        const dummyResponse = new Response(dummyNativeResponse);
        const context = new Context(dummyRequest, dummyResponse, 'test-adapter');

        middleware.apply(context, error);

        expect(dummyMiddleware).toHaveBeenCalledWith(
          error,
          dummyNativeRequest,
          dummyNativeResponse,
          expect.any(Function),
        );
      });
    });
  });
});
