import { Request, Response } from 'express';
import { dataService } from '../services/DataService';
import { professorService } from '../services/ProfessorService';
import { ApiResponse, SearchResponse, CourseDetailResponse, EnhancedCourseDetailResponse, ApiError } from '../models/Course';

export class CourseController {
  
  /**
   * Search courses by various criteria
   * GET /api/v1/courses/search
   */
  async searchCourses(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q: query, 
        department, 
        max_difficulty, 
        limit = '20' 
      } = req.query;

      const maxDifficulty = max_difficulty ? parseFloat(max_difficulty as string) : undefined;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Max 100 results

      const courses = await dataService.searchCourses(
        query as string,
        department as string,
        maxDifficulty
      );

      // Limit results and sort by relevance (total reviews desc)
      const limitedCourses = courses
        .sort((a, b) => b.total_reviews - a.total_reviews)
        .slice(0, limitNum);

      const response: ApiResponse<SearchResponse> = {
        success: true,
        data: {
          courses: limitedCourses,
          total_results: courses.length,
          filters_applied: {
            ...(query && { query: query as string }),
            ...(department && { department: department as string }),
            ...(maxDifficulty && { max_difficulty: maxDifficulty })
          }
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Search error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Search Failed',
        message: 'Unable to search courses. Please try again.',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get detailed course information
   * GET /api/v1/courses/:courseCode
   */
  async getCourseDetails(req: Request, res: Response): Promise<void> {
    try {
      const { courseCode } = req.params;
      
      if (!courseCode) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Invalid Course Code',
          message: 'Course code is required',
          timestamp: new Date().toISOString(),
          code: 400
        };
        res.status(400).json(errorResponse);
        return;
      }

      const course = await dataService.getCourse(courseCode);
      
      if (!course) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Course Not Found',
          message: `Course ${courseCode.toUpperCase()} not found in our database`,
          timestamp: new Date().toISOString(),
          code: 404
        };
        res.status(404).json(errorResponse);
        return;
      }

      // Get reviews and professors for this course
      const reviews = await dataService.getCourseReviews(courseCode);
      const recentReviews = reviews
        .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
        .slice(0, 5); // Last 5 reviews

      // Get professors who taught this course
      const professorNames = [...new Set(reviews
        .filter(r => r.professor_name)
        .map(r => r.professor_name!))];
      
      const professors = [];
      for (const profName of professorNames.slice(0, 3)) { // Max 3 professors
        const prof = await dataService.getProfessor(profName);
        if (prof) professors.push(prof);
      }

      const courseDetail: CourseDetailResponse = {
        ...course,
        recent_reviews: recentReviews,
        professors: professors
      };

      const response: ApiResponse<CourseDetailResponse> = {
        success: true,
        data: courseDetail,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Course details error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Server Error',
        message: 'Unable to fetch course details',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get easy courses (difficulty <= 4)
   * GET /api/v1/courses/easy
   */
  async getEasyCourses(req: Request, res: Response): Promise<void> {
    try {
      const { department, limit = '10' } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 10, 50);

      const courses = await dataService.searchCourses(
        undefined,
        department as string,
        4.0 // Max difficulty of 4
      );

      // Sort by easiest first, then by most reviews
      const easyCourses = courses
        .filter(c => c.total_reviews >= 2) // At least 2 reviews for reliability
        .sort((a, b) => {
          if (a.average_difficulty !== b.average_difficulty) {
            return a.average_difficulty - b.average_difficulty;
          }
          return b.total_reviews - a.total_reviews;
        })
        .slice(0, limitNum);

      const response: ApiResponse<SearchResponse> = {
        success: true,
        data: {
          courses: easyCourses,
          total_results: easyCourses.length,
          filters_applied: {
            max_difficulty: 4.0,
            min_reviews: 2,
            ...(department && { department: department as string })
          }
        },
        message: 'Easy courses with reliable difficulty ratings',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Easy courses error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Server Error',
        message: 'Unable to fetch easy courses',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get all available courses
   * GET /api/v1/courses
   */
  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '50' } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 50, 200);

      const allCourses = await dataService.getAllCourses();
      
      // Sort by most reviewed first
      const sortedCourses = allCourses
        .sort((a, b) => b.total_reviews - a.total_reviews)
        .slice(0, limitNum);

      const response: ApiResponse<SearchResponse> = {
        success: true,
        data: {
          courses: sortedCourses,
          total_results: allCourses.length,
          filters_applied: {}
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Get all courses error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Server Error',
        message: 'Unable to fetch courses',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get enhanced course details with comprehensive professor data
   * GET /api/v1/courses/:courseCode/enhanced
   */
  async getEnhancedCourseDetails(req: Request, res: Response): Promise<void> {
    try {
      const { courseCode } = req.params;
      
      if (!courseCode) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Invalid Course Code',
          message: 'Course code is required',
          timestamp: new Date().toISOString(),
          code: 400
        };
        res.status(400).json(errorResponse);
        return;
      }

      const course = await dataService.getCourse(courseCode);
      
      if (!course) {
        const errorResponse: ApiError = {
          success: false,
          error: 'Course Not Found',
          message: `Course ${courseCode.toUpperCase()} not found in our database`,
          timestamp: new Date().toISOString(),
          code: 404
        };
        res.status(404).json(errorResponse);
        return;
      }

      // Get reviews for this course
      const reviews = await dataService.getCourseReviews(courseCode);
      const recentReviews = reviews
        .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
        .slice(0, 5); // Last 5 reviews

      // Get enhanced professor data
      const professorNames = [...new Set(reviews
        .filter(r => r.professor_name)
        .map(r => r.professor_name!))];
      
      const enhancedProfessors = [];
      for (const profName of professorNames.slice(0, 3)) { // Max 3 professors
        const basicProf = await dataService.getProfessor(profName);
        if (basicProf) {
          const enhancedProf = await professorService.getEnhancedProfessor(profName, basicProf);
          enhancedProfessors.push(enhancedProf);
        }
      }

      const courseDetail: EnhancedCourseDetailResponse = {
        ...course,
        recent_reviews: recentReviews,
        professors: enhancedProfessors
      };

      const response: ApiResponse<EnhancedCourseDetailResponse> = {
        success: true,
        data: courseDetail,
        message: 'Enhanced course details with comprehensive professor data',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Enhanced course details error:', error);
      const errorResponse: ApiError = {
        success: false,
        error: 'Server Error',
        message: 'Unable to fetch enhanced course details',
        timestamp: new Date().toISOString(),
        code: 500
      };
      res.status(500).json(errorResponse);
    }
  }
}