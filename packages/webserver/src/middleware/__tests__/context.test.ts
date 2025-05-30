import { describe, it, expect } from 'vitest';
import { AbstractRequest } from '../../network/request.js';
import { AbstractResponse } from '../../network/response.js';
import { Context } from '../context.js';

describe('webserver/middleware/context', () => {
  describe('Context', () => {
    const request = {} as AbstractRequest;
    const response = {} as AbstractResponse;

    const context = new Context(request, response, 'test-adapter');

    describe('#getRequest', () => {
      it('should return the request', () => {
        expect(context.getRequest()).toBe(request);
      });

      it('should return the response', () => {
        expect(context.getResponse()).toBe(response);
      });

      it('should return the adapter', () => {
        expect(context.getAdapter()).toEqual('test-adapter');
      });
    });
  });
});
