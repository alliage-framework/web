import http, { Server } from 'http';
import https, { Server as SecureServer } from 'https';

import express, {
  Express,
  Request as NativeRequest,
  Response as NativeResponse,
  NextFunction,
} from 'express';
import { version as expressVersion } from 'express/package.json';
import {
  AbstractAdapter,
  InitializeParameters,
  REQUEST_PHASE,
  ServerOptions,
  AbstractController,
  AbstractMiddleware,
  Context,
  AdapterNotFoundEvent,
  AdapterPostControllerEvent,
  AdapterPostRequestEvent,
  AdapterPreControllerEvent,
  AdapterPreRequestEvent,
} from '@alliage/webserver';
import { EventManager } from '@alliage/lifecycle';

import { Request } from '../network/request';
import { Response } from '../network/response';
import { Config } from '../config';

export const ADAPTER_NAME = `express-${expressVersion}`;

export class ExpressAdapter extends AbstractAdapter {
  private config: Config;

  private eventManager: EventManager;

  private app: Express;

  private server?: Server | SecureServer = undefined;

  private requests = new Map<NativeRequest, Request>();

  private responses = new Map<NativeResponse, Response>();

  constructor(config: Config, eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
    this.config = config;
    this.app = express();
  }

  getName = () => ADAPTER_NAME;

  initialize({ middlewares, controllers, options }: InitializeParameters) {
    Object.entries(this.config.settings).forEach(([key, value]) => this.app.set(key, value));

    const [preMiddlewares, postMiddlewares] = middlewares.reduce(
      ([pre, post], middleware) => {
        const part = middleware.getRequestPhase() === REQUEST_PHASE.PRE_CONTROLLER ? pre : post;
        part.push(middleware);
        return [pre, post];
      },
      [[], []] as [AbstractMiddleware[], AbstractMiddleware[]],
    );

    this.app.use(async (req, res, next) => {
      const request = this.getRequest(req);
      const response = this.getResponse(res);
      await this.eventManager.emit(
        ...AdapterPreRequestEvent.getParams(request, response, ADAPTER_NAME),
      );
      next();
    });

    this.registerMiddlewares(preMiddlewares);

    controllers.forEach((controller: AbstractController) => {
      const routes = controller.getRoutes();
      routes.forEach(([method, path, handler]) => {
        const verb = method.toLowerCase();
        (this.app as any)[verb](
          path,
          async (req: NativeRequest, res: NativeResponse, next: NextFunction) => {
            const request = this.getRequest(req);
            const response = this.getResponse(res);
            request.setExtraPayload('controller_matched', true);
            try {
              if (!response.isFinished()) {
                const preControllerEvent = new AdapterPreControllerEvent(
                  controller,
                  handler,
                  request,
                  response,
                  [request, response, ADAPTER_NAME],
                  ADAPTER_NAME,
                );
                await this.eventManager.emit(preControllerEvent.getType(), preControllerEvent);
                const returnedValue = await handler.call(
                  controller,
                  ...preControllerEvent.getArguments(),
                );
                await this.eventManager.emit(
                  ...AdapterPostControllerEvent.getParams(
                    controller,
                    handler,
                    request,
                    response,
                    returnedValue,
                    ADAPTER_NAME,
                  ),
                );
              }
              next();
            } catch (e) {
              next(e);
            }
          },
        );
      });
    });
    this.app.use(async (req: NativeRequest, res: NativeResponse, next: NextFunction) => {
      const request = this.getRequest(req);
      const response = this.getResponse(res);

      if (!request.getExtraPayload('controller_matched')) {
        response.setStatus(404).setBody('Not found');
        await this.eventManager.emit(
          ...AdapterNotFoundEvent.getParams(request, response, ADAPTER_NAME),
        );
        response.end();
      }
      next();
    });

    this.registerMiddlewares(postMiddlewares);

    // Remove unique Request and Response for the given req and res
    // and end the response
    this.app.use(async (req, res) => {
      const response = this.getResponse(res);
      const request = this.getRequest(req);
      response.end();
      await this.eventManager.emit(
        ...AdapterPostRequestEvent.getParams(request, response, ADAPTER_NAME),
      );
      this.removeRequest(req);
      this.removeResponse(res);
    });

    this.server = options.isSecured
      ? https.createServer(
          {
            cert: options.certificate,
            key: options.privateKey,
          },
          this.app,
        )
      : http.createServer(this.app);

    return this;
  }

  start({ port, host }: ServerOptions) {
    const server = this.getNativeServer();
    return new Promise<void>((resolve, reject) => {
      server.on('error', (error) => reject(error));
      server.listen(port, host as any, async () => {
        resolve();
      });
    });
  }

  stop() {
    return new Promise<void>((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.removeAllListeners('error');
      this.server.close(async (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  getNativeServer(): http.Server | https.Server {
    if (!this.server) {
      throw new Error('The server is not initialized yet.');
    }
    return this.server;
  }

  private registerMiddlewares(middlewares: AbstractMiddleware[]) {
    middlewares.forEach((middleware) => {
      const handlesError = middleware.apply.length > 1;
      const handler = async (
        req: NativeRequest,
        res: NativeResponse,
        next: NextFunction,
        error?: Error,
      ) => {
        const request = this.getRequest(req);
        const response = this.getResponse(res);
        if (response.isFinished()) {
          next();
          return;
        }
        try {
          await middleware.apply(new Context(request, response, ADAPTER_NAME), error);
          next();
        } catch (e) {
          next(e);
        }
      };
      this.app.use(
        handlesError
          ? (err: Error, req: NativeRequest, res: NativeResponse, next: NextFunction) =>
              handler(req, res, next, err)
          : (req: NativeRequest, res: NativeResponse, next: NextFunction) =>
              handler(req, res, next),
      );
    });
  }

  private removeRequest(req: NativeRequest) {
    this.requests.delete(req);
  }

  private removeResponse(res: NativeResponse) {
    this.responses.delete(res);
  }

  private getRequest(req: NativeRequest) {
    let request = this.requests.get(req);
    if (!request) {
      request = new Request(req);
      this.requests.set(req, request);
    }
    return request;
  }

  private getResponse(res: NativeResponse) {
    let response = this.responses.get(res);
    if (!response) {
      response = new Response(res);
      this.responses.set(res, response);
    }
    return response;
  }
}
