import { describe, it, expect } from 'vitest';
import { AbstractMiddleware } from '../index.js';
import { REQUEST_PHASE } from '../../adapter/index.js';

describe('webserver/middleware', () => {
  describe('AbstractMiddleware', () => {
    class DummyMiddleware extends AbstractMiddleware {
      getRequestPhase = () => REQUEST_PHASE.POST_CONTROLLER;

      apply = () => undefined;
    }

    const middleware = new DummyMiddleware();
    describe('#applyBefore', () => {
      it('should return a empty array by default', () => {
        expect(middleware.applyBefore()).toEqual([]);
      });
    });

    describe('#applyAfter', () => {
      it('should return a empty array by default', () => {
        expect(middleware.applyAfter()).toEqual([]);
      });
    });
  });
});
