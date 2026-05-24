const express = require('express');
const router = express.Router();
const crosswordController = require('../controllers/crossword.controller');

router.post('/generate', crosswordController.generateCrossword); 
router.get('/layout', crosswordController.getCrosswordLayout); 
router.post('/validate', crosswordController.validateWord); 

module.exports = router;