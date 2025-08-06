"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CourseController_1 = require("../controllers/CourseController");
const router = (0, express_1.Router)();
const courseController = new CourseController_1.CourseController();
router.get('/search', (req, res) => courseController.searchCourses(req, res));
router.get('/easy', (req, res) => courseController.getEasyCourses(req, res));
router.get('/:courseCode', (req, res) => courseController.getCourseDetails(req, res));
router.get('/', (req, res) => courseController.getAllCourses(req, res));
router.get('/:courseCode/enhanced', (req, res) => courseController.getEnhancedCourseDetails(req, res));
exports.default = router;
//# sourceMappingURL=courses.js.map