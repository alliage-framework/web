# Alliage Webserver Sandbox

Tool to perform integration tests on Alliage webserver applications.

## Description

`@alliage/webserver-sandbox` extends the [`@alliage/sandbox`](https://github.com/alliage-framework/sandbox) package to provide specialized testing capabilities for Alliage webserver applications. It allows you to:

- Start and stop webserver instances in isolated sandbox environments
- Make HTTP requests to the server
- Perform end-to-end integration tests on web applications

## Installation

```bash
npm install --save-dev @alliage/webserver-sandbox
# or
yarn add -D @alliage/webserver-sandbox
```

## Usage

### Basic Example

```typescript
import { Sandbox } from '@alliage/sandbox';
import { WebserverSandbox } from '@alliage/webserver-sandbox';

async function runWebserverTests() {
  // Create a base sandbox instance
  const sandbox = new Sandbox({
    scenarioPath: './path/to/test/scenario',
  });

  // Create webserver sandbox wrapper
  const webserverSandbox = new WebserverSandbox(sandbox);

  // Initialize the sandbox
  await sandbox.init();

  try {    
    // Start the webserver
    await webserverSandbox.start();

    // Make HTTP requests to test endpoints
    const client = webserverSandbox.getClient();
    const response = await client.get('/api/health');
    
    console.log('Health check:', response.data);
  } finally {
    // Clean up
    await webserverSandbox.stop();
    await sandbox.clear();
  }
}
```

### Using with Vitest/Jest

Here's a comprehensive example using the webserver sandbox with Vitest for integration testing:

```typescript
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Sandbox } from '@alliage/sandbox';
import { WebserverSandbox } from '@alliage/webserver-sandbox';

describe('Webserver Integration Tests', () => {
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  const webserverSandbox = new WebserverSandbox(sandbox);

  beforeAll(async () => {
    // Initialize the sandbox environment
    await sandbox.init();
  });

  afterAll(async () => {
    // Clean up webserver and sandbox
    await webserverSandbox.stop();
    await sandbox.clear();
  });

  it('should start a webserver and respond to basic requests', async () => {
    // Start the webserver
    await webserverSandbox.start();

    // Make a GET request to the root endpoint
    const response = await webserverSandbox.getClient().get('/');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ message: 'Hello world!' });
  });
});
```

### API Reference

#### Constructor

```typescript
new WebserverSandbox(sandbox: Sandbox)
```

| Parameter | Type    | Description                                    |
|-----------|---------|------------------------------------------------|
| sandbox   | Sandbox | An initialized [Sandbox](https://github.com/alliage-framework/sandbox) instance to wrap       |

#### Methods

##### `start(options?: StartOptions): Promise<void>`

Starts the webserver in the sandbox environment.

```typescript
interface StartOptions {
  timeout?: number; // Timeout in milliseconds (default: 30000)
  port?: number;    // Port to start the server on (optional)
  env?: Record<string, string>; // Environment variables
}
```

##### `stop(): Promise<void>`

Stops the running webserver instance.

##### `getClient(): AxiosInstance`

Returns an HTTP client (Axios instance) configured to make requests to the running webserver.

```typescript
// Example usage
const client = webserverSandbox.getClient();

// GET request
const getResponse = await client.get('/api/users');

// POST request with data
const postResponse = await client.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const putResponse = await client.put('/api/users/1', {
  name: 'Jane Doe'
});

// DELETE request
const deleteResponse = await client.delete('/api/users/1');
```

##### `getBaseUrl(): string`

Returns the base URL of the running webserver (e.g., `http://localhost:3000`).

##### `isRunning(): boolean`

Returns `true` if the webserver is currently running, `false` otherwise.
