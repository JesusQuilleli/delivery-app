const express = require('express');
const router = express.Router();
const { getBcvRateHandler } = require('../controllers/ratesController');

router.get('/bcv', getBcvRateHandler);

module.exports = router;
