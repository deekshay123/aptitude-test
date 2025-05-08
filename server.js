// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your real MongoDB URI
const mongoURI = 'mongodb+srv://gowdadeechu7:XofuaejvuDIjAOAJ@cluster0.rui7pj3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

const DataSchema = new mongoose.Schema({ name: String });
const Data = mongoose.model('Data', DataSchema);

// Simple API route
app.get('/api/data', async (req, res) => {
  const allData = await Data.find();
  res.json(allData);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server started on port ${PORT}'));