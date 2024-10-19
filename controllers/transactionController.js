const axios = require('axios');
const Transaction = require('../models/Transection');

// Function to fetch and seed database with third-party data
const initializeDatabase = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Transaction.deleteMany(); // Clear existing data

        // Filter out invalid data before inserting into the database
        const validData = response.data.filter(item => !isNaN(parseFloat(item.price)));

        // Insert only valid transactions into the database
        await Transaction.insertMany(validData);

        res.status(200).json({ message: 'Database initialized with seed data successfully' });
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).json({ error: 'Error initializing database' });
    }
};


const listTransactions = async (req, res) => {
    const { search = '', page = 1, perPage = 10 } = req.query;
    let query = {};

    if (search) {
        query = {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: isNaN(search) ? undefined : parseFloat(search) } // Ensure price is a number
            ]
        };
    }

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Error fetching transactions' });
    }
};


// API for statistics
const getStatistics = async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(`${month}-31`);
    const soldItems = await Transaction.countDocuments({ sold: true, dateOfSale: { $gte: startDate, $lte: endDate } });
    const notSoldItems = await Transaction.countDocuments({ sold: false, dateOfSale: { $gte: startDate, $lte: endDate } });
    const totalSaleAmount = await Transaction.aggregate([
        { $match: { sold: true, dateOfSale: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalAmount: { $sum: '$price' } } }
    ]);
    res.json({ totalSaleAmount: totalSaleAmount[0]?.totalAmount || 0, soldItems, notSoldItems });
};

// API for bar chart
const getPriceRangeData = async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(`${month}-31`);
    const priceRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '101-200', min: 101, max: 200 },
        { range: '201-300', min: 201, max: 300 },
        { range: '301-400', min: 301, max: 400 },
        { range: '401-500', min: 401, max: 500 },
        { range: '501-600', min: 501, max: 600 },
        { range: '601-700', min: 601, max: 700 },
        { range: '701-800', min: 701, max: 800 },
        { range: '801-900', min: 801, max: 900 },
        { range: '901-above', min: 901, max: Infinity }
    ];

    const results = await Promise.all(priceRanges.map(async ({ range, min, max }) => {
        const count = await Transaction.countDocuments({ price: { $gte: min, $lt: max }, dateOfSale: { $gte: startDate, $lte: endDate } });
        return { range, count };
    }));

    res.json(results);
};

// API for pie chart
const getCategoryData = async (req, res) => {
    const { month } = req.query;
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(`${month}-31`);
    const categories = await Transaction.aggregate([
        { $match: { dateOfSale: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json(categories);
};

// Combined API
const getCombinedData = async (req, res) => {
    try {
        const [statistics, barChartData, pieChartData] = await Promise.all([
            getStatistics(req, res),
            getPriceRangeData(req, res),
            getCategoryData(req, res)
        ]);

        res.json({ statistics, barChartData, pieChartData });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching combined data' });
    }
};

module.exports = {
    initializeDatabase,
    listTransactions,
    getStatistics,
    getPriceRangeData,
    getCategoryData,
    getCombinedData
};
