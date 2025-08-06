"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const DataService_1 = require("../services/DataService");
const ProfessorService_1 = require("../services/ProfessorService");
class CourseController {
    async searchCourses(req, res) {
        try {
            const { q: query, department, max_difficulty, limit = '20' } = req.query;
            const maxDifficulty = max_difficulty ? parseFloat(max_difficulty) : undefined;
            const limitNum = Math.min(parseInt(limit) || 20, 100);
            const courses = await DataService_1.dataService.searchCourses(query, department, maxDifficulty);
            const limitedCourses = courses
                .sort((a, b) => b.total_reviews - a.total_reviews)
                .slice(0, limitNum);
            const response = {
                success: true,
                data: {
                    courses: limitedCourses,
                    total_results: courses.length,
                    filters_applied: {
                        ...(query && { query: query }),
                        ...(department && { department: department }),
                        ...(maxDifficulty && { max_difficulty: maxDifficulty })
                    }
                },
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Search error:', error);
            const errorResponse = {
                success: false,
                error: 'Search Failed',
                message: 'Unable to search courses. Please try again.',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async getCourseDetails(req, res) {
        try {
            const { courseCode } = req.params;
            if (!courseCode) {
                const errorResponse = {
                    success: false,
                    error: 'Invalid Course Code',
                    message: 'Course code is required',
                    timestamp: new Date().toISOString(),
                    code: 400
                };
                res.status(400).json(errorResponse);
                return;
            }
            const course = await DataService_1.dataService.getCourse(courseCode);
            if (!course) {
                const errorResponse = {
                    success: false,
                    error: 'Course Not Found',
                    message: `Course ${courseCode.toUpperCase()} not found in our database`,
                    timestamp: new Date().toISOString(),
                    code: 404
                };
                res.status(404).json(errorResponse);
                return;
            }
            const reviews = await DataService_1.dataService.getCourseReviews(courseCode);
            const recentReviews = reviews
                .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
                .slice(0, 5);
            const professorNames = [...new Set(reviews
                    .filter(r => r.professor_name)
                    .map(r => r.professor_name))];
            const professors = [];
            for (const profName of professorNames.slice(0, 3)) {
                const prof = await DataService_1.dataService.getProfessor(profName);
                if (prof)
                    professors.push(prof);
            }
            const courseDetail = {
                ...course,
                recent_reviews: recentReviews,
                professors: professors
            };
            const response = {
                success: true,
                data: courseDetail,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Course details error:', error);
            const errorResponse = {
                success: false,
                error: 'Server Error',
                message: 'Unable to fetch course details',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async getEasyCourses(req, res) {
        try {
            const { department, limit = '10' } = req.query;
            const limitNum = Math.min(parseInt(limit) || 10, 50);
            const courses = await DataService_1.dataService.searchCourses(undefined, department, 4.0);
            const easyCourses = courses
                .filter(c => c.total_reviews >= 2)
                .sort((a, b) => {
                if (a.average_difficulty !== b.average_difficulty) {
                    return a.average_difficulty - b.average_difficulty;
                }
                return b.total_reviews - a.total_reviews;
            })
                .slice(0, limitNum);
            const response = {
                success: true,
                data: {
                    courses: easyCourses,
                    total_results: easyCourses.length,
                    filters_applied: {
                        max_difficulty: 4.0,
                        min_reviews: 2,
                        ...(department && { department: department })
                    }
                },
                message: 'Easy courses with reliable difficulty ratings',
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Easy courses error:', error);
            const errorResponse = {
                success: false,
                error: 'Server Error',
                message: 'Unable to fetch easy courses',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async getAllCourses(req, res) {
        try {
            const { limit = '50' } = req.query;
            const limitNum = Math.min(parseInt(limit) || 50, 200);
            const allCourses = await DataService_1.dataService.getAllCourses();
            const sortedCourses = allCourses
                .sort((a, b) => b.total_reviews - a.total_reviews)
                .slice(0, limitNum);
            const response = {
                success: true,
                data: {
                    courses: sortedCourses,
                    total_results: allCourses.length,
                    filters_applied: {}
                },
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Get all courses error:', error);
            const errorResponse = {
                success: false,
                error: 'Server Error',
                message: 'Unable to fetch courses',
                timestamp: new Date().toISOString(),
                code: 500
            };
            res.status(500).json(errorResponse);
        }
    }
    async getEnhancedCourseDetails(req, res) {
        try {
            const { courseCode } = req.params;
            if (!courseCode) {
                const errorResponse = {
                    success: false,
                    error: 'Invalid Course Code',
                    message: 'Course code is required',
                    timestamp: new Date().toISOString(),
                    code: 400
                };
                res.status(400).json(errorResponse);
                return;
            }
            const course = await DataService_1.dataService.getCourse(courseCode);
            if (!course) {
                const errorResponse = {
                    success: false,
                    error: 'Course Not Found',
                    message: `Course ${courseCode.toUpperCase()} not found in our database`,
                    timestamp: new Date().toISOString(),
                    code: 404
                };
                res.status(404).json(errorResponse);
                return;
            }
            const reviews = await DataService_1.dataService.getCourseReviews(courseCode);
            const recentReviews = reviews
                .sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime())
                .slice(0, 5);
            const professorNames = [...new Set(reviews
                    .filter(r => r.professor_name)
                    .map(r => r.professor_name))];
            const enhancedProfessors = [];
            for (const profName of professorNames.slice(0, 3)) {
                const basicProf = await DataService_1.dataService.getProfessor(profName);
                if (basicProf) {
                    const enhancedProf = await ProfessorService_1.professorService.getEnhancedProfessor(profName, basicProf);
                    enhancedProfessors.push(enhancedProf);
                }
            }
            const courseDetail = {
                ...course,
                recent_reviews: recentReviews,
                professors: enhancedProfessors
            };
            const response = {
                success: true,
                data: courseDetail,
                message: 'Enhanced course details with comprehensive professor data',
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Enhanced course details error:', error);
            const errorResponse = {
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
exports.CourseController = CourseController;
//# sourceMappingURL=CourseController.js.map