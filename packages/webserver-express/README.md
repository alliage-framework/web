# Alliage Webserver Express

Express.js adapter for the Alliage Webserver module, providing full Express.js integration with the Alliage framework.

## Dependencies

- [@alliage/webserver](../webserver/) - Core webserver functionality
- [express](https://expressjs.com/) - Express.js framework (peer dependency)

## Installation

First, install the Express adapter:

```bash
yarn add @alliage/webserver-express express
```

Or with npm:

```bash
npm install @alliage/webserver-express express
```

## Registration

If you've already installed [@alliage/module-installer](https://github.com/alliage-framework/core/beta/main/packages/module-installer), simply run:

```bash
npx alliage-scripts install @alliage/webserver-express
```

Otherwise, update your `alliage-modules.json` file:

```json
{
  "@alliage/webserver": {
    "module": "@alliage/webserver",
    "deps": [
      "@alliage/config-loader",
      "@alliage/module-installer", 
      "@alliage/process-manager"
    ],
    "envs": []
  },
  "@alliage/webserver-express": {
    "module": "@alliage/webserver-express",
    "deps": ["@alliage/webserver"],
    "envs": []
  }
}
```

## Configuration

Upon installation, a `config/webserver-express.yaml` file will be created with default Express settings:

```yaml
# Express settings. See http://expressjs.com/en/api.html#app.settings.table
settings:
  x-powered-by: false
```

### Express Settings

The `settings` object accepts any valid Express.js application settings. Common settings include:

```yaml
settings:
  # Security
  x-powered-by: false           # Hide Express signature
  
  # Performance  
  etag: strong                  # ETag generation ("weak", "strong", false)
  
  # Views
  view engine: ejs             # Template engine
  view cache: true             # Cache compiled views in production
  views: ./views               # Views directory
  
  # Environment
  env: production              # Environment mode
  
  # Trust proxy settings
  trust proxy: true            # Trust proxy headers
  
  # JSON parsing
  json escape: true            # Escape JSON responses
  json replacer: null          # JSON.stringify replacer
  json spaces: 0               # JSON formatting spaces
  
  # URL encoding
  query parser: extended       # Query string parser ("simple", "extended", false)
  
  # Case sensitivity
  case sensitive routing: false # Case-sensitive routing
  strict routing: false        # Strict routing (trailing slashes)
  
  # Subdomain offset
  subdomain offset: 2          # Number of dot-separated parts to remove for subdomain
```

See the [Express documentation](http://expressjs.com/en/api.html#app.settings.table) for a complete list of available settings.

## Basic Usage

Once registered, the Express adapter will automatically handle HTTP requests for your Alliage controllers:

```typescript
import {
  AbstractController,
  AbstractRequest,
  AbstractResponse,
  Get,
  Post
} from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

@Service('api-controller')
export default class ApiController extends AbstractController {
  @Get('/api/health')
  async healthCheck(request: AbstractRequest, response: AbstractResponse) {
    response.setBody({ status: 'ok', timestamp: Date.now() });
  }

  @Post('/api/users')
  async createUser(request: AbstractRequest, response: AbstractResponse) {
    const userData = request.getBody();
    // Process with full Express request/response features
    response.setStatus(201).setBody({ user: userData });
  }
}
```

## Using Express Native Middlewares

The Express adapter provides a utility function to integrate Express middlewares with Alliage Webserver's middleware system.

### `createNativeMiddleware` Function

The `createNativeMiddleware` function is the core utility for wrapping Express middlewares to work within the Alliage framework. It creates an Alliage Webserver-compatible middleware from an Express middleware.

#### Function Signature

```typescript
function createNativeMiddleware<T extends any[]>(
  middleware: (...args: T) => ExpressMiddleware | ExpressMiddleware,
  options?: NativeMiddlewareOptions<T>
): AbstractMiddleware
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `middleware` | `(...args: T) => ExpressMiddleware \| ExpressMiddleware` | ✅ | The Express middleware function or constructor. Can be a direct middleware function (like `helmet()`) or a middleware constructor (like `rateLimit`) |
| `options` | `NativeMiddlewareOptions<T>` | ❌ | Configuration options for the middleware wrapper |

#### Options Interface

```typescript
interface NativeMiddlewareOptions<T extends any[]> {
  requestPhase?: REQUEST_PHASE;
  applyBefore?: AbstractMiddleware[];
  applyAfter?: AbstractMiddleware[];
  args?: (...injectedDeps: any[]) => T;
}
```

#### Options Properties

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `requestPhase` | `REQUEST_PHASE` | `REQUEST_PHASE.PRE_CONTROLLER` | Defines when in the request lifecycle the middleware should execute |
| `applyBefore` | `AbstractMiddleware[]` | `[]` | Array of middleware instances that this middleware should run before |
| `applyAfter` | `AbstractMiddleware[]` | `[]` | Array of middleware instances that this middleware should run after |
| `args` | `(...injectedDeps: any[]) => T` | `undefined` | Function that receives injected dependencies and returns arguments to pass to the middleware constructor |

#### Request Phases

The `REQUEST_PHASE` enum defines when the middleware executes:

| Phase | Description |
|-------|-------------|
| `PRE_REQUEST` | Before any request processing begins |
| `PRE_CONTROLLER` | After request processing but before controller execution |
| `POST_CONTROLLER` | After controller execution but before response finalization |
| `POST_REQUEST` | After response finalization |

#### Return Value

Returns an `AbstractMiddleware` instance that can be registered with the Alliage service loader and will be automatically integrated into the request processing pipeline.

#### Usage Patterns

**Direct Middleware Function:**
```typescript
// For middleware that's already configured
createNativeMiddleware(helmet())
```

**Middleware Constructor with Arguments:**
```typescript
// For middleware that needs configuration
createNativeMiddleware(rateLimit, {
  args: () => [{ windowMs: 15 * 60 * 1000, max: 100 }]
})
```

**Middleware with Dependency Injection:**
```typescript
// For middleware that needs injected dependencies
createNativeMiddleware(cors, {
  args: (config: CorsConfig) => [config]
})
```

**Middleware with Ordering:**
```typescript
// For middleware that needs specific execution order
createNativeMiddleware(compression(), {
  applyAfter: [HelmetMiddleware]
})
```

### Creating Native Middleware Wrappers

Use the `createNativeMiddleware` function to wrap Express middlewares:

```typescript
// src/middlewares/CompressionMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { REQUEST_PHASE } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';
import compression from 'compression';
import HelmetMiddleware from './HelmetMiddleware';

// Simple middleware wrapper
export default Service('compression-middleware')(
  createNativeMiddleware(compression())
);
```

```typescript
// src/middlewares/CorsMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { REQUEST_PHASE } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';
import cors from 'cors';

// Middleware with configuration
export default Service('cors-middleware')(
  createNativeMiddleware(cors(), {
    requestPhase: REQUEST_PHASE.PRE_CONTROLLER
  })
);
```

```typescript
// src/middlewares/RateLimitMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { REQUEST_PHASE } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';
import rateLimit from 'express-rate-limit';

// Middleware with constructor arguments
export default Service('rate-limit-middleware')(
  createNativeMiddleware(rateLimit, {
    requestPhase: REQUEST_PHASE.PRE_CONTROLLER,
    args: () => [{
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    }]
  })
);
```

### Dependency Injection with Middlewares

You can inject dependencies into middleware configuration using constructor parameters:

```typescript
// src/middlewares/ConfigurableRateLimitMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { REQUEST_PHASE } from '@alliage/webserver';
import { Service, parameter } from '@alliage/service-loader';
import rateLimit from 'express-rate-limit';

// Middleware that receives configuration via dependency injection
export default Service('rate-limit-middleware', [
  parameter('rate-limit-config') // Inject configuration
])(
  createNativeMiddleware(rateLimit, {
    requestPhase: REQUEST_PHASE.PRE_CONTROLLER,
    args: (config: { windowMs: number; max: number; message: string }) => [{
      windowMs: config.windowMs,
      max: config.max,
      message: config.message
    }]
  })
);
```

```typescript
// src/middlewares/SessionMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { REQUEST_PHASE } from '@alliage/webserver';
import { Service, parameter } from '@alliage/service-loader';
import session from 'express-session';
import HelmetMiddleware from './HelmetMiddleware';

export default Service('session-middleware', [
  parameter('session-secret')
])(
  createNativeMiddleware(session, {
    requestPhase: REQUEST_PHASE.PRE_CONTROLLER,
    applyAfter: [HelmetMiddleware],
    args: (secretKey: string) => [{
      secret: secretKey,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 3600000 }
    }]
  })
);
```

### Advanced Native Middleware Integration

For complex scenarios, you can specify ordering and error handling:

```typescript
// src/middlewares/HelmetMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { REQUEST_PHASE } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';
import helmet from 'helmet';

export default Service('helmet-middleware')(
  createNativeMiddleware(helmet(), {
    requestPhase: REQUEST_PHASE.PRE_CONTROLLER,
  })
);
```

## Express-Specific Features

### Accessing Express Request/Response

Within controllers and middlewares, you can access the native Express request and response objects:

```typescript
import { AbstractController, AbstractRequest, AbstractResponse, Get } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Service('express-controller')
export default class ExpressController extends AbstractController {
  @Get('/express-features')
  async useExpressFeatures(request: AbstractRequest, response: AbstractResponse) {
    // Access native Express objects
    const expressReq = request.getNativeRequest<ExpressRequest>();
    const expressRes = response.getNativeResponse<ExpressResponse>();
    
    // Use Express-specific features
    const userAgent = expressReq.get('User-Agent');
    const acceptsHtml = expressReq.accepts('html');
    
    // Express response methods
    expressRes.cookie('lastVisit', Date.now());
    
    response.setBody({
      userAgent,
      acceptsHtml,
      path: expressReq.path,
      query: expressReq.query
    });
  }
}
```

### Template Rendering

If you've configured a view engine, you can render templates:

```typescript
import { AbstractController, AbstractRequest, AbstractResponse, Get } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';

@Service('template-controller')
export default class TemplateController extends AbstractController {
  @Get('/dashboard')
  async dashboard(request: AbstractRequest, response: AbstractResponse) {
    const expressRes = response.getNativeResponse();
    
    // Render template with Express
    expressRes.render('dashboard', {
      title: 'Dashboard',
      user: request.getExtraPayload('user')
    });
  }
}
```

### File Downloads

```typescript
import { AbstractController, AbstractRequest, AbstractResponse, Get } from '@alliage/webserver';
import { Service } from '@alliage/service-loader';
import path from 'path';

@Service('download-controller')
export default class DownloadController extends AbstractController {
  @Get('/download/:filename')
  async downloadFile(request: AbstractRequest, response: AbstractResponse) {
    const { filename } = request.getParams();
    const expressRes = response.getNativeResponse();
    
    const filePath = path.join(process.cwd(), 'files', filename);
    
    // Express file download
    expressRes.download(filePath, (err) => {
      if (err) {
        response.setStatus(404).setBody({ error: 'File not found' });
      }
    });
  }
}
```

## Performance Considerations

### Production Settings

For production environments, configure Express with optimized settings:

```yaml
# config/webserver-express.yaml
settings:
  # Disable X-Powered-By header
  x-powered-by: false
  
  # Enable view caching
  view cache: true
  
  # Optimize JSON
  json escape: true
  json spaces: 0
  
  # Trust reverse proxy
  trust proxy: true
  
  # Set environment
  env: production
```

### Middleware Ordering

Order middlewares for optimal performance:

1. **Security middlewares** (helmet, cors) - First
2. **Compression** - Early, before large responses
3. **Logging** - Early, to capture all requests
4. **Rate limiting** - Before expensive operations
5. **Authentication** - Before protected routes
6. **Body parsing** - Before controllers that need body data
7. **Static files** - Last, as fallback

```typescript
// Example ordering with applyBefore/applyAfter
// src/middlewares/HelmetMiddleware.ts
export default Service('helmet-middleware')(
  createNativeMiddleware(helmet())
);

// src/middlewares/CompressionMiddleware.ts
import HelmetMiddleware from './HelmetMiddleware';

export default Service('compression-middleware')(
  createNativeMiddleware(compression(), {
    applyAfter: [HelmetMiddleware]
  })
);

// src/middlewares/LoggingMiddleware.ts  
import CompressionMiddleware from './CompressionMiddleware';

export default Service('logging-middleware')(
  createNativeMiddleware(morgan('combined'), {
    applyAfter: [CompressionMiddleware]
  })
);
```

## Running the Server

Start your application with the Express adapter:

```bash
# Development
npx alliage-scripts start web

# Production with PM2
pm2 start "npx alliage-scripts start web" --name "my-app"

# With custom port
npx alliage-scripts start web --port 3000
```

## Complete Example

Here's a complete example showing Express adapter usage with various third-party middlewares and dependency injection:

```typescript
// src/controllers/ApiController.ts
import {
  AbstractController,
  AbstractRequest,
  AbstractResponse,
  Get,
  Post
} from '@alliage/webserver';
import { Service, instanceOf } from '@alliage/service-loader';
import { UserService } from '../services/UserService';

@Service('api-controller', [instanceOf(UserService)])
export default class ApiController extends AbstractController {
  constructor(private userService: UserService) {
    super();
  }

  @Get('/api/users')
  async getUsers(request: AbstractRequest, response: AbstractResponse) {
    const users = await this.userService.findAll();
    response.setBody({ users });
  }

  @Post('/api/users')
  async createUser(request: AbstractRequest, response: AbstractResponse) {
    const userData = request.getBody();
    const user = await this.userService.create(userData);
    response.setStatus(201).setBody({ user });
  }
}

// src/middlewares/SecurityMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service } from '@alliage/service-loader';
import helmet from 'helmet';

export default Service('helmet-middleware')(
  createNativeMiddleware(helmet())
);

// src/middlewares/CorsMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service, parameter } from '@alliage/service-loader';
import cors from 'cors';
import SecurityMiddleware from './SecurityMiddleware';

export default Service('cors-middleware', [
  parameter('cors-config')
])(
  createNativeMiddleware(cors, {
    applyAfter: [SecurityMiddleware],
    args: (config: { origin: string[]; credentials: boolean }) => [config]
  })
);

// src/middlewares/CompressionMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service } from '@alliage/service-loader';
import compression from 'compression';
import CorsMiddleware from './CorsMiddleware';

export default Service('compression-middleware')(
  createNativeMiddleware(compression(), {
    applyAfter: [CorsMiddleware]
  })
);

// src/middlewares/JsonParserMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service } from '@alliage/service-loader';
import bodyParser from 'body-parser';

export default Service('json-parser-middleware')(
  createNativeMiddleware(bodyParser.json, {
    args: () => [{ strict: true, limit: '10mb' }]
  })
);

// src/middlewares/UrlEncodedMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service } from '@alliage/service-loader';
import express from 'express';

export default Service('url-encoded-middleware')(
  createNativeMiddleware(express.urlencoded, {
    args: () => [{ extended: true, limit: '10mb' }]
  })
);

// src/middlewares/ConfigurableJsonParserMiddleware.ts
import { createNativeMiddleware } from '@alliage/webserver-express';
import { Service, parameter } from '@alliage/service-loader';
import bodyParser from 'body-parser';

// With dependency injection for configuration
export default Service('json-parser-middleware', [
  parameter('body-parser-config')
])(
  createNativeMiddleware(bodyParser.json, {
    args: (config: { strict: boolean; limit: string }) => [config]
  })
);
```

### Configuration Files

You'll also need to configure the dependency injection parameters:

```yaml
# config/cors.yaml
origin:
  - "http://localhost:3000"
  - "https://yourdomain.com"
credentials: true

# config/body-parser.yaml
strict: true
limit: "10mb"
```

And register them in your module:

```typescript
// src/YourModule.ts
import { AbstractModule } from '@alliage/framework';
import { CONFIG_EVENTS, loadConfig, validators } from '@alliage/config-loader';

export default class YourModule extends AbstractModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: [
        loadConfig('cors-config', validators.jsonSchema({
          type: 'object',
          properties: {
            origin: { type: 'array', items: { type: 'string' } },
            credentials: { type: 'boolean' }
          },
          required: ['origin', 'credentials']
        })),
        loadConfig('body-parser-config', validators.jsonSchema({
          type: 'object',
          properties: {
            strict: { type: 'boolean' },
            limit: { type: 'string' }
          },
          required: ['strict', 'limit']
        }))
      ]
    };
  }
}
```

This Express adapter provides full compatibility with the Express.js ecosystem while maintaining the benefits of Alliage Webserver's module system and dependency injection.