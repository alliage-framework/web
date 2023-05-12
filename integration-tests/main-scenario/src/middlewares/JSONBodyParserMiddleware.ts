import bodyParser from 'body-parser';
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service } from '@alliage/service-loader';

export default Service('json-body-parser-middleware')(
  createNativeMiddleware(bodyParser.json, {
    args: () => [{ strict: true }],
  }),
);
