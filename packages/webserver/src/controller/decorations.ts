import { HTTP_METHOD } from '../network/index.js';

import { AbstractController, RouteHandler } from './abstract-controller.js';

const createRouteAnnotation =
  (method: HTTP_METHOD) =>
  (path: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (originalMethod: (...args: any[]) => any, context: ClassMethodDecoratorContext) => {
    context.addInitializer(function () {
      (this as AbstractController).addRoute(
        method,
        path,
        (this as AbstractController)[context.name as keyof typeof this] as RouteHandler,
      );
    });

    return originalMethod;
  };

export const Get = createRouteAnnotation(HTTP_METHOD.GET);
export const Post = createRouteAnnotation(HTTP_METHOD.POST);
export const Put = createRouteAnnotation(HTTP_METHOD.PUT);
export const Delete = createRouteAnnotation(HTTP_METHOD.DELETE);
export const Head = createRouteAnnotation(HTTP_METHOD.HEAD);
export const Options = createRouteAnnotation(HTTP_METHOD.OPTIONS);
export const Connect = createRouteAnnotation(HTTP_METHOD.CONNECT);
export const Trace = createRouteAnnotation(HTTP_METHOD.TRACE);
