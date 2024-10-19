const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return !isNaN(v);
            },
            message: props => `${props.value} is not a valid number!`
        }
    },
    dateOfSale: Date,
    category: String,
    sold: Boolean,
});

module.exports = mongoose.model('Transaction', transactionSchema);
