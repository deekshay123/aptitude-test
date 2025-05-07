require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Suppress logs if SUPPRESS_LOGS env variable is set to true, except for MongoDB connection success messages
if (process.env.SUPPRESS_LOGS === 'true') {
  const originalLog = console.log;
  const originalError = console.error;

  console.log = function (message, ...optionalParams) {
    if (typeof message === 'string' && (
      message.includes('Successfully connected to MongoDB') || 
      message.includes('Database:') || 
      message.includes('Server running on port') || 
      message.includes('API Base URL')
    )) {
      originalLog.call(console, message, ...optionalParams);
    }
    // else suppress
  };

  console.error = function (...args) {
    originalError.call(console, ...args);
  };
}

// Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.use(express.static('public')); // Serve static files from public directory

// Connect to MongoDB with enhanced logging
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Question Model
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);

// TestTaker Model
const testTakerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  education: { type: String, required: true },
  field_of_study: { type: String, required: true },
  institution: { type: String, required: true },
  certifications: { type: String },  // Added certifications field
  other_info: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const TestTaker = mongoose.model('TestTaker', testTakerSchema);

const testSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  answers: { type: Object, required: true }, // Store answers as an object
  timeTaken: { type: String, required: true },
  questionsSnapshot: { type: Array, required: true }, // Store snapshot of questions at submission time
  createdAt: { type: Date, default: Date.now }
});

const TestSubmission = mongoose.model('TestSubmission', testSubmissionSchema);

app.post('/api/testsubmissions', async (req, res) => {
  try {
    const { name, answers, timeTaken, questionsSnapshot } = req.body;

    if (!name || !answers || !timeTaken || !questionsSnapshot) {
      throw new Error('Missing required fields');
    }

    const testSubmission = new TestSubmission({ name, answers, timeTaken, questionsSnapshot });
    await testSubmission.save();

    res.status(201).json(testSubmission);
  } catch (err) {
    console.error('❌ Test submission creation failed:', err);
    res.status(400).json({
      error: err.message,
      details: 'Required fields: name, answers, timeTaken, questionsSnapshot'
    });
  }
});

// API endpoint to get all test submissions
app.get('/api/testsubmissions', async (req, res) => {
  try {
    const testSubmissions = await TestSubmission.find().sort({ createdAt: -1 });
    res.json(testSubmissions);
  } catch (err) {
    console.error('❌ Failed to fetch test submissions:', err);
    res.status(500).json({ error: 'Failed to fetch test submissions' });
  }
});

// New DELETE API endpoint to delete a test submission by ID
app.delete('/api/testsubmissions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const testSubmission = await TestSubmission.findByIdAndDelete(id);
    if (!testSubmission) {
      throw new Error('Test submission not found');
    }

    res.json({ message: 'Test submission deleted successfully' });
  } catch (err) {
    console.error(`❌ Failed to delete test submission: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// API endpoint to create a new question
app.post('/api/questions', async (req, res) => {
  try {
    const { questionText, options, correctAnswer } = req.body;

    if (!questionText || !options || !correctAnswer) {
      throw new Error('Missing required fields: questionText, options, correctAnswer');
    }

    const question = new Question({ questionText, options, correctAnswer });
    await question.save();

    res.status(201).json(question);
  } catch (err) {
    console.error('❌ Failed to create question:', err);
    res.status(400).json({ error: err.message });
  }
});

// New API endpoint to save test taker data
app.post('/api/testtakers', async (req, res) => {
  try {
    const { name, education, field_of_study, institution, certifications, other_info } = req.body;
    
    if (!name || !education || !field_of_study || !institution) {
      throw new Error('Missing required fields');
    }

    const testTaker = new TestTaker({ name, education, field_of_study, institution, certifications, other_info });
    await testTaker.save();
    
    res.status(201).json(testTaker);
  } catch (err) {
    console.error('❌ Test taker creation failed:', err);
    res.status(400).json({ 
      error: err.message,
      details: 'Required fields: name, education, field_of_study, institution'
    });
  }
});

// New API endpoint to get all test takers
app.get('/api/testtakers', async (req, res) => {
  try {
    const testTakers = await TestTaker.find().sort({ createdAt: -1 });
    res.json(testTakers);
  } catch (err) {
    console.error('❌ Failed to fetch test takers:', err);
    res.status(500).json({ error: 'Failed to fetch test takers' });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    console.error('❌ Failed to fetch questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, options, correctAnswer } = req.body;
    
    const question = await Question.findByIdAndUpdate(
      id,
      { questionText, options, correctAnswer },
      { new: true }
    );
    
    if (!question) {
      throw new Error('Question not found');
    }
    
    res.json(question);
  } catch (err) {
    console.error(`❌ Failed to update question: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      throw new Error('Question not found');
    }
    
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(`❌ Failed to delete question: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/testtakers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const testTaker = await TestTaker.findByIdAndDelete(id);
    if (!testTaker) {
      throw new Error('Test taker not found');
    }

    res.json({ message: 'Test taker deleted successfully' });
  } catch (err) {
    console.error(`❌ Failed to delete test taker: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});

// Add test route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Start server with enhanced logging
const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
});
