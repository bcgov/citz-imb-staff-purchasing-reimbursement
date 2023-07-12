import 'dotenv/config.js';
import express, { NextFunction, RequestHandler, Response } from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import Constants from './constants/Constants';
import { keycloakInit, middleware as protect } from './keycloak/index';
import openRouter from './routes/open/index';
import protectedRouter from './routes/protected/index';

const app: express.Application = express();

const { TESTING, BACKEND_URL, FRONTEND_URL } = Constants;

// Swagger Configuration
const swaggerURL = `${BACKEND_URL}/api`;
const OPENAPI_OPTIONS = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Staff Purchase Reimbursement (SPR) API',
      version: '1.0.0',
      description: 'Documentation for the SPR API.',
    },
    servers: [{ url: swaggerURL }],
  },
  apis: ['./docs/*.yaml'],
};

// Express Rate Limiter Configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// CORS Configuration
// Localhost does not need to be specified.
const corsOptions = {
  origin: [
    'https://submit.digital.gov.bc.ca', // CHEFS
    'http://localhost:8080', // Local frontend testing
    FRONTEND_URL, // Frontend
  ],
  credentials: true,
};

// Maximum size of body data. Primarily used to limit incoming files.
const maxBodySize = '10mb';

// Incoming CORS Filter
app.use(cors(corsOptions));

// Express middleware
app.use(express.json({ limit: maxBodySize }));
app.use(express.urlencoded({ extended: false, limit: maxBodySize }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev')); // logging middleware
keycloakInit(app);

// Set headers for response
const headerHandler: unknown = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  next();
};
app.use('/api', headerHandler as RequestHandler);

// Use rate limiter if not testing
if (!TESTING) app.use(limiter);

// Swagger service route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(OPENAPI_OPTIONS)));
// Swagger redirect service routes
app.use('/api', openRouter.swaggerRouter);

// Routing Open Routes
app.use('/api', openRouter.chefsRouter);
app.use('/api', openRouter.healthRouter);

// Routing Protected Routes
// Pass the request through with no protection (for testing)
const falseProtect: unknown = (req: Request, res: Response, next: NextFunction) => {
  console.warn('Keycloak is off');
  next();
};
// Allow for removed protection when API testing is enabled, otherwise use Keycloak
const routeProtector: RequestHandler | Promise<Response<any, Record<string, any>>> = TESTING
  ? (falseProtect as RequestHandler)
  : protect;
app.use('/api', routeProtector, protectedRouter.requests);
app.use('/api', routeProtector, protectedRouter.jira);

export default app;
