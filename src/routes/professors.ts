import { Router } from 'express';
import { ProfessorController } from '../controllers/ProfessorController';

const router = Router();
const professorController = new ProfessorController();

/**
 * @swagger
 * components:
 *   schemas:
 *     EnhancedProfessor:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Charles Peterson"
 *         first_name:
 *           type: string
 *           example: "Charles"
 *         last_name:
 *           type: string
 *           example: "Peterson"
 *         department:
 *           type: string
 *           example: "AHS"
 *         school:
 *           type: string
 *           example: "University of California, Riverside"
 *         courses_taught:
 *           type: array
 *           items:
 *             type: string
 *           example: ["AHS007", "AHS008"]
 *         average_difficulty:
 *           type: number
 *           example: 2.5
 *           description: "UCR course difficulty (1-10 scale)"
 *         total_reviews:
 *           type: number
 *           example: 15
 *           description: "Number of UCR course reviews"
 *         rmp_rating:
 *           type: number
 *           example: 4.2
 *           description: "RateMyProfessor rating (1-5 scale)"
 *         rmp_difficulty:
 *           type: number
 *           example: 2.8
 *           description: "RateMyProfessor difficulty (1-5 scale)"
 *         rmp_num_ratings:
 *           type: number
 *           example: 47
 *           description: "Number of RateMyProfessor reviews"
 *         would_take_again:
 *           type: number
 *           nullable: true
 *           example: 0.85
 *           description: "Percentage who would take again (0-1)"
 *         rmp_tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Amazing lectures", "Clear grading criteria"]
 *         reddit_sentiment:
 *           type: object
 *           nullable: true
 *           properties:
 *             score:
 *               type: number
 *               example: 0.3
 *               description: "Sentiment score (-1 to 1)"
 *             confidence:
 *               type: number
 *               example: 0.75
 *               description: "Confidence in sentiment (0-1)"
 *             mention_count:
 *               type: number
 *               example: 8
 *             positive_mentions:
 *               type: number
 *               example: 5
 *             negative_mentions:
 *               type: number
 *               example: 3
 *             recent_mentions:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   subreddit:
 *                     type: string
 *                   score:
 *                     type: number
 *                   date:
 *                     type: string
 *         data_quality:
 *           type: string
 *           enum: ["high", "medium", "low"]
 *           example: "high"
 *         data_sources:
 *           type: array
 *           items:
 *             type: string
 *           example: ["UCR Course Reviews", "RateMyProfessor", "Reddit Sentiment Analysis"]
 *         combined_rating:
 *           type: number
 *           example: 4.1
 *           description: "Weighted combination of all ratings (1-5 scale)"
 *         recommendation_score:
 *           type: number
 *           example: 87
 *           description: "Overall recommendation score (0-100)"
 *         teaching_style_summary:
 *           type: string
 *           example: "Engaging lectures, Clear grading criteria, Easy grading"
 *         pros:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Highly rated on RateMyProfessor", "Students would take again", "Engaging teaching style"]
 *         cons:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Attendance required", "Regular assessments"]
 *         latest_review_date:
 *           type: string
 *           format: date-time
 *         last_updated:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/professors/search:
 *   get:
 *     summary: Search professors across multiple universities
 *     tags: [Professors]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Professor name search query
 *         example: "Peterson"
 *       - in: query
 *         name: school
 *         schema:
 *           type: string
 *         description: Filter by school/university
 *         example: "University of California, Riverside"
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department code
 *         example: "AHS"
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: number
 *         description: Minimum combined rating (1-5)
 *         example: 3.5
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of results to return (max 50)
 *         example: 5
 *     responses:
 *       200:
 *         description: Successful professor search
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
 *                     professors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/EnhancedProfessor'
 *                     total_results:
 *                       type: number
 *                       example: 12
 *                     filters_applied:
 *                       type: object
 *                       example: { "query": "Peterson", "school": "UCR", "min_rating": 3.5 }
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing required search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/search', (req, res) => professorController.searchProfessors(req, res));

/**
 * @swagger
 * /api/v1/professors/health:
 *   get:
 *     summary: Check Enhanced Professor API health
 *     tags: [Professors]
 *     responses:
 *       200:
 *         description: Professor service health status
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
 *                     status:
 *                       type: string
 *                       enum: ["healthy", "degraded", "unavailable"]
 *                       example: "healthy"
 *                     response_time:
 *                       type: number
 *                       example: 125
 *                       description: "Response time in milliseconds"
 *                     cache_stats:
 *                       type: object
 *                       properties:
 *                         keys:
 *                           type: number
 *                         hits:
 *                           type: number
 *                         misses:
 *                           type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => professorController.healthCheck(req, res));

/**
 * @swagger
 * /api/v1/professors/{name}:
 *   get:
 *     summary: Get comprehensive professor information
 *     tags: [Professors]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Professor's full name
 *         example: "Charles Peterson"
 *     responses:
 *       200:
 *         description: Comprehensive professor data with RMP and Reddit integration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EnhancedProfessor'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Professor not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       400:
 *         description: Invalid professor name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:name', (req, res) => professorController.getProfessorDetails(req, res));

/**
 * @swagger
 * /api/v1/professors/{name}/analytics:
 *   get:
 *     summary: Get professor analytics and recommendations
 *     tags: [Professors]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Professor's full name
 *         example: "Charles Peterson"
 *     responses:
 *       200:
 *         description: Professor analytics and insights
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
 *                     recommendation_score:
 *                       type: number
 *                       example: 87
 *                     teaching_style_summary:
 *                       type: string
 *                       example: "Engaging, clear, and accessible teaching style"
 *                     pros:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Highly rated", "Clear explanations", "Extra credit offered"]
 *                     cons:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Attendance required", "Heavy workload"]
 *                     data_quality:
 *                       type: string
 *                       enum: ["high", "medium", "low"]
 *                       example: "high"
 *                     sources_used:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["RateMyProfessor", "Reddit", "UCR Reviews"]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Professor not found or analytics unavailable
 *       500:
 *         description: Analytics service error
 */
router.get('/:name/analytics', (req, res) => professorController.getProfessorAnalytics(req, res));

export default router;