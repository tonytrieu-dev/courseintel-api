import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy settings for Railway/Heroku deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting (basic protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy headers
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// OpenAPI/Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CourseIntel API',
      version: '1.0.0',
      description: 'UCR Course Difficulty Intelligence API - Student-verified course ratings and professor insights',
      contact: {
        name: 'Tony Trieu',
        email: 'support@courseintel.api'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? `https://${process.env.RAILWAY_STATIC_URL || 'your-railway-domain.railway.app'}` 
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server (Railway)' : 'Development server'
      }
    ],
    tags: [
      {
        name: 'Courses',
        description: 'Course difficulty and information endpoints'
      },
      {
        name: 'Professors',
        description: 'Professor insights and ratings endpoints'
      },
      {
        name: 'Departments',
        description: 'Department statistics and analytics endpoints'
      },
      {
        name: 'Analytics',
        description: 'Course analytics and recommendations'
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI setup
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CourseIntel API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Import routes
import courseRoutes from './routes/courses';
import professorRoutes from './routes/professors';

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'CourseIntel API',
    version: '1.0.0',
    description: 'UCR Course Difficulty Intelligence API - Student-verified course ratings and professor insights',
    documentation: '/docs',
    health: '/health',
    api_base: '/api/v1',
    endpoints: {
      courses: '/api/v1/courses',
      professors: '/api/v1/professors'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'CourseIntel API'
  });
});

// API routes
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/professors', professorRoutes);

// API base route
app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'Welcome to CourseIntel API',
    version: '1.0.0',
    description: 'UCR Course Difficulty Intelligence API',
    documentation: '/docs',
    endpoints: {
      courses: '/api/v1/courses',
      professors: '/api/v1/professors',
      departments: '/api/v1/departments',
      analytics: '/api/v1/analytics'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    documentation: '/docs'
  });
});

// Error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server with performance optimizations
app.listen(PORT, async () => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${process.env.RAILWAY_STATIC_URL || 'your-railway-domain.railway.app'}`
    : `http://localhost:${PORT}`;
  
  console.log(`🚀 CourseIntel API server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📚 API Documentation: ${baseUrl}/docs`);
  console.log(`❤️  Health Check: ${baseUrl}/health`);
  console.log(`🎯 API Base: ${baseUrl}/api/v1`);
  
  // Pre-load data on startup for optimal performance
  try {
    console.log('🔥 Pre-loading data for instant responses...');
    const { dataService } = await import('./services/DataService');
    await dataService.loadData();
    console.log('⚡ Data pre-loaded! All endpoints will respond instantly.');
  } catch (error) {
    console.error('⚠️ Data pre-loading failed, will load on first request:', error);
  }
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🎯 Ready for RapidAPI submission with optimized performance!`);
    console.log(`🏆 Expected response times: <500ms (vs. previous 5000ms)`);
  }
});

export default app;