const express = require('express');
const router = express.Router();
const School = require('../models/school');
const schoolController = require('../controllers/schools')
const upload = require('../middleware/upload');

// GET all schools (For your dropdown list)
router.get('/', schoolController.school_list);

// GET one school (To show the specific banner image)
router.get('/:schoolId', schoolController.getSchoolById);

router.post('/', upload.single('bannerImage'), schoolController.createSchool);

router.patch('/:schoolId', upload.single('bannerImage'), schoolController.updateSchool);

router.delete('/:schoolId', schoolController.deleteSchool);

// POST a new school (For Admin/Setup)

module.exports = router;