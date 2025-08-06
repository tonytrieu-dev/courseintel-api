"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProfessorController_1 = require("../controllers/ProfessorController");
const router = (0, express_1.Router)();
const professorController = new ProfessorController_1.ProfessorController();
router.get('/search', (req, res) => professorController.searchProfessors(req, res));
router.get('/:name', (req, res) => professorController.getProfessorDetails(req, res));
router.get('/:name/analytics', (req, res) => professorController.getProfessorAnalytics(req, res));
router.get('/health', (req, res) => professorController.healthCheck(req, res));
exports.default = router;
//# sourceMappingURL=professors.js.map