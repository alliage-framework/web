import { asConst, FromSchema } from 'json-schema-to-ts';

export const CONFIG_NAME = 'webserver';

export const schema = asConst({
  allOf: [
    {
      properties: {
        host: {
          type: 'string',
        },
        port: {
          type: 'number',
        },
      },
      required: ['port'],
      type: 'object',
    },
    {
      anyOf: [
        {
          properties: {
            certificate: {
              type: 'string',
            },
            isSecured: {
              enum: [true],
              type: 'boolean',
            },
            privateKey: {
              type: 'string',
            },
          },
          required: ['certificate', 'isSecured', 'privateKey'],
          type: 'object',
        },
        {
          properties: {
            isSecured: {
              enum: [false],
              type: 'boolean',
            },
          },
        }
      ]
    }
  ],
});

export type Config = FromSchema<typeof schema>;
