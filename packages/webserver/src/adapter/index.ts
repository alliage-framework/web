import http from 'http';
import https from 'https';

import { AbstractMiddleware } from '../middleware';
import { AbstractController } from '../controller';

export enum REQUEST_PHASE {
  PRE_CONTROLLER = 'PRE_CONTROLLER',
  POST_CONTROLLER = 'POST_CONTROLLER',
}

export type ServerOptions = {
  port: number;
  host?: string;
} & (
  | {
      isSecured: true;
      privateKey: string;
      certificate: string;
    }
  | {
      isSecured?: false;
    }
);

export interface InitializeParameters {
  middlewares: AbstractMiddleware[];
  controllers: AbstractController[];
  options: ServerOptions;
}

export abstract class AbstractAdapter {
  /**
   * Returns adapter's name
   */
  abstract getName(): string;

  /**
   * Sets up the server with the controllers and the middlewares
   * @param parameters
   */
  abstract initialize(parameters: InitializeParameters): this;

  /**
   * Starts the server
   * @param options
   */
  abstract start(options: ServerOptions): Promise<void>;

  /**
   * Stops the server
   */
  abstract stop(): Promise<void>;

  /**
   * Returns the native HTTP server
   */
  abstract getNativeServer(): http.Server | https.Server;
}

export * from './events';
