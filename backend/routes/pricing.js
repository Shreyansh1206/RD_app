const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricing');

router.get('/', pricingController.pricingList);

router.get('/:pricingId', pricingController.getPricingById);

router.get('/uniform/:uniformId', pricingController.getPricingByUniform)

router.post('/', pricingController.createPricing)

router.patch('/:pricingId', pricingController.updatePricing)

router.delete('/:pricingId', pricingController.deletePricing)

module.exports = router;