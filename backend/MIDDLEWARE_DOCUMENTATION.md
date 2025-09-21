# Middleware Documentation for TraceYa Backend

## Overview

This document provides information about the middleware used in the TraceYa backend application. Middleware functions are essential components in Express.js applications that have access to the request object, response object, and the next middleware function in the application's request-response cycle.

## Core Middleware

### Helmet

Helmet is a security middleware that helps protect Express apps by setting various HTTP headers. <mcreference link="https://github.com/helmetjs/helmet" index="1">1</mcreference>

```javascript
import helmet from 'helmet';

app.use(helmet());
```

#### Features

Helmet sets the following headers by default: <mcreference link="https://github.com/helmetjs/helmet" index="1">1</mcreference> <mcreference link="https://expressjs.com/en/advanced/best-practice-security.html" index="2">2</mcreference>

- **Content-Security-Policy**: A powerful allow-list of what can happen on your page which mitigates many attacks
- **Cross-Origin-Opener-Policy**: Helps process-isolate your page
- **Cross-Origin-Resource-Policy**: Blocks others from loading your resources cross-origin
- **Origin-Agent-Cluster**: Changes process isolation to be origin-based
- **Referrer-Policy**: Controls the Referer header
- **Strict-Transport-Security**: Tells browsers to prefer HTTPS
- **X-Content-Type-Options**: Avoids MIME sniffing
- **X-DNS-Prefetch-Control**: Controls DNS prefetching
- **X-Download-Options**: Forces downloads to be saved (Internet Explorer only)
- **X-Frame-Options**: Legacy header that mitigates clickjacking attacks
- **X-Permitted-Cross-Domain-Policies**: Controls cross-domain behavior for Adobe products
- **X-Powered-By**: Removes information about the web server
- **X-XSS-Protection**: Legacy header that tries to mitigate XSS attacks (disabled by Helmet as it can make things worse)

#### Configuration

Helmet can be configured to customize security headers: <mcreference link="https://github.com/helmetjs/helmet" index="1">1</mcreference>

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "example.com"],
      },
    },
  }),
);
```

Headers can also be disabled if needed:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
  }),
);
```

### CORS (Cross-Origin Resource Sharing)

CORS is a middleware that enables cross-origin requests by setting appropriate HTTP headers. <mcreference link="https://expressjs.com/en/resources/middleware/cors.html" index="1">1</mcreference>

```javascript
import cors from 'cors';

app.use(cors());
```

#### Features

- Allows AJAX requests to skip the Same-origin policy and access resources from remote hosts <mcreference link="https://medium.com/zero-equals-false/using-cors-in-express-cac7e29b005b" index="5">5</mcreference>
- Controls which origins can access server resources
- Handles preflight requests for complex CORS scenarios

#### Configuration

CORS can be configured to restrict allowed origins: <mcreference link="https://expressjs.com/en/resources/middleware/cors.html" index="1">1</mcreference>

```javascript
const corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200 // for legacy browser support
};

app.use(cors(corsOptions));
```

You can also use a function to dynamically determine allowed origins:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['http://example1.com', 'http://example2.com'];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
```

### Morgan (HTTP Request Logger)

Morgan is a middleware for logging HTTP requests in Node.js applications. <mcreference link="https://betterstack.com/community/guides/logging/morgan-logging-nodejs/" index="2">2</mcreference>

```javascript
import morgan from 'morgan';

app.use(morgan('dev'));
```

#### Features

- Logs HTTP requests with various levels of detail
- Provides predefined logging formats (tiny, dev, combined, etc.)
- Can be customized to log specific information

#### Predefined Formats

Morgan comes with several predefined formats: <mcreference link="https://signoz.io/blog/morgan-logger/" index="5">5</mcreference>

- **tiny**: Minimal output when logging HTTP requests
- **dev**: Colored output for development
- **combined**: Standard Apache combined log output
- **common**: Standard Apache common log output
- **short**: Shorter than default, includes response time

## Usage in TraceYa Backend

In our application, these middleware are configured in the `index.ts` file:

```typescript
// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Logging middleware
app.use(morgan('dev'));
```

## Best Practices

1. **Security**: Always use Helmet to enhance your application's security posture <mcreference link="https://expressjs.com/en/advanced/best-practice-security.html" index="2">2</mcreference>
2. **CORS**: Configure CORS to only allow necessary origins <mcreference link="https://expressjs.com/en/resources/middleware/cors.html" index="1">1</mcreference>
3. **Logging**: Use Morgan to log requests for debugging and monitoring <mcreference link="https://betterstack.com/community/guides/logging/morgan-logging-nodejs/" index="2">2</mcreference>

## Additional Resources

- [Helmet Documentation](https://helmetjs.github.io/)
- [CORS Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [Morgan Documentation](https://expressjs.com/en/resources/middleware/morgan.html)