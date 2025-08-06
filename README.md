# CourseIntel API

UCR Course Difficulty Intelligence API - Student-verified course ratings and professor insights

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📚 API Documentation

Visit `/docs` for interactive Swagger documentation.

## 🌐 Railway Deployment

This app is ready for Railway deployment:

1. **Connect GitHub repo** to Railway
2. **Set environment variables**:
   - `NODE_ENV=production`
   - `ENABLE_ENHANCED_PROFESSORS=true` (optional)
   - `PROFESSOR_API_URL=http://localhost:5000` (optional)
3. **Deploy** - Railway will automatically run `npm install` and `npm run build`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port (Railway sets automatically) |
| `NODE_ENV` | development | Environment mode |
| `ENABLE_ENHANCED_PROFESSORS` | true | Enable enhanced professor data integration |
| `PROFESSOR_API_URL` | http://localhost:5000 | Enhanced professor API endpoint |

## 🎯 RapidAPI Ready

- ✅ HTTPS endpoints (Railway provides)
- ✅ OpenAPI 3.0 specification at `/docs`
- ✅ Consistent JSON responses
- ✅ Proper error handling
- ✅ Sub-500ms response times

## 📊 Endpoints

### Core Endpoints
- `GET /api/v1/courses/search` - Search courses
- `GET /api/v1/courses/{code}` - Course details
- `GET /api/v1/courses/easy` - Easy courses
- `GET /api/v1/courses` - All courses

### Enhanced Endpoints
- `GET /api/v1/courses/{code}/enhanced` - Enhanced course details with professor data
- `GET /api/v1/professors/search` - Search professors

### Utility
- `GET /health` - Health check
- `GET /docs` - API documentation

## 📈 Data Sources

- **UCR Course Reviews**: 1000+ authentic student reviews
- **RateMyProfessor**: Enhanced professor ratings and reviews
- **Reddit Sentiment**: Real-time professor sentiment analysis

## 🏗️ Architecture

- **Framework**: Express.js + TypeScript
- **Data Processing**: CSV parsing with intelligent professor extraction
- **Caching**: In-memory caching with Node-cache
- **Documentation**: OpenAPI 3.0 with Swagger UI
- **Security**: Helmet, CORS, rate limiting

## 📝 License

MIT - See LICENSE file for details

---

**Ready for RapidAPI marketplace submission!** 🎉