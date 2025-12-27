const express = require('express');
const router = express.Router();
const Uniform = require('../models/uniform');
const uniformController = require('../controllers/uniforms')
const upload = require('../middleware/upload')

// GET all uniforms for a SPECIFIC School
// Example usage: /api/uniforms/64f8a... (school ID)
router.get('/', uniformController.uniform_list);

router.post('/', upload.single('uniformImage'), uniformController.createUniform);

router.get('/school/:schoolId', uniformController.listUniformsBySchool);

router.get('/:id', uniformController.getUniformById);

router.patch('/:id', upload.single('image'), uniformController.updateUniform);

router.delete('/:id', uniformController.deleteUniform);

module.exports = router;