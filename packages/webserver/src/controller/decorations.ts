import { HTTP_METHOD } from '../network/index.js';

import { AbstractController } from './index.js';

const createRouteAnnotation = (method: HTTP_METHOD) => (path: string) => (
  controller: AbstractController,
  handlerName: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controller.addRoute(method, path, (controller as any)[handlerName]);
};

export const Get = createRouteAnnotation(HTTP_METHOD.GET);
export const Post = createRouteAnnotation(HTTP_METHOD.POST);
export const Put = createRouteAnnotation(HTTP_METHOD.PUT);
export const Delete = createRouteAnnotation(HTTP_METHOD.DELETE);
export const Head = createRouteAnnotation(HTTP_METHOD.HEAD);
export const Options = createRouteAnnotation(HTTP_METHOD.OPTIONS);
export const Connect = createRouteAnnotation(HTTP_METHOD.CONNECT);
export const Trace = createRouteAnnotation(HTTP_METHOD.TRACE);
