const express = require('express');
const router = express.Router();
const {
    initializeDatabase,
    listTransactions,
    getStatistics,
    getPriceRangeData,
    getCategoryData,
    getCombinedData
} = require('../controllers/transactionController');

router.get('/initialize', initializeDatabase);
router.get('/transactions', listTransactions);
router.get('/statistics', getStatistics);
router.get('/bar-chart', getPriceRangeData);
router.get('/pie-chart', getCategoryData);
router.get('/combined', getCombinedData);

module.exports = router;
