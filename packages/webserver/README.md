# Alliage Webserver

Add web server capabilities to your Alliage application with automatic controller registration and middleware support.

## Dependencies

- [@alliage/config-loader](https://github.com/alliage-framework/core/beta/main/packages/configuration-loader) - Configuration management
- [@alliage/module-installer](https://github.com/alliage-framework/core/beta/main/packages/module-installer) - Module installation utilities
- [@alliage/process-manager](https://github.com/alliage-framework/core/beta/main/packages/process-manager) - Process management

## Installation

```bash
yarn add @alliage/webserver
```

Or with npm:

```bash
npm install @alliage/webserver
```


## Registration

If you've already installed [@alliage/module-installer](https://github.com/alliage-framework/core/beta/main/packages/module-installer), simply run:

```bash
npx alliage-scripts install @alliage/webserver
```

Otherwise, update your `alliage-modules.json` file by adding:

```json
{
  // ... other modules
  "@alliage/webserver": {
    "module": "@alliage/webserver",
    "deps": [
      "@alliage/config-loader",
      "@alliage/module-installer", 
      "@alliage/process-manager"
    ],
    "envs": []
  }
}
```

## Usage

This module provides a web server process that can handle HTTP requests through controllers and process them through middlewares. It uses an adapter pattern to support different HTTP server implementations.

### Configuration

Upon installation, a `config/webserver.yaml` file will be created with default settings:

```yaml
port: 8080
host: localhost
isSecured: false
# privateKey: ""
# certificate: ""
```

#### Configuration Options

- `port` (number, required): The port number for the web server
- `host` (string, optional): The hostname to bind to (defaults to localhost)
- `isSecured` (boolean): Whether to use HTTPS
- `privateKey` (string, required if isSecured is true): Content of the private key file for HTTPS
- `certificate` (string, required if isSecured is true): Content of the certificate file for HTTPS

### Adapters

The webserver module requires an adapter to handle the actual HTTP server implementation. Adapters translate between the Alliage webserver abstractions and specific HTTP server libraries.

#### Available Adapters

- [**@alliage/webserver-express**](../webserver-express/): Express.js adapter for Node.js applications

#### Installing an Adapter

```bash
# Install the Express adapter
yarn add @alliage/webserver-express

# Register it in your alliage-modules.json
{
  "@alliage/webserver-express": {
    "module": "@alliage/webserver-express",
    "deps": ["@alliage/webserver"],
    "envs": []
  }
}
```

### Defining Controllers

Controllers handle HTTP requests and define routes. They must extend `AbstractController` and use route decorators.

```typescript
import {
  AbstractController,
  AbstractRequest,
  AbstractResponse,
  Get,
  Post,
  Put,
  Delete
} from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

interface CreateUserBody {
  name: string;
  email: string;
}

@Service('user-controller')
export default class UserController extends AbstractController {
  @Get('/users')
  async listUsers(request: AbstractRequest, response: AbstractResponse) {
    // Fetch users from database
    const users = await this.userService.findAll();
    response.setBody({ users });
  }

  @Get('/users/:id')
  async getUser(request: AbstractRequest, response: AbstractResponse) {
    const { id } = request.getParams();
    const user = await this.userService.findById(id);
    
    if (!user) {
      response.setStatus(404).setBody({ error: 'User not found' });
      return;
    }
    
    response.setBody({ user });
  }

  @Post('/users')
  async createUser(
    request: AbstractRequest<unknown, unknown, CreateUserBody>,
    response: AbstractResponse
  ) {
    const { name, email } = request.getBody();
    const user = await this.userService.create({ name, email });
    response.setStatus(201).setBody({ user });
  }

  @Put('/users/:id')
  async updateUser(
    request: AbstractRequest<unknown, unknown, Partial<CreateUserBody>>,
    response: AbstractResponse
  ) {
    const { id } = request.getParams();
    const updates = request.getBody();
    const user = await this.userService.update(id, updates);
    response.setBody({ user });
  }

  @Delete('/users/:id')
  async deleteUser(request: AbstractRequest, response: AbstractResponse) {
    const { id } = request.getParams();
    await this.userService.delete(id);
    response.setStatus(204);
  }
}
```

#### Route Decorators

Available HTTP method decorators:

- `@Get(path)` - Handle GET requests
- `@Post(path)` - Handle POST requests  
- `@Put(path)` - Handle PUT requests
- `@Delete(path)` - Handle DELETE requests
- `@Head(path)` - Handle HEAD requests
- `@Options(path)` - Handle OPTIONS requests
- `@Connect(path)` - Handle CONNECT requests
- `@Trace(path)` - Handle TRACE requests

Path parameters are supported using Express-style syntax: `/users/:id`, `/posts/:postId/comments/:commentId`

### Defining Middlewares

Middlewares process requests before or after controllers. They must extend `AbstractMiddleware`.

#### Custom Middleware Example

```typescript
import { 
  AbstractMiddleware, 
  REQUEST_PHASE, 
  Context 
} from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

@Service('auth-middleware')
export default class AuthMiddleware extends AbstractMiddleware {
  getRequestPhase = () => REQUEST_PHASE.PRE_CONTROLLER;

  async apply(context: Context) {
    const request = context.getRequest();
    const response = context.getResponse();
    
    const authHeader = request.getHeaders().authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.setStatus(401).setBody({ error: 'Unauthorized' }).end();
      return;
    }
    
    const token = authHeader.substring(7);
    try {
      const user = await this.authService.validateToken(token);
      request.setExtraPayload('user', user);
    } catch (error) {
      response.setStatus(401).setBody({ error: 'Invalid token' }).end();
    }
  }
}
```

#### Middleware Ordering

Middlewares can specify their execution order relative to other middlewares:

```typescript
import { 
  AbstractMiddleware, 
  REQUEST_PHASE, 
  Context 
} from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

@Service('cors-middleware')
export default class CorsMiddleware extends AbstractMiddleware {
  // This middleware should run before AuthMiddleware
  applyBefore = () => [AuthMiddleware];
  
  // This middleware should run after LoggingMiddleware  
  applyAfter = () => [LoggingMiddleware];

  getRequestPhase = () => REQUEST_PHASE.PRE_CONTROLLER;

  apply(context: Context) {
    const response = context.getResponse();
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  }
}
```

#### Request Phases

- `REQUEST_PHASE.PRE_CONTROLLER`: Execute before controller actions
- `REQUEST_PHASE.POST_CONTROLLER`: Execute after controller actions

### Request and Response Objects

#### AbstractRequest

The request object provides access to HTTP request data:

```typescript
// Get URL parameters
const { id } = request.getParams();

// Get query parameters  
const { page, limit } = request.getQuery();

// Get request body
const body = request.getBody();

// Get headers
const contentType = request.getHeaders()['content-type'];

// Get HTTP method
const method = request.getMethod();

// Get URL path
const path = request.getPath();

// Store/retrieve extra data
request.setExtraPayload('user', userData);
const user = request.getExtraPayload('user');
```

#### AbstractResponse

The response object allows you to build HTTP responses:

```typescript
// Set response body
response.setBody({ message: 'Success' });

// Set status code
response.setStatus(201);

// Set headers
response.setHeader('Content-Type', 'application/json');

// Check if response is finished
if (!response.isFinished()) {
  response.setBody({ error: 'Something went wrong' });
}

// End the response (usually done automatically)
response.end();
```

### Running the Web Server

Start the web server using the process manager:

```bash
# Start with default configuration
$ npx alliage-scripts start web

# Start on a specific port
$ npx alliage-scripts start web --port 3000
```

### Integration with Service Loader

Controllers and middlewares are automatically discovered and registered when using [@alliage/service-loader](https://github.com/alliage-framework/core/tree/main/packages/service-loader):

1. Place controllers in files matching the service loader patterns (e.g., `src/controllers/**/*`)
2. Export them as default exports with the `@Service` decorator
3. They will be automatically registered with the webserver

## Events

The webserver module emits several events during the request lifecycle that you can listen to for logging, monitoring, or custom processing.

### Adapter Events

These events are emitted by adapters during request processing:

| Event Type | Event Object | Description |
|------------|--------------|-------------|
| `ADAPTER_EVENTS.PRE_REQUEST` | [AdapterPreRequestEvent](#adapterprerequestevent) | Triggered before processing a request |
| `ADAPTER_EVENTS.PRE_CONTROLLER` | [AdapterPreControllerEvent](#adapterprecontrollerevent) | Triggered before executing a controller action |
| `ADAPTER_EVENTS.POST_CONTROLLER` | [AdapterPostControllerEvent](#adapterpostcontrollerevent) | Triggered after executing a controller action |
| `ADAPTER_EVENTS.POST_REQUEST` | [AdapterPostRequestEvent](#adapterpostrequestevent) | Triggered after processing a request |
| `ADAPTER_EVENTS.NOT_FOUND` | [AdapterNotFoundEvent](#adapternotfoundevent) | Triggered when no route matches the request |
| `ADAPTER_EVENTS.SERVER_INITIALIZED` | [AdapterServerInitializedEvent](#adapterserverinitializedevent) | Triggered when the server is initialized |
| `ADAPTER_EVENTS.SERVER_STARTED` | [AdapterServerStartedEvent](#adapterserverstartedevent) | Triggered when the server starts |
| `ADAPTER_EVENTS.SERVER_STOPPED` | [AdapterServerStoppedEvent](#adapterserverstopedevent) | Triggered when the server stops |

#### AdapterPreRequestEvent

Available methods for this event:

- `getRequest(): AbstractRequest` - Returns the request object
- `getResponse(): AbstractResponse` - Returns the response object  
- `getAdapterName(): string` - Returns the name of the adapter

#### AdapterPreControllerEvent

Available methods for this event:

- `getController(): AbstractController` - Returns the controller instance
- `getHandler(): RouteHandler` - Returns the route handler function
- `getRequest(): AbstractRequest` - Returns the request object
- `getResponse(): AbstractResponse` - Returns the response object
- `getArguments(): unknown[]` - Returns the arguments that will be passed to the controller
- `setArguments(args: unknown[]): void` - Allows modifying the arguments passed to the controller
- `getAdapterName(): string` - Returns the name of the adapter

#### AdapterPostControllerEvent

Available methods for this event:

- `getController(): AbstractController` - Returns the controller instance
- `getHandler(): RouteHandler` - Returns the route handler function
- `getRequest(): AbstractRequest` - Returns the request object
- `getResponse(): AbstractResponse` - Returns the response object
- `getReturnedValue(): unknown` - Returns the value returned by the controller
- `getAdapterName(): string` - Returns the name of the adapter

#### AdapterPostRequestEvent

Available methods for this event:

- `getRequest(): AbstractRequest` - Returns the request object
- `getResponse(): AbstractResponse` - Returns the response object
- `getAdapterName(): string` - Returns the name of the adapter

#### AdapterNotFoundEvent

Available methods for this event:

- `getRequest(): AbstractRequest` - Returns the request object
- `getResponse(): AbstractResponse` - Returns the response object
- `getAdapterName(): string` - Returns the name of the adapter

#### AdapterServerInitializedEvent

Available methods for this event:

- `getOptions(): ServerOptions` - Returns the server configuration options
- `getAdapterName(): string` - Returns the name of the adapter
- `getNativeServer(): http.Server | https.Server` - Returns the native HTTP server instance

#### AdapterServerStartedEvent

Available methods for this event:

- `getOptions(): ServerOptions` - Returns the server configuration options
- `getAdapterName(): string` - Returns the name of the adapter

#### AdapterServerStoppedEvent

Available methods for this event:

- `getAdapterName(): string` - Returns the name of the adapter

### Event Usage Example

```typescript
import { AbstractModule } from '@alliage/framework';
import { ADAPTER_EVENTS } from '@alliage/webserver';

export default class LoggingModule extends AbstractModule {
  getEventHandlers() {
    return {
      [ADAPTER_EVENTS.PRE_REQUEST]: this.onPreRequest,
      [ADAPTER_EVENTS.POST_REQUEST]: this.onPostRequest,
      [ADAPTER_EVENTS.NOT_FOUND]: this.onNotFound,
    };
  }

  onPreRequest = async (event) => {
    const request = event.getRequest();
    console.log(`${request.getMethod()} ${request.getPath()}`);
  };

  onPostRequest = async (event) => {
    const response = event.getResponse();
    console.log(`Response status: ${response.getStatus()}`);
  };

  onNotFound = async (event) => {
    const request = event.getRequest();
    console.log(`404 - Route not found: ${request.getPath()}`);
  };
}
```

## Advanced Usage

### Custom Adapters

You can create custom adapters by extending `AbstractAdapter`:

```typescript
import { AbstractAdapter, InitializeParameters, ServerOptions } from '@alliage/webserver';
import http from 'http';

export class CustomAdapter extends AbstractAdapter {
  private server?: http.Server;

  getName() {
    return 'custom-adapter';
  }

  initialize({ middlewares, controllers, options }: InitializeParameters) {
    // Set up your HTTP server with controllers and middlewares
    this.server = http.createServer(/* your implementation */);
    return this;
  }

  async start(options: ServerOptions) {
    return new Promise<void>((resolve, reject) => {
      this.server!.listen(options.port, options.host, () => resolve());
    });
  }

  async stop() {
    return new Promise<void>((resolve) => {
      this.server!.close(() => resolve());
    });
  }

  getNativeServer() {
    return this.server!;
  }
}
```

### Adapter Development Guide

Creating a custom adapter requires understanding the theoretical rules and patterns that govern how adapters should handle requests, middlewares, controllers, and events.

#### Core Principles

1. **Request/Response Abstraction**: Adapters must implement concrete Request and Response classes that extend `AbstractRequest` and `AbstractResponse`
2. **Event-Driven Architecture**: Adapters must emit specific events at precise moments in the request lifecycle
3. **Middleware Chain**: Adapters must respect middleware ordering and phases (PRE_CONTROLLER vs POST_CONTROLLER)
4. **Controller Routing**: Adapters must route requests to the appropriate controller methods based on HTTP method and path
5. **Error Handling**: Adapters must handle errors thrown by controllers and middlewares gracefully
6. **Resource Management**: Adapters must manage request/response object lifecycle to prevent memory leaks

#### Request Lifecycle and Event Flow

Every request processed by an adapter must follow this exact sequence:

```
1. Request arrives at adapter
2. Create Request/Response abstractions
3. Emit PRE_REQUEST event
4. Execute PRE_CONTROLLER middlewares (in order)
5. Route matching and controller selection
6. Emit PRE_CONTROLLER event
7. Execute controller handler
8. Emit POST_CONTROLLER event
9. Execute POST_CONTROLLER middlewares (in order)
10. If no route matched, emit NOT_FOUND event
11. End response if not already ended
12. Emit POST_REQUEST event
13. Clean up Request/Response objects
```

#### Required Event Emissions

Adapters **MUST** emit these events at the specified times:

```typescript
// 1. At server initialization (in initialize() method)
const initializedEvent = new AdapterServerInitializedEvent(
  options,
  this.getName(),
  this.getNativeServer()
);
await this.eventManager.emit(initializedEvent.getType(), initializedEvent);

// 2. When server starts (in start() method)
const startedEvent = new AdapterServerStartedEvent(options, this.getName());
await this.eventManager.emit(startedEvent.getType(), startedEvent);

// 3. Before processing any request
await this.eventManager.emit(
  ...AdapterPreRequestEvent.getParams(request, response, this.getName())
);

// 4. Before calling a controller (if route matches)
const preControllerEvent = new AdapterPreControllerEvent(
  controller,
  handler,
  request,
  response,
  [request, response, this.getName()], // Default arguments
  this.getName()
);
await this.eventManager.emit(preControllerEvent.getType(), preControllerEvent);

// 5. After calling a controller
await this.eventManager.emit(
  ...AdapterPostControllerEvent.getParams(
    controller,
    handler,
    request,
    response,
    returnedValue,
    this.getName()
  )
);

// 6. When no route matches
await this.eventManager.emit(
  ...AdapterNotFoundEvent.getParams(request, response, this.getName())
);

// 7. After processing request
await this.eventManager.emit(
  ...AdapterPostRequestEvent.getParams(request, response, this.getName())
);

// 8. When server stops (in stop() method)
const stoppedEvent = new AdapterServerStoppedEvent(this.getName());
await this.eventManager.emit(stoppedEvent.getType(), stoppedEvent);
```

#### Middleware Handling Rules

Middlewares must be processed according to these rules:

1. **Phase Separation**: Split middlewares into PRE_CONTROLLER and POST_CONTROLLER phases
2. **Ordering**: Respect `applyBefore()` and `applyAfter()` constraints within each phase
3. **Context**: Always pass a `Context` object containing request, response, and adapter name
4. **Error Handling**: Check middleware arity to determine if it handles errors (2+ parameters)
5. **Response State**: Check `response.isFinished()` before calling middleware
6. **Error Propagation**: Catch middleware errors and pass them to the next middleware in the chain

```typescript
// Example middleware processing
private async processMiddlewares(middlewares: AbstractMiddleware[], request: AbstractRequest, response: AbstractResponse, error?: Error) {
  for (const middleware of middlewares) {
    if (response.isFinished()) break;
    
    try {
      const context = new Context(request, response, this.getName());
      const handlesError = middleware.apply.length > 1;
      
      if (handlesError && error) {
        await middleware.apply(context, error);
        error = undefined; // Error was handled
      } else if (!handlesError && !error) {
        await middleware.apply(context);
      }
    } catch (e) {
      error = e; // Propagate error to next middleware
    }
  }
  
  if (error) {
    // Handle unprocessed error (e.g., send 500 response)
  }
}
```

#### Controller Handling Rules

Controllers must be processed according to these rules:

1. **Route Registration**: Register all routes from all controllers during initialization
2. **Route Matching**: Match incoming requests to registered routes by HTTP method and path
3. **Parameter Extraction**: Extract path parameters and make them available via `request.getParams()`
4. **Controller Execution**: Call the matched handler with the arguments from PRE_CONTROLLER event
5. **Error Handling**: Catch controller errors and handle them appropriately
6. **Response Management**: Ensure response is ended if controller doesn't end it

```typescript
// Example controller processing
controllers.forEach((controller: AbstractController) => {
  const routes = controller.getRoutes();
  routes.forEach(([method, path, handler]) => {
    this.registerRoute(method, path, async (req, res) => {
      const request = this.getRequest(req);
      const response = this.getResponse(res);
      
      try {
        // Mark that a controller was matched
        request.setExtraPayload('controller_matched', true);
        
        if (!response.isFinished()) {
          const preControllerEvent = new AdapterPreControllerEvent(
            controller,
            handler,
            request,
            response,
            [request, response, this.getName()],
            this.getName()
          );
          await this.eventManager.emit(preControllerEvent.getType(), preControllerEvent);
          
          const returnedValue = await handler.call(
            controller,
            ...preControllerEvent.getArguments()
          );
          
          await this.eventManager.emit(
            ...AdapterPostControllerEvent.getParams(
              controller,
              handler,
              request,
              response,
              returnedValue,
              this.getName()
            )
          );
        }
      } catch (error) {
        // Handle controller error
        if (!response.isFinished()) {
          response.setStatus(500).setBody({ error: 'Internal Server Error' });
        }
      }
    });
  });
});
```

#### Request/Response Object Management

Adapters must manage Request/Response object lifecycle:

1. **Object Creation**: Create one Request/Response pair per HTTP request
2. **Object Reuse**: Reuse the same objects throughout the request lifecycle
3. **Object Storage**: Store objects in a way that allows retrieval by native request/response
4. **Object Cleanup**: Remove objects after request processing to prevent memory leaks

```typescript
private requests = new Map<NativeRequest, Request>();
private responses = new Map<NativeResponse, Response>();

private getRequest(nativeReq: NativeRequest): Request {
  let request = this.requests.get(nativeReq);
  if (!request) {
    request = new Request(nativeReq);
    this.requests.set(nativeReq, request);
  }
  return request;
}

private removeRequest(nativeReq: NativeRequest) {
  this.requests.delete(nativeReq);
}
```

#### Error Handling Strategies

Adapters should implement comprehensive error handling:

1. **Controller Errors**: Catch and convert to HTTP error responses
2. **Middleware Errors**: Pass to error-handling middlewares or convert to HTTP responses
3. **System Errors**: Log and send generic 500 responses
4. **Response State**: Never modify finished responses

#### Complete Request and Response API

##### AbstractRequest Interface

The `AbstractRequest` class provides access to HTTP request data and must be implemented by all adapters. Here's the complete API organized by functionality:

###### Basic Request Information

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getMethod()` | `HTTP_METHOD` | Returns the HTTP method (GET, POST, PUT, DELETE, etc.) |
| `getPath()` | `string` | Returns the URL path (e.g., "/users/123") |
| `getOriginalUrl()` | `string` | Returns the full original URL as received |
| `getBaseUrl()` | `string` | Returns the base URL without the path component |
| `getProtocol()` | `string` | Returns the protocol ("http" or "https") |
| `getHostName()` | `string` | Returns the hostname from the Host header |
| `getHttpVersion()` | `string` | Returns the HTTP version (e.g., "1.1", "2.0") |

###### Request Parameters and Data

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getQuery<Q = Params>()` | `Q` | Returns query string parameters as an object |
| `getParams<P = Params>()` | `P` | Returns path parameters extracted from route (e.g., {id: "123"}) |
| `getBody<B = any>()` | `B` | Returns the parsed request body |
| `setBody<B>(body: B)` | `this` | Sets the request body (useful in middlewares) |
| `getCookies()` | `{ [key: string]: string }` | Returns request cookies as key-value pairs |
| `getSignedCookies()` | `Params` | Returns cryptographically signed cookies |

###### Headers and Content Negotiation

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getHeader(name: string)` | `string \| undefined` | Gets a specific header value |
| `accepts(accept: string \| string[])` | `false \| string` | Checks if specific content types are accepted |
| `accepts()` | `string[]` | Returns all accepted content types |
| `acceptsCharsets(accept?: string \| string[])` | `false \| string \| string[]` | Checks/gets accepted character sets |
| `acceptsEncodings(accept?: string \| string[])` | `false \| string \| string[]` | Checks/gets accepted encodings |
| `acceptsLanguages(accept?: string \| string[])` | `false \| string \| string[]` | Checks/gets accepted languages |
| `is(type: string \| string[])` | `string \| false \| null` | Checks if request matches content type |

###### Network and Client Information

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getIP()` | `string \| undefined` | Returns the client IP address |
| `getIPs()` | `string[]` | Returns array of IP addresses (including proxies) |
| `getSubdomains()` | `string[]` | Returns array of subdomains |
| `getSocket()` | `Duplex` | Returns the underlying TCP socket |
| `getConnection()` | `Duplex \| null` | Returns the connection object |

###### Request State and Validation

| Method | Return Type | Description |
|--------|-------------|-------------|
| `isFresh()` | `boolean` | Checks if request is fresh (for cache validation) |
| `isStale()` | `boolean` | Checks if request is stale (opposite of fresh) |
| `isSecure()` | `boolean` | Checks if request is over HTTPS |
| `isXHR()` | `boolean` | Checks if request is an XMLHttpRequest (AJAX) |
| `isAborted()` | `boolean` | Checks if request was aborted by client |
| `isComplete()` | `boolean` | Checks if request has been fully received |

###### Stream and Low-Level Access

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getReadableStream()` | `Readable` | Returns request as a readable stream |
| `getTrailers()` | `NodeJS.Dict<string>` | Returns HTTP trailers |
| `destroy(error?: Error)` | `this` | Destroys the request stream |

###### Event Handling

| Method | Return Type | Description |
|--------|-------------|-------------|
| `onClose(callback: () => any)` | `this` | Registers callback for request close event |
| `onAborted(callback: () => any)` | `this` | Registers callback for request abort event |

###### Custom Data Storage

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getExtraPayload<T = any>(name: string)` | `T` | Retrieves custom data stored with the request |
| `setExtraPayload<T>(name: string, value: T)` | `this` | Stores custom data with the request |

###### Native Access

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getNativeRequest<N = any>()` | `N` | Returns the underlying native request object |

##### AbstractResponse Interface

The `AbstractResponse` class provides methods to build and send HTTP responses. Here's the complete API:

###### Status and Headers

| Method | Return Type | Description |
|--------|-------------|-------------|
| `setStatus(status: number)` | `this` | Sets the HTTP status code |
| `getStatus()` | `number` | Gets the current status code |
| `setHeader(name: string, value: string)` | `this` | Sets a response header |
| `getHeader(name: string)` | `string \| number \| string[] \| undefined` | Gets a header value |
| `removeHeader(name: string)` | `this` | Removes a response header |
| `append(field: string, value: string \| string[])` | `this` | Appends value to existing header |
| `headersAreSent()` | `boolean` | Checks if headers have been sent to client |

###### Response Body

| Method | Return Type | Description |
|--------|-------------|-------------|
| `setBody<B>(body: B)` | `this` | Sets the response body (object, string, or buffer) |
| `getBody<B = any>()` | `B \| undefined` | Gets the current response body |
| `send(body: string \| Buffer \| object)` | `this` | Sends the response body and ends the response |

###### Cookies

| Method | Return Type | Description |
|--------|-------------|-------------|
| `setCookie(name: string, value: ParamsValue, options: CookieOptions)` | `this` | Sets a cookie with options |
| `clearCookie(name: string, options: CookieOptions)` | `this` | Clears a cookie |

**CookieOptions Interface:**
```typescript
interface CookieOptions {
  domain?: string;          // Cookie domain
  encode?: (value: string) => string;  // Custom encoding function
  expires?: Date;           // Expiration date
  httpOnly?: boolean;       // HTTP-only flag (prevents client-side access)
  maxAge?: number;          // Maximum age in milliseconds
  path?: string;            // Cookie path
  secure?: boolean;         // Secure flag (HTTPS only)
  signed?: boolean;         // Signed cookie flag
  sameSite?: boolean | string;  // SameSite policy ("strict", "lax", "none")
}
```

###### Response Control

| Method | Return Type | Description |
|--------|-------------|-------------|
| `end()` | `void` | Ends the response (sends to client) |
| `redirect(url: string, code?: number)` | `this` | Sends a redirect response |
| `addAttachment(filename?: string)` | `this` | Sets Content-Disposition header for file download |

###### Response State

| Method | Return Type | Description |
|--------|-------------|-------------|
| `isFinished()` | `boolean` | Checks if response has been finished |
| `isClosed()` | `boolean` | Checks if response connection is closed |

###### Stream and Low-Level Access

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getWritableStream()` | `Writable` | Returns response as a writable stream |
| `getConnection()` | `Duplex \| null` | Gets the underlying connection |
| `addTrailers(headers: { [name: string]: string })` | `this` | Adds HTTP trailers |
| `writeHeaders(code: number, headers: { [name: string]: string })` | `this` | Writes headers with status code |
| `flushHeaders()` | `this` | Flushes headers to client immediately |

###### Event Handling

| Method | Return Type | Description |
|--------|-------------|-------------|
| `onClose(callback: () => any)` | `this` | Registers callback for response close event |
| `onFinish(callback: () => any)` | `this` | Registers callback for response finish event |

###### Native Access

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getNativeResponse<N = any>()` | `N` | Returns the underlying native response object |

##### Usage Examples

###### Working with Request Data

```typescript
// In a controller or middleware
async handleRequest(request: AbstractRequest, response: AbstractResponse) {
  // Get request information
  const method = request.getMethod();
  const path = request.getPath();
  const { id } = request.getParams();
  const { page, limit } = request.getQuery();
  
  // Check content type
  if (request.is('application/json')) {
    const body = request.getBody();
    // Process JSON body
  }
  
  // Store custom data for later use
  request.setExtraPayload('startTime', Date.now());
  
  // Check if client accepts JSON
  if (request.accepts('application/json')) {
    response.setHeader('Content-Type', 'application/json');
  }
}
```

###### Building Responses

```typescript
// Set status and headers
response
  .setStatus(201)
  .setHeader('Content-Type', 'application/json')
  .setHeader('X-Custom-Header', 'value');

// Set cookies
response.setCookie('sessionId', 'abc123', {
  httpOnly: true,
  secure: true,
  maxAge: 3600000, // 1 hour
  sameSite: 'strict'
});

// Send JSON response
response.setBody({ 
  message: 'Success',
  data: results 
});

// Or send and end in one call
response.send({ error: 'Not found' });

// Redirect
response.redirect('/login', 302);
```
