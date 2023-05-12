import { AbstractMiddleware, REQUEST_PHASE, Context } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

@Service('upper-case-middleware')
export default class UpperCaseMiddleware extends AbstractMiddleware {
  getRequestPhase = () => REQUEST_PHASE.POST_CONTROLLER;

  apply(context: Context) {
    const response = context.getResponse();
    const body = response.getBody();
    if (body) {
      const newBody = Object.entries(body).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key.toUpperCase()]: value,
        }),
        {},
      );

      response.setBody(newBody);
    }
  }
}
