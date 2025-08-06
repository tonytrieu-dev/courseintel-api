# PLANNING.md - CourseIntel API Project Plan

## Vision Statement
Create the definitive UCR course difficulty intelligence API that empowers students to make smarter course selection decisions, monetized through RapidAPI to generate $5K+ MRR within 12 months using only free-tier services.

## Market Opportunity
- **Target Market**: 26,000 UCR students + app developers + academic researchers
- **Revenue Opportunity**: $500 MRR by month 3, $5K MRR by month 12
- **Key Insight**: No existing API provides UCR-specific course difficulty data combined with professor insights
- **Competitive Advantage**: Authentic student-generated data vs. scraped information

## Product Architecture

### Core System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  RapidAPI Hub   │    │   Student Apps  │    │   Researchers   │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │    CourseIntel API       │
                    │  ┌─────────────────────┐ │
                    │  │  Rate Limiting      │ │
                    │  │  (RapidAPI)         │ │
                    │  └─────────────────────┘ │
                    │  ┌─────────────────────┐ │
                    │  │  Express Router     │ │
                    │  │  + OpenAPI Docs     │ │
                    │  └─────────────────────┘ │
                    │  ┌─────────────────────┐ │
                    │  │  Business Logic     │ │
                    │  │  Controllers        │ │
                    │  └─────────────────────┘ │
                    │  ┌─────────────────────┐ │
                    │  │  Data Service       │ │
                    │  │  (CSV Processing)   │ │
                    │  └─────────────────────┘ │
                    │  ┌─────────────────────┐ │
                    │  │  MongoDB Atlas      │ │
                    │  │  (Cached Data)      │ │
                    │  └─────────────────────┘ │
                    └──────────────────────────┘
```

### API Service Breakdown
1. **Course Service**: Course search, details, and difficulty analysis
2. **Professor Service**: Professor lookup and teaching style insights
3. **Analytics Service**: Department statistics and trend analysis
4. **Recommendation Service**: AI-powered course recommendations
5. **Data Service**: CSV processing and data validation

## Technology Stack

### Backend Infrastructure (100% Free)
```yaml
Runtime: Node.js 18+
Framework: Express.js with TypeScript
Database: MongoDB Atlas Free (512MB)
Caching: Node-cache (in-memory)
Hosting: Railway Free Tier (500 hours/month)
Documentation: OpenAPI 3.0 + Swagger UI
```

### Data Processing Stack
```yaml
CSV Parser: csv-parse (built-in Node.js)
Data Validation: Custom validation functions
Search: In-memory fuzzy search algorithms
Caching: Node-cache with TTL strategies
File Storage: Git repository (version controlled data)
```

### Development Tools (All Free)
```yaml
Language: TypeScript
Testing: Jest + Supertest
Code Quality: ESLint + Prettier + Husky
Version Control: Git with GitHub
Process Management: Nodemon (development)
API Testing: Swagger UI built-in testing
```

## Data Architecture

### UCR Course Data Structure
```typescript
interface RawCourseData {
  Class: string;              // Course code (e.g., "AHS007")
  "Average Difficulty": string; // Calculated difficulty
  "Additional Comments": string; // Student reviews
  Difficulty: string;         // Individual rating (1-10)
  Date: string;              // Review submission date
}

interface ProcessedCourse {
  course_code: string;
  department: string;
  average_difficulty: number;
  total_reviews: number;
  reviews: CourseReview[];
  professors: ProfessorSummary[];
  latest_review_date: string;
}

interface CourseReview {
  difficulty: number;
  comment: string;
  professor_name?: string;
  review_date: string;
  semester?: string;
}

interface ProfessorSummary {
  name: string;
  average_difficulty: number;
  review_count: number;
  teaching_style: string[];
  student_tips: string[];
}
```

### Database Schema (MongoDB)
```javascript
// Courses Collection
{
  _id: ObjectId,
  course_code: "AHS007",
  department: "AHS", 
  title: "Introduction to Health Sciences",
  average_difficulty: 3.5,
  total_reviews: 15,
  difficulty_distribution: {
    very_easy: 2,
    easy: 8, 
    moderate: 4,
    hard: 1,
    very_hard: 0
  },
  last_updated: ISODate,
  created_at: ISODate
}

