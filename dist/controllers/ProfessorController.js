"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessorController = void 0;
const DataService_1 = require("../services/DataService");
const ProfessorService_1 = require("../services/ProfessorService");
class ProfessorController {
    async searchProfessors(req, res) {
        try {
            const { q: query, school, department, min_rating, limit = '10' } = req.query;
            if (!query) {
                const errorResponse = {
                    success: false,
                    error: 'Missing Query',
                    message: 'Search query parameter "q" is required',
                    timestamp: new Date().toISOString(),
                    code: 400
                };
                res.status(400).json(errorResponse);
                return;
            }
            const minRating = min_rating ? parseFloat(min_rating) : undefined;
            const limitNum = Math.min(parseInt(limit) || 10, 50);
            const searchResults = await ProfessorService_1.professorService.searchProfessors(query, school, department, minRating);
            const limitedProfessors = searchResults.professors.slice(0, limitNum);
            const response = {
                success: true,
                data: {
                    professors: limitedProfessors,
                    total_results: searchResults.total_results,
                    filters_applied: {
                        ...(query && { query: query }),
                        ...(school && { school: school }),
                        ...(department && { department: department }),
                        ...(minRating && { min_rating: minRating })
                    }
                },
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Professor search error:', error);
            const errorResponse = {
                success: false,
                error: 'Search Failed',
                message: 'Unable to search professors. Please try again.',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async getProfessorDetails(req, res) {
        try {
            const { name } = req.params;
            if (!name || name.trim().length === 0) {
                const errorResponse = {
                    success: false,
                    error: 'Invalid Professor Name',
                    message: 'Professor name is required',
                    timestamp: new Date().toISOString(),
                    code: 400
                };
                res.status(400).json(errorResponse);
                return;
            }
            const basicProfessor = await DataService_1.dataService.getProfessor(name);
            if (!basicProfessor) {
                const searchResults = await ProfessorService_1.professorService.searchProfessors(name);
                if (searchResults.professors.length === 0) {
                    const errorResponse = {
                        success: false,
                        error: 'Professor Not Found',
                        message: `Professor "${name}" not found in our database`,
                        timestamp: new Date().toISOString(),
                        code: 404
                    };
                    res.status(404).json(errorResponse);
                    return;
                }
                const enhancedProfessor = searchResults.professors[0];
                const response = {
                    success: true,
                    data: enhancedProfessor,
                    timestamp: new Date().toISOString()
                };
                res.json(response);
                return;
            }
            const enhancedProfessor = await ProfessorService_1.professorService.getEnhancedProfessor(name, basicProfessor);
            const response = {
                success: true,
                data: enhancedProfessor,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Professor details error:', error);
            const errorResponse = {
                success: false,
                error: 'Server Error',
                message: 'Unable to fetch professor details',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async getProfessorAnalytics(req, res) {
        try {
            const { name } = req.params;
            if (!name || name.trim().length === 0) {
                const errorResponse = {
                    success: false,
                    error: 'Invalid Professor Name',
                    message: 'Professor name is required',
                    timestamp: new Date().toISOString(),
                    code: 400
                };
                res.status(400).json(errorResponse);
                return;
            }
            const analytics = await ProfessorService_1.professorService.getProfessorAnalytics(name);
            if (!analytics) {
                const errorResponse = {
                    success: false,
                    error: 'Analytics Not Available',
                    message: `Analytics for professor "${name}" are not available at this time`,
                    timestamp: new Date().toISOString(),
                    code: 404
                };
                res.status(404).json(errorResponse);
                return;
            }
            const response = {
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Professor analytics error:', error);
            const errorResponse = {
                success: false,
                error: 'Analytics Service Error',
                message: 'Unable to fetch professor analytics',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async healthCheck(_req, res) {
        try {
            const healthStatus = await ProfessorService_1.professorService.healthCheck();
            const cacheStats = ProfessorService_1.professorService.getCacheStats();
            const response = {
                success: true,
                data: {
                    ...healthStatus,
                    cache_stats: cacheStats
                },
                timestamp: new Date().toISOString()
            };
            const statusCode = healthStatus.status === 'healthy' ? 200 :
                healthStatus.status === 'degraded' ? 200 : 503;
            res.status(statusCode).json(response);
        }
        catch (error) {
            console.error('Professor health check error:', error);
            const errorResponse = {
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
exports.ProfessorController = ProfessorController;
//# sourceMappingURL=ProfessorController.js.map