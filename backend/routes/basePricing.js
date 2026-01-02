const express = require('express');
const router = express.Router();
const basePricingController = require('../controllers/basePricing');

router.get('/', basePricingController.basePricingList);

router.get('/:basePricingId', basePricingController.getBasePricingById);

router.get('/category/:categoryName', basePricingController.getBasePricingByCategory);

router.post('/', basePricingController.createBasePricing);

router.patch('/:basePricingId', basePricingController.updateBasePricing);

router.delete('/:basePricingId/detached', basePricingController.deleteBasePricingDetached);

router.delete('/:basePricingId/cascade', basePricingController.deleteBasePricingCascade);

module.exports = router;