// Reviews Collection
{
  _id: ObjectId,
  course_code: "AHS007",
  difficulty: 2,
  comment: "Easy A if you just do the essays...",
  professor_name: "Charles Peterson",
  review_date: ISODate("2023-10-06"),
  semester: "Fall 2023",
  created_at: ISODate
}

// Professors Collection
{
  _id: ObjectId,
  name: "Charles Peterson",
  courses_taught: ["AHS007", "AHS008"],
  average_difficulty: 2.5,
  total_reviews: 8,
  teaching_characteristics: [
    "Engaging lectures",
    "Recorded classes", 
    "Open book exams"
  ],
  last_updated: ISODate
}
```

## Free Service Optimization Strategy

### MongoDB Atlas Free Tier (512MB)
- **Data Compression**: Store only essential fields
- **Efficient Indexing**: Index on course_code, department, difficulty
- **Data Lifecycle**: Archive old reviews after 3 years
- **Query Optimization**: Use aggregation pipelines for complex queries

### Railway Free Tier (500 hours/month)
- **Efficient Code**: Minimize CPU usage with caching
- **Sleep Mode**: API sleeps when not in use (automatic)
- **Resource Monitoring**: Track usage to stay within limits
- **Optimization**: Lazy loading and efficient algorithms

### Node-cache Strategy
```javascript
// Cache frequently accessed data
const cache = new NodeCache({ 
  stdTTL: 3600,        // 1 hour default
  checkperiod: 600,    // Check for expired keys every 10 minutes
  useClones: false     // Better performance, careful with mutations
});

// Caching strategy
- Course details: 1 hour TTL
- Department stats: 6 hours TTL  
- Search results: 30 minutes TTL
- Professor data: 2 hours TTL
```

## API Endpoint Design

### RESTful URL Structure
```yaml
# Course Endpoints
GET /api/v1/courses/search?q={query}&dept={dept}&difficulty_max={num}
GET /api/v1/courses/{course_code}
GET /api/v1/courses/easy?department={dept}&limit={num}
GET /api/v1/courses/{course_code}/reviews
GET /api/v1/courses/{course_code}/professors

# Professor Endpoints  
GET /api/v1/professors/{professor_name}
GET /api/v1/professors/search?name={name}&course={course}

# Department Endpoints
GET /api/v1/departments/{dept_code}/stats
GET /api/v1/departments/{dept_code}/courses
GET /api/v1/departments

# Analytics Endpoints
GET /api/v1/analytics/difficulty-trends
GET /api/v1/analytics/popular-courses
GET /api/v1/recommendations?max_difficulty={num}&department={dept}

# Utility Endpoints
GET /api/v1/health
GET /api/v1/stats
```

## RapidAPI Optimization

### Marketplace Best Practices
- **Clear API Name**: "UCR Course Difficulty Intelligence"
- **Compelling Description**: "Student-verified course difficulty ratings and professor insights"
- **Professional Logo**: Simple, academic-themed design
- **Complete Documentation**: Interactive Swagger UI with examples
- **Responsive Support**: Quick response to user questions

### Pricing Strategy
```yaml
Free Tier:
  requests: 100/month
  endpoints: Basic course lookup only
  support: Community forum

Student Tier ($4.99/month):
  requests: 2,500/month
  endpoints: All endpoints
  features: Professor insights, recommendations
  support: Email support

Developer Tier ($14.99/month):
  requests: 10,000/month
  endpoints: All endpoints + analytics
  features: Bulk data, webhooks
  support: Priority email support

Enterprise Tier ($49.99/month):
  requests: 50,000/month
  endpoints: All endpoints + custom
  features: White-label, SLA
  support: Direct support channel
