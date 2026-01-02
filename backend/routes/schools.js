const express = require('express');
const router = express.Router();
const School = require('../models/school');
const schoolController = require('../controllers/schools')
const upload = require('../middleware/upload');

// GET all schools (For your dropdown list)
router.get('/', schoolController.schoolList);

// GET one school (To show the specific banner image)
router.get('/:schoolId', schoolController.getSchoolById);

router.post('/', schoolController.createSchool);

router.patch('/:schoolId', schoolController.updateSchool);

router.delete('/:schoolId', schoolController.deleteSchool);

module.exports = router;