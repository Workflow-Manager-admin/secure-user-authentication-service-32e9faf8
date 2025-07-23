const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB database
   */
  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-db';
      
      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: mongoose.connection.readyState === 1,
      state: mongoose.connection.states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

module.exports = new Database();
