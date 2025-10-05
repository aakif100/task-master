const Task = require('../models/taskModel');
const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    // Keep original filename but make it unique with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
}).single('taskFile');

// Create new task
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      deadline
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const checkDeadline = async (task) => {
  const currentTime = new Date();
  if (new Date(task.deadline) < currentTime && task.status === 'pending') {
    task.status = 'not-submitted';
    await task.save();
  }
  return task;
};

// Get all tasks with deadline check
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');

    const updatedTasks = await Promise.all(tasks.map(checkDeadline));
    res.json(updatedTasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get employee tasks
const getEmployeeTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('assignedBy', 'name')
      .populate('comments.user', 'name');

    const updatedTasks = await Promise.all(tasks.map(checkDeadline));
    res.json(updatedTasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task status with file
const updateTaskStatus = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file' });
    }

    try {
      const { status, comment } = req.body;
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if submission is after deadline
      if (status === 'submitted' && new Date(task.deadline) < new Date() && task.status !== 'returned') {
        return res.status(400).json({ 
          message: 'Cannot submit task after deadline. Please contact admin for deadline extension.'
        });
      }

      task.status = status;
      
      // Add comment if provided
      if (comment) {
        task.comments.push({
          text: comment,
          user: req.user.id,
          createdAt: new Date()
        });
      }

      // Handle file upload for submissions
      if (req.file) {
        task.submissionFile = {
          filename: req.file.filename,
          path: req.file.path,
          originalName: req.file.originalname,
          uploadedAt: new Date()
        };
      }

      const updatedTask = await task.save();
      // Populate the response
      await updatedTask.populate('comments.user', 'name');
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.deadline = deadline || task.deadline;
    
    // If deadline is updated, reset status if it was 'deadline-exceeded'
    if (deadline && task.status === 'deadline-exceeded') {
      task.status = 'pending';
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete task (admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all employees (for admin to assign tasks)
const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add new endpoint to get file
const getTaskFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.submissionFile) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set proper Content-Type header based on file extension
    const ext = path.extname(task.submissionFile.originalName).toLowerCase();
    const contentType = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    }[ext] || 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${task.submissionFile.originalName}"`
    });

    res.sendFile(path.resolve(task.submissionFile.path));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getEmployeeTasks,
  updateTaskStatus,
  deleteTask,
  getAllEmployees,
  updateTask,
  getTaskFile
};