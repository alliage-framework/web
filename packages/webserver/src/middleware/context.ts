import { AbstractRequest } from '../network/request';
import { AbstractResponse } from '../network/response';

export class Context {
  constructor(
    private request: AbstractRequest,
    private response: AbstractResponse,
    private adapter: string,
  ) {}

  getRequest() {
    return this.request;
  }

  getResponse() {
    return this.response;
  }

  getAdapter() {
    return this.adapter;
  }
}
