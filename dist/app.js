"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
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
    apis: ['./src/routes/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CourseIntel API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
    }
}));
const courses_1 = __importDefault(require("./routes/courses"));
const professors_1 = __importDefault(require("./routes/professors"));
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
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'CourseIntel API'
    });
});
app.use('/api/v1/courses', courses_1.default);
app.use('/api/v1/professors', professors_1.default);
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
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        documentation: '/docs'
    });
});
app.use((error, _req, res, _next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});
app.listen(PORT, () => {
    const baseUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.RAILWAY_STATIC_URL || 'your-railway-domain.railway.app'}`
        : `http://localhost:${PORT}`;
    console.log(`🚀 CourseIntel API server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API Documentation: ${baseUrl}/docs`);
    console.log(`❤️  Health Check: ${baseUrl}/health`);
    console.log(`🎯 API Base: ${baseUrl}/api/v1`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🎯 Ready for RapidAPI submission!`);
    }
});
exports.default = app;
//# sourceMappingURL=app.js.map