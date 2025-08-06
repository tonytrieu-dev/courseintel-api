import NodeCache from 'node-cache';
import { EnhancedProfessor, Professor } from '../models/Course';

export class ProfessorService {
  private cache: NodeCache;
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    // Cache for 30 minutes (1800 seconds)
    this.cache = new NodeCache({ stdTTL: 1800 });
    this.baseUrl = process.env.PROFESSOR_API_URL || 'http://localhost:5000';
    this.isEnabled = process.env.ENABLE_ENHANCED_PROFESSORS !== 'false';
  }

  /**
   * Get enhanced professor data by combining basic UCR data with RateMyProfessor + Reddit
   */
  async getEnhancedProfessor(professorName: string, basicData: Professor): Promise<EnhancedProfessor> {
    if (!this.isEnabled) {
      return this.fallbackToBasicData(basicData);
    }

    const cacheKey = `professor_${professorName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = this.cache.get<EnhancedProfessor>(cacheKey);
    
    if (cached) {
      console.log(`📚 Using cached data for professor: ${professorName}`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching enhanced data for professor: ${professorName}`);
      
      // Call Enhanced Professor API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
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
      
      // Cache the result
      this.cache.set(cacheKey, enhanced);
      console.log(`✅ Enhanced data cached for professor: ${professorName}`);
      
      return enhanced;
    } catch (error) {
      console.error(`❌ Error fetching enhanced professor data for ${professorName}:`, error);
      return this.fallbackToBasicData(basicData);
    }
  }

  /**
   * Search for professors across multiple universities
   */
  async searchProfessors(query: string, school?: string, department?: string, minRating?: number): Promise<{
    professors: EnhancedProfessor[];
    total_results: number;
  }> {
    if (!this.isEnabled) {
      return { professors: [], total_results: 0 };
    }

    const cacheKey = `search_${query}_${school || 'any'}_${department || 'any'}_${minRating || 'any'}`;
    const cached = this.cache.get<{ professors: EnhancedProfessor[]; total_results: number }>(cacheKey);
    
    if (cached) {
      console.log(`📚 Using cached search results for: ${query}`);
      return cached;
    }

    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      if (school) searchParams.append('school', school);
      if (department) searchParams.append('department', department);
      if (minRating) searchParams.append('min_rating', minRating.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for searches
      
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

      const searchData: any = await response.json();
      const results = {
        professors: searchData.professors || [],
        total_results: searchData.total_results || 0
      };
      
      // Cache search results for 15 minutes
      this.cache.set(cacheKey, results, 900);
      console.log(`✅ Search results cached for query: ${query}`);
      
      return results;
    } catch (error) {
      console.error(`❌ Error searching professors:`, error);
      return { professors: [], total_results: 0 };
    }
  }

  /**
   * Get professor analytics and recommendations
   */
  async getProfessorAnalytics(professorName: string): Promise<{
    recommendation_score: number;
    teaching_style_summary: string;
    pros: string[];
    cons: string[];
    data_quality: 'high' | 'medium' | 'low';
  } | null> {
    if (!this.isEnabled) {
      return null;
    }

    const cacheKey = `analytics_${professorName.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached as any;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
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

      const analytics: any = await response.json();
      this.cache.set(cacheKey, analytics, 1800); // Cache for 30 minutes
      
      return analytics;
    } catch (error) {
      console.error(`❌ Error fetching professor analytics:`, error);
      return null;
    }
  }

  /**
   * Combine basic UCR data with enhanced RateMyProfessor + Reddit data
   */
  private combineData(basicData: Professor, apiData: any): EnhancedProfessor {
    // Parse name into first/last
    const nameParts = basicData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Calculate combined rating (70% RMP, 20% UCR difficulty inverse, 10% Reddit sentiment)
    const rmpRating = apiData.rating || 0;
    const ucrDifficultyInverse = basicData.average_difficulty > 0 ? (11 - basicData.average_difficulty) / 2 : 0; // Convert 1-10 difficulty to 5-0.5 ease rating
    const redditSentiment = apiData.reddit_sentiment?.score || 0;
    const combinedRating = (rmpRating * 0.7) + (ucrDifficultyInverse * 0.2) + ((redditSentiment + 1) * 2.5 * 0.1); // Convert -1 to 1 sentiment to 0-5 scale

    return {
      // Basic UCR data
      ...basicData,
      
      // Enhanced name parsing
      first_name: firstName,
      last_name: lastName,
      department: apiData.department || this.extractDepartmentFromCourses(basicData.courses_taught),
      school: apiData.school || 'University of California, Riverside',
      
      // RateMyProfessor data
      rmp_rating: rmpRating,
      rmp_difficulty: apiData.difficulty || 0,
      rmp_num_ratings: apiData.num_ratings || 0,
      would_take_again: apiData.would_take_again,
      rmp_tags: apiData.tags || [],
      professor_id: apiData.professor_id,
      school_id: apiData.school_id,
      
      // Reddit sentiment data
      reddit_sentiment: apiData.reddit_sentiment ? {
        score: apiData.reddit_sentiment.score,
        confidence: apiData.reddit_sentiment.confidence,
        mention_count: apiData.reddit_sentiment.mention_count || 0,
        positive_mentions: apiData.reddit_sentiment.positive_mentions || 0,
        negative_mentions: apiData.reddit_sentiment.negative_mentions || 0,
        recent_mentions: apiData.reddit_sentiment.recent_mentions || []
      } : null,
      
      // Data quality and sources
      data_quality: this.assessDataQuality(basicData, apiData),
      data_sources: this.getDataSources(basicData, apiData),
      combined_rating: Math.round(combinedRating * 100) / 100,
      last_updated: new Date().toISOString(),
      
      // Enhanced analytics (will be populated by separate call if needed)
      recommendation_score: this.calculateRecommendationScore(combinedRating, apiData),
      teaching_style_summary: this.generateTeachingStyleSummary(basicData, apiData),
      pros: this.extractPros(basicData, apiData),
      cons: this.extractCons(basicData, apiData)
    };
  }

  /**
   * Fallback to basic UCR data when enhanced API is unavailable
   */
  private fallbackToBasicData(basicData: Professor): EnhancedProfessor {
    const nameParts = basicData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      ...basicData,
      first_name: firstName,
      last_name: lastName,
      department: this.extractDepartmentFromCourses(basicData.courses_taught),
      school: 'University of California, Riverside',
      
      // Default RateMyProfessor data
      rmp_rating: 0,
      rmp_difficulty: 0,
      rmp_num_ratings: 0,
      would_take_again: null,
      rmp_tags: [],
      professor_id: null,
      school_id: null,
      
      // No Reddit data
      reddit_sentiment: null,
      
      // Basic data quality
      data_quality: 'low',
      data_sources: ['UCR Course Reviews'],
      combined_rating: basicData.average_difficulty > 0 ? (11 - basicData.average_difficulty) / 2 : 0,
      last_updated: new Date().toISOString(),
      
      // Basic analytics
      recommendation_score: Math.max(0, Math.min(100, (11 - basicData.average_difficulty) * 10)),
      teaching_style_summary: basicData.teaching_characteristics.join(', ') || 'No style information available',
      pros: basicData.teaching_characteristics.filter(c => c.includes('Easy') || c.includes('Engaging')),
      cons: basicData.teaching_characteristics.filter(c => c.includes('Hard') || c.includes('Challenging'))
    };
  }

  /**
   * Helper methods for data processing
   */
  private extractDepartmentFromCourses(courses: string[]): string {
    if (courses.length === 0) return 'Unknown';
    const match = courses[0].match(/^([A-Z]+)/);
    return match ? match[1] : 'Unknown';
  }

  private assessDataQuality(basicData: Professor, apiData: any): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // UCR data quality
    if (basicData.total_reviews >= 5) score += 2;
    else if (basicData.total_reviews >= 2) score += 1;
    
    // RMP data quality
    if (apiData.num_ratings >= 20) score += 3;
    else if (apiData.num_ratings >= 5) score += 2;
    else if (apiData.num_ratings >= 1) score += 1;
    
    // Reddit data quality
    if (apiData.reddit_sentiment?.mention_count >= 5) score += 2;
    else if (apiData.reddit_sentiment?.mention_count >= 1) score += 1;
    
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private getDataSources(_basicData: Professor, apiData: any): string[] {
    const sources = ['UCR Course Reviews'];
    
    if (apiData.rating > 0) sources.push('RateMyProfessor');
    if (apiData.reddit_sentiment) sources.push('Reddit Sentiment Analysis');
    
    return sources;
  }

  private calculateRecommendationScore(combinedRating: number, apiData: any): number {
    let score = combinedRating * 20; // Base score from rating (0-100)
    
    // Boost for high number of reviews (reliability)
    if (apiData.num_ratings >= 20) score += 10;
    else if (apiData.num_ratings >= 10) score += 5;
    
    // Boost for positive Reddit sentiment
    if (apiData.reddit_sentiment?.score > 0.2) score += 5;
    
    // Penalty for very high difficulty
    if (apiData.difficulty > 4) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateTeachingStyleSummary(basicData: Professor, apiData: any): string {
    const characteristics = [...basicData.teaching_characteristics];
    
    if (apiData.tags?.length > 0) {
      characteristics.push(...apiData.tags.slice(0, 3));
    }
    
    if (characteristics.length === 0) {
      return 'Teaching style information not available';
    }
    
    return characteristics.slice(0, 5).join(', ');
  }

  private extractPros(basicData: Professor, apiData: any): string[] {
    const pros: string[] = [];
    
    // From UCR characteristics
    pros.push(...basicData.teaching_characteristics.filter(c => 
      c.includes('Easy') || c.includes('Engaging') || c.includes('Extra credit') || c.includes('Online')
    ));
    
    // From RMP tags
    if (apiData.tags) {
      pros.push(...apiData.tags.filter((tag: string) => 
        tag.toLowerCase().includes('amazing') || 
        tag.toLowerCase().includes('clear') || 
        tag.toLowerCase().includes('helpful')
      ).slice(0, 3));
    }
    
    // From ratings
    if (apiData.rating >= 4) pros.push('Highly rated on RateMyProfessor');
    if (apiData.would_take_again >= 0.8) pros.push('Students would take again');
    
    return [...new Set(pros)].slice(0, 5);
  }

  private extractCons(basicData: Professor, apiData: any): string[] {
    const cons: string[] = [];
    
    // From UCR characteristics
    cons.push(...basicData.teaching_characteristics.filter(c => 
      c.includes('Hard') || c.includes('Challenging') || c.includes('Attendance required')
    ));
    
    // From RMP tags
    if (apiData.tags) {
      cons.push(...apiData.tags.filter((tag: string) => 
        tag.toLowerCase().includes('tough') || 
        tag.toLowerCase().includes('boring') || 
        tag.toLowerCase().includes('unclear')
      ).slice(0, 3));
    }
    
    // From ratings
    if (apiData.difficulty >= 4) cons.push('High difficulty rating');
    if (apiData.rating < 3) cons.push('Below average rating');
    
    return [...new Set(cons)].slice(0, 5);
  }

  /**
   * Health check for Enhanced Professor API
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unavailable'; response_time?: number }> {
    if (!this.isEnabled) {
      return { status: 'unavailable' };
    }

    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return { status: 'healthy', response_time: responseTime };
      } else {
        return { status: 'degraded', response_time: responseTime };
      }
    } catch (error) {
      return { status: 'unavailable', response_time: Date.now() - startTime };
    }
  }

  /**
   * Clear cache for a specific professor or all cached data
   */
  clearCache(professorName?: string): void {
    if (professorName) {
      const cacheKey = `professor_${professorName.toLowerCase().replace(/\s+/g, '_')}`;
      this.cache.del(cacheKey);
      console.log(`🗑️ Cleared cache for professor: ${professorName}`);
    } else {
      this.cache.flushAll();
      console.log('🗑️ Cleared all professor cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}

// Singleton instance
export const professorService = new ProfessorService();