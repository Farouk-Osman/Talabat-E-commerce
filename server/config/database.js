const mongoose = require('mongoose');
const config = require('./env');

const dbConnection = () => {
  mongoose
    .connect(config.dbUri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) =>
      console.error('MongoDB connection error:', err.name, err.message)
    );
};

module.exports = dbConnection;
