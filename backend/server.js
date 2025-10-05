const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config();

const app = express();

connectDB()
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((err) => {
    console.error('Database connection error:', err);
    process.exit(1);
  });


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/uploads', express.static('uploads'));



app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Task Master API' });
});



// this is the Routes , i did the routing structuring for more component based project
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test API at: http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- POST http://localhost:${PORT}/api/users/register`);
    console.log(`- POST http://localhost:${PORT}/api/users/login`);
  });
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}


// so its like this :
// first app.listen
// second app.use for "/" route and then setup mongodb
// third set route structuring
// 4th upload files setup
// 5th middlewares for these
// 6th error handler