```

## Performance & Scalability

### Response Time Targets
- Course search: <200ms
- Course details: <300ms
- Professor lookup: <250ms
- Department stats: <400ms
- Recommendations: <500ms

### Caching Strategy
```javascript
// Multi-level caching
1. In-memory cache (Node-cache): Frequently accessed data
2. MongoDB indexes: Fast database queries
3. Application-level optimization: Efficient algorithms
4. Response compression: Gzip middleware
```

### Load Management
```yaml
Rate Limiting: Handled by RapidAPI
Concurrent Requests: Express default (no custom clustering needed)
Memory Management: Efficient data structures, garbage collection
Error Handling: Graceful degradation, meaningful error messages
```

## Data Quality & Validation

### CSV Data Processing
```javascript
// Data validation pipeline
1. Parse CSV with validation
2. Clean and normalize course codes
3. Extract professor names from comments
4. Calculate aggregate statistics
5. Validate difficulty ranges (1-10)
6. Store in MongoDB with proper indexing
```

### Quality Assurance
- **Data Validation**: Ensure difficulty ratings are 1-10
- **Course Code Normalization**: Standardize format (e.g., "AHS007")
- **Professor Name Extraction**: NLP to extract names from comments
- **Duplicate Detection**: Prevent duplicate reviews
- **Accuracy Verification**: Crowdsourced validation system

## Security & Compliance

### Data Security
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent API abuse (RapidAPI handles)
- **Error Handling**: Don't leak sensitive information
- **CORS Configuration**: Appropriate cross-origin settings

### Privacy Protection
- **Anonymous Data**: No personally identifiable information
- **Public Information**: Only publicly submitted course reviews
- **Data Retention**: Clear policies on data storage
- **User Consent**: Respect for student privacy

## Deployment Strategy

### Development Workflow
```yaml
Local Development:
  - Node.js with nodemon
  - MongoDB local or Atlas
  - Environment variables for config
  - Jest for testing

Staging:
  - Railway preview deployments
  - MongoDB Atlas development cluster
  - Automated testing pipeline

Production:
  - Railway main deployment
  - MongoDB Atlas production cluster
  - Monitoring and logging
  - RapidAPI marketplace listing
```

### CI/CD Pipeline
```yaml
GitHub Actions (Free):
  - Automated testing on pull requests
  - Code quality checks (ESLint, Prettier)
  - Automated deployment to Railway
  - MongoDB connection testing
```

## Risk Mitigation

### Technical Risks
1. **MongoDB Free Tier Limits**: Monitor usage, optimize queries
2. **Railway Free Tier Hours**: Efficient code, sleep mode utilization
3. **Data Quality Issues**: Validation pipelines, user feedback
4. **API Performance**: Caching strategies, code optimization

### Business Risks
1. **Low Adoption**: Aggressive student community marketing
2. **Competition**: Focus on UCR-specific advantages
3. **Revenue Shortfall**: Multiple pricing tiers, value optimization
4. **University Relations**: Position as student success tool

### Operational Risks
1. **Data Updates**: Git-based data versioning system
2. **Service Outages**: Graceful error handling, status page
3. **Support Load**: Clear documentation, FAQ section
4. **Scaling Challenges**: Revenue-based service upgrades

## Success Metrics

### Technical KPIs
- API response time: <500ms average
- Uptime: >99.5% 
- Error rate: <2%
- Data accuracy: >95%

### Business KPIs  
- RapidAPI subscribers: 100+ by month 3
- Monthly recurring revenue: $500 by month 3, $5K by month 12
- Free-to-paid conversion: >40%
- Customer satisfaction: >4.8 stars

### User Engagement
- API calls per month: 50K+ by month 6
- Unique developers: 200+ by month 6
- Support tickets: <5% of users per month
- Documentation views: 1K+ per month

---

**Next Review**: Monthly review based on metrics and user feedback
**Version**: 1.0
**Last Updated**: January 2025