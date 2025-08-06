import { Request, Response } from 'express';
import { dataService } from '../services/DataService';
import { professorService } from '../services/ProfessorService';
import { ApiResponse, ProfessorSearchResponse, ApiError, EnhancedProfessor } from '../models/Course';

export class ProfessorController {

  /**
   * Search professors across multiple universities
   * GET /api/v1/professors/search
   */
  async searchProfessors(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q: query, 
        school, 
        department, 
        min_rating, 
        limit = '10' 
      } = req.query;

      if (!query) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Missing Query',
          message: 'Search query parameter "q" is required',
          timestamp: new Date().toISOString(),
          code: 400
        };
        res.status(400).json(errorResponse);
        return;
      }

      const minRating = min_rating ? parseFloat(min_rating as string) : undefined;
      const limitNum = Math.min(parseInt(limit as string) || 10, 50); // Max 50 results

      // Search using Enhanced Professor API
      const searchResults = await professorService.searchProfessors(
        query as string,
        school as string,
        department as string,
        minRating
      );

      // Apply client-side limit to results
      const limitedProfessors = searchResults.professors.slice(0, limitNum);

      const response: ApiResponse<ProfessorSearchResponse> = {
        success: true,
        data: {
          professors: limitedProfessors,
          total_results: searchResults.total_results,
          filters_applied: {
            ...(query && { query: query as string }),
            ...(school && { school: school as string }),
            ...(department && { department: department as string }),
            ...(minRating && { min_rating: minRating })
          }
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Professor search error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Search Failed',
        message: 'Unable to search professors. Please try again.',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get comprehensive professor information
   * GET /api/v1/professors/:name
   */
  async getProfessorDetails(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      
      if (!name || name.trim().length === 0) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Invalid Professor Name',
          message: 'Professor name is required',
          timestamp: new Date().toISOString(),
          code: 400
        };
        res.status(400).json(errorResponse);
        return;
      }

      // First try to get basic data from UCR database
      const basicProfessor = await dataService.getProfessor(name);
      
      if (!basicProfessor) {
        // If not found in UCR data, try searching Enhanced Professor API directly
        const searchResults = await professorService.searchProfessors(name);
        
        if (searchResults.professors.length === 0) {
          const errorResponse: ApiError = {
            success: false,
            error: 'Professor Not Found',
            message: `Professor "${name}" not found in our database`,
            timestamp: new Date().toISOString(),
            code: 404
          };
          res.status(404).json(errorResponse);
          return;
        }

        // Return the first search result
        const enhancedProfessor = searchResults.professors[0];
        const response: ApiResponse<EnhancedProfessor> = {
          success: true,
          data: enhancedProfessor,
          timestamp: new Date().toISOString()
        };

        res.json(response);
        return;
      }

      // Get enhanced data by combining UCR + RMP + Reddit
      const enhancedProfessor = await professorService.getEnhancedProfessor(name, basicProfessor);

      const response: ApiResponse<EnhancedProfessor> = {
        success: true,
        data: enhancedProfessor,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Professor details error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Server Error',
        message: 'Unable to fetch professor details',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get professor analytics and recommendations
   * GET /api/v1/professors/:name/analytics
   */
  async getProfessorAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      
      if (!name || name.trim().length === 0) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Invalid Professor Name',
          message: 'Professor name is required',
          timestamp: new Date().toISOString(),
          code: 400
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Get analytics from Enhanced Professor API
      const analytics = await professorService.getProfessorAnalytics(name);
      
      if (!analytics) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Analytics Not Available',
          message: `Analytics for professor "${name}" are not available at this time`,
          timestamp: new Date().toISOString(),
          code: 404
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: ApiResponse<typeof analytics> = {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Professor analytics error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Analytics Service Error',
        message: 'Unable to fetch professor analytics',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Check Enhanced Professor API health
   * GET /api/v1/professors/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await professorService.healthCheck();
      const cacheStats = professorService.getCacheStats();

      const response: ApiResponse<typeof healthStatus & { cache_stats: typeof cacheStats }> = {
        success: true,
        data: {
          ...healthStatus,
          cache_stats: cacheStats
        },
        timestamp: new Date().toISOString()
      };

      // Set appropriate HTTP status based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(response);
    } catch (error) {
      console.error('Professor health check error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Health Check Failed',
        message: 'Unable to check professor service health',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }
}