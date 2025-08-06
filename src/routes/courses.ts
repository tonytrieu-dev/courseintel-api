import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';

const router = Router();
const courseController = new CourseController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         course_code:
 *           type: string
 *           example: "AHS007"
 *         department:
 *           type: string
 *           example: "AHS"
 *         average_difficulty:
 *           type: number
 *           example: 3.5
 *         total_reviews:
 *           type: number
 *           example: 15
 *         difficulty_distribution:
 *           type: object
 *           properties:
 *             very_easy:
 *               type: number
 *             easy:
 *               type: number
 *             moderate:
 *               type: number
 *             hard:
 *               type: number
 *             very_hard:
 *               type: number
 *         latest_review_date:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 * 
 *     CourseReview:
 *       type: object
 *       properties:
 *         course_code:
 *           type: string
 *           example: "AHS007"
 *         difficulty:
 *           type: number
 *           example: 2
 *         comment:
 *           type: string
 *           example: "Easy A if you just do the essays and participate"
 *         professor_name:
 *           type: string
 *           nullable: true
 *           example: "Charles Peterson"
 *         review_date:
 *           type: string
 *           format: date-time
 *         semester:
 *           type: string
 *           nullable: true
 *           example: "Fall 2023"
 * 
 *     Professor:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Charles Peterson"
 *         courses_taught:
 *           type: array
 *           items:
 *             type: string
 *           example: ["AHS007", "AHS008"]
 *         average_difficulty:
 *           type: number
 *           example: 2.5
 *         total_reviews:
 *           type: number
 *           example: 8
 *         teaching_characteristics:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Engaging lectures", "Recorded classes"]
 * 
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *         message:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 * 
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Course Not Found"
 *         message:
 *           type: string
 *           example: "Course AHS999 not found in our database"
 *         timestamp:
 *           type: string
 *           format: date-time
 *         code:
 *           type: number
 *           example: 404
 */

/**
 * @swagger
 * /api/v1/courses/search:
 *   get:
 *     summary: Search courses by various criteria
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (course code or department)
 *         example: "AHS"
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department code
 *         example: "AHS"
 *       - in: query
 *         name: max_difficulty
 *         schema:
 *           type: number
 *         description: Maximum difficulty level (1-10)
 *         example: 5
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Number of results to return (max 100)
 *         example: 10
 *     responses:
 *       200:
 *         description: Successful search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     total_results:
 *                       type: number
 *                       example: 25
 *                     filters_applied:
 *                       type: object
 *                       example: { "department": "AHS", "max_difficulty": 5 }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/search', (req, res) => courseController.searchCourses(req, res));

/**
 * @swagger
 * /api/v1/courses/easy:
 *   get:
 *     summary: Get easy courses (difficulty ≤ 4.0)
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department code
 *         example: "AHS"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of results to return (max 50)
 *         example: 5
 *     responses:
 *       200:
 *         description: List of easy courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     total_results:
 *                       type: number
 *                     filters_applied:
 *                       type: object
 *                       example: { "max_difficulty": 4.0, "min_reviews": 2 }
 *                 message:
 *                   type: string
 *                   example: "Easy courses with reliable difficulty ratings"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/easy', (req, res) => courseController.getEasyCourses(req, res));

/**
 * @swagger
 * /api/v1/courses/{courseCode}:
 *   get:
 *     summary: Get detailed course information
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code (e.g., AHS007)
 *         example: "AHS007"
 *     responses:
 *       200:
 *         description: Course details with reviews and professors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Course'
 *                     - type: object
 *                       properties:
 *                         recent_reviews:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CourseReview'
 *                         professors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Professor'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       400:
 *         description: Invalid course code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:courseCode', (req, res) => courseController.getCourseDetails(req, res));

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Get all available courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: Number of results to return (max 200)
 *         example: 20
 *     responses:
 *       200:
 *         description: List of all courses sorted by review count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     total_results:
 *                       type: number
 *                     filters_applied:
 *                       type: object
 *                       example: {}
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', (req, res) => courseController.getAllCourses(req, res));

/**
 * @swagger
 * /api/v1/courses/{courseCode}/enhanced:
 *   get:
 *     summary: Get enhanced course information with comprehensive professor data
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code (e.g., AHS007)
 *         example: "AHS007"
 *     responses:
 *       200:
 *         description: Enhanced course details with RateMyProfessor + Reddit professor data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Course'
 *                     - type: object
 *                       properties:
 *                         recent_reviews:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CourseReview'
 *                         professors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/EnhancedProfessor'
 *                 message:
 *                   type: string
 *                   example: "Enhanced course details with comprehensive professor data"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       400:
 *         description: Invalid course code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:courseCode/enhanced', (req, res) => courseController.getEnhancedCourseDetails(req, res));

export default router;