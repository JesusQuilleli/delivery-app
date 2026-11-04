const express = require('express');
const router = express.Router();
const { autocompleteAddress, reverseAddress } = require('../controllers/geocodingController');
const { geocodeLimiter } = require('../middleware/rateLimiter');

router.get('/autocomplete', geocodeLimiter, autocompleteAddress);
router.get('/reverse', geocodeLimiter, reverseAddress);

module.exports = router;
