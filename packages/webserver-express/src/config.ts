import { asConst, FromSchema } from 'json-schema-to-ts';

export const CONFIG_NAME = 'webserver-express';

export const schema = asConst({
  properties: {
    settings: {
      additionalProperties: {},
      type: 'object',
    },
  },
  required: ['settings'],
  type: 'object',
});

export type Config = FromSchema<typeof schema>;