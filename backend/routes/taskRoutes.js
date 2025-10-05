const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getEmployeeTasks,
  updateTaskStatus,
  deleteTask,
  getAllEmployees,
  updateTask,
  getTaskFile
} = require('../controllers/taskController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.post('/', protect, admin, createTask);
router.get('/all', protect, admin, getAllTasks);
router.get('/employees', protect, admin, getAllEmployees);
router.put('/:id', protect, admin, updateTask);
router.delete('/:id', protect, admin, deleteTask);

// Employee routes
router.get('/employee', protect, getEmployeeTasks);
router.put('/:id/status', protect, updateTaskStatus);

// Add file download route
router.get('/:id/file', protect, getTaskFile);

module.exports = router;
