"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.professorService = exports.ProfessorService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class ProfessorService {
    constructor() {
        this.cache = new node_cache_1.default({ stdTTL: 1800 });
        this.baseUrl = process.env.PROFESSOR_API_URL || 'http://localhost:5000';
        this.isEnabled = process.env.ENABLE_ENHANCED_PROFESSORS !== 'false';
    }
    async getEnhancedProfessor(professorName, basicData) {
        if (!this.isEnabled) {
            return this.fallbackToBasicData(basicData);
        }
        const cacheKey = `professor_${professorName.toLowerCase().replace(/\s+/g, '_')}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(`📚 Using cached data for professor: ${professorName}`);
            return cached;
        }
        try {
            console.log(`🔍 Fetching enhanced data for professor: ${professorName}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${this.baseUrl}/api/professor/${encodeURIComponent(professorName)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CourseIntel-API/1.0'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                console.warn(`⚠️ Enhanced Professor API returned ${response.status} for ${professorName}`);
                return this.fallbackToBasicData(basicData);
            }
            const apiData = await response.json();
            const enhanced = this.combineData(basicData, apiData);
            this.cache.set(cacheKey, enhanced);
            console.log(`✅ Enhanced data cached for professor: ${professorName}`);
            return enhanced;
        }
        catch (error) {
            console.error(`❌ Error fetching enhanced professor data for ${professorName}:`, error);
            return this.fallbackToBasicData(basicData);
        }
    }
    async searchProfessors(query, school, department, minRating) {
        if (!this.isEnabled) {
            return { professors: [], total_results: 0 };
        }
        const cacheKey = `search_${query}_${school || 'any'}_${department || 'any'}_${minRating || 'any'}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(`📚 Using cached search results for: ${query}`);
            return cached;
        }
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('q', query);
            if (school)
                searchParams.append('school', school);
            if (department)
                searchParams.append('department', department);
            if (minRating)
                searchParams.append('min_rating', minRating.toString());
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(`${this.baseUrl}/api/search?${searchParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CourseIntel-API/1.0'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                console.warn(`⚠️ Enhanced Professor search API returned ${response.status}`);
                return { professors: [], total_results: 0 };
            }
            const searchData = await response.json();
            const results = {
                professors: searchData.professors || [],
                total_results: searchData.total_results || 0
            };
            this.cache.set(cacheKey, results, 900);
            console.log(`✅ Search results cached for query: ${query}`);
            return results;
        }
        catch (error) {
            console.error(`❌ Error searching professors:`, error);
            return { professors: [], total_results: 0 };
        }
    }
    async getProfessorAnalytics(professorName) {
        if (!this.isEnabled) {
            return null;
        }
        const cacheKey = `analytics_${professorName.toLowerCase().replace(/\s+/g, '_')}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`${this.baseUrl}/api/analyze/${encodeURIComponent(professorName)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CourseIntel-API/1.0'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                return null;
            }
            const analytics = await response.json();
            this.cache.set(cacheKey, analytics, 1800);
            return analytics;
        }
        catch (error) {
            console.error(`❌ Error fetching professor analytics:`, error);
            return null;
        }
    }
    combineData(basicData, apiData) {
        const nameParts = basicData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const rmpRating = apiData.rating || 0;
        const ucrDifficultyInverse = basicData.average_difficulty > 0 ? (11 - basicData.average_difficulty) / 2 : 0;
        const redditSentiment = apiData.reddit_sentiment?.score || 0;
        const combinedRating = (rmpRating * 0.7) + (ucrDifficultyInverse * 0.2) + ((redditSentiment + 1) * 2.5 * 0.1);
        return {
            ...basicData,
            first_name: firstName,
            last_name: lastName,
            department: apiData.department || this.extractDepartmentFromCourses(basicData.courses_taught),
            school: apiData.school || 'University of California, Riverside',
            rmp_rating: rmpRating,
            rmp_difficulty: apiData.difficulty || 0,
            rmp_num_ratings: apiData.num_ratings || 0,
            would_take_again: apiData.would_take_again,
            rmp_tags: apiData.tags || [],
            professor_id: apiData.professor_id,
            school_id: apiData.school_id,
            reddit_sentiment: apiData.reddit_sentiment ? {
                score: apiData.reddit_sentiment.score,
                confidence: apiData.reddit_sentiment.confidence,
                mention_count: apiData.reddit_sentiment.mention_count || 0,
                positive_mentions: apiData.reddit_sentiment.positive_mentions || 0,
                negative_mentions: apiData.reddit_sentiment.negative_mentions || 0,
                recent_mentions: apiData.reddit_sentiment.recent_mentions || []
            } : null,
            data_quality: this.assessDataQuality(basicData, apiData),
            data_sources: this.getDataSources(basicData, apiData),
            combined_rating: Math.round(combinedRating * 100) / 100,
            last_updated: new Date().toISOString(),
            recommendation_score: this.calculateRecommendationScore(combinedRating, apiData),
            teaching_style_summary: this.generateTeachingStyleSummary(basicData, apiData),
            pros: this.extractPros(basicData, apiData),
            cons: this.extractCons(basicData, apiData)
        };
    }
    fallbackToBasicData(basicData) {
        const nameParts = basicData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        return {
            ...basicData,
            first_name: firstName,
            last_name: lastName,
            department: this.extractDepartmentFromCourses(basicData.courses_taught),
            school: 'University of California, Riverside',
            rmp_rating: 0,
            rmp_difficulty: 0,
            rmp_num_ratings: 0,
            would_take_again: null,
            rmp_tags: [],
            professor_id: null,
            school_id: null,
            reddit_sentiment: null,
            data_quality: 'low',
            data_sources: ['UCR Course Reviews'],
            combined_rating: basicData.average_difficulty > 0 ? (11 - basicData.average_difficulty) / 2 : 0,
            last_updated: new Date().toISOString(),
            recommendation_score: Math.max(0, Math.min(100, (11 - basicData.average_difficulty) * 10)),
            teaching_style_summary: basicData.teaching_characteristics.join(', ') || 'No style information available',
            pros: basicData.teaching_characteristics.filter(c => c.includes('Easy') || c.includes('Engaging')),
            cons: basicData.teaching_characteristics.filter(c => c.includes('Hard') || c.includes('Challenging'))
        };
    }
    extractDepartmentFromCourses(courses) {
        if (courses.length === 0)
            return 'Unknown';
        const match = courses[0].match(/^([A-Z]+)/);
        return match ? match[1] : 'Unknown';
    }
    assessDataQuality(basicData, apiData) {
        let score = 0;
        if (basicData.total_reviews >= 5)
            score += 2;
        else if (basicData.total_reviews >= 2)
            score += 1;
        if (apiData.num_ratings >= 20)
            score += 3;
        else if (apiData.num_ratings >= 5)
            score += 2;
        else if (apiData.num_ratings >= 1)
            score += 1;
        if (apiData.reddit_sentiment?.mention_count >= 5)
            score += 2;
        else if (apiData.reddit_sentiment?.mention_count >= 1)
            score += 1;
        if (score >= 6)
            return 'high';
        if (score >= 3)
            return 'medium';
        return 'low';
    }
    getDataSources(_basicData, apiData) {
        const sources = ['UCR Course Reviews'];
        if (apiData.rating > 0)
            sources.push('RateMyProfessor');
        if (apiData.reddit_sentiment)
            sources.push('Reddit Sentiment Analysis');
        return sources;
    }
    calculateRecommendationScore(combinedRating, apiData) {
        let score = combinedRating * 20;
        if (apiData.num_ratings >= 20)
            score += 10;
        else if (apiData.num_ratings >= 10)
            score += 5;
        if (apiData.reddit_sentiment?.score > 0.2)
            score += 5;
        if (apiData.difficulty > 4)
            score -= 10;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    generateTeachingStyleSummary(basicData, apiData) {
        const characteristics = [...basicData.teaching_characteristics];
        if (apiData.tags?.length > 0) {
            characteristics.push(...apiData.tags.slice(0, 3));
        }
        if (characteristics.length === 0) {
            return 'Teaching style information not available';
        }
        return characteristics.slice(0, 5).join(', ');
    }
    extractPros(basicData, apiData) {
        const pros = [];
        pros.push(...basicData.teaching_characteristics.filter(c => c.includes('Easy') || c.includes('Engaging') || c.includes('Extra credit') || c.includes('Online')));
        if (apiData.tags) {
            pros.push(...apiData.tags.filter((tag) => tag.toLowerCase().includes('amazing') ||
                tag.toLowerCase().includes('clear') ||
                tag.toLowerCase().includes('helpful')).slice(0, 3));
        }
        if (apiData.rating >= 4)
            pros.push('Highly rated on RateMyProfessor');
        if (apiData.would_take_again >= 0.8)
            pros.push('Students would take again');
        return [...new Set(pros)].slice(0, 5);
    }
    extractCons(basicData, apiData) {
        const cons = [];
        cons.push(...basicData.teaching_characteristics.filter(c => c.includes('Hard') || c.includes('Challenging') || c.includes('Attendance required')));
        if (apiData.tags) {
            cons.push(...apiData.tags.filter((tag) => tag.toLowerCase().includes('tough') ||
                tag.toLowerCase().includes('boring') ||
                tag.toLowerCase().includes('unclear')).slice(0, 3));
        }
        if (apiData.difficulty >= 4)
            cons.push('High difficulty rating');
        if (apiData.rating < 3)
            cons.push('Below average rating');
        return [...new Set(cons)].slice(0, 5);
    }
    async healthCheck() {
        if (!this.isEnabled) {
            return { status: 'unavailable' };
        }
        const startTime = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            if (response.ok) {
                return { status: 'healthy', response_time: responseTime };
            }
            else {
                return { status: 'degraded', response_time: responseTime };
            }
        }
        catch (error) {
            return { status: 'unavailable', response_time: Date.now() - startTime };
        }
    }
    clearCache(professorName) {
        if (professorName) {
            const cacheKey = `professor_${professorName.toLowerCase().replace(/\s+/g, '_')}`;
            this.cache.del(cacheKey);
            console.log(`🗑️ Cleared cache for professor: ${professorName}`);
        }
        else {
            this.cache.flushAll();
            console.log('🗑️ Cleared all professor cache');
        }
    }
    getCacheStats() {
        const stats = this.cache.getStats();
        return {
            keys: stats.keys,
            hits: stats.hits,
            misses: stats.misses
        };
    }
}
exports.ProfessorService = ProfessorService;
exports.professorService = new ProfessorService();
//# sourceMappingURL=ProfessorService.js.map