const express = require('express');
const News = require('../models/News.js');
// Note: These middleware files may need to be converted to CommonJS as well
// const { verifyToken, verifyHR } = require('../middleware/auth.js');

const router = express.Router();

// Post a news item (HR only)
// router.post('/news', verifyToken, verifyHR, async (req, res) => {
//   try {
//     const news = new News({
//       title: req.body.title,
//       content: req.body.content,
//       createdBy: req.user.id,
//     });
//     const savedNews = await news.save();
//     res.status(201).json(savedNews);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Get all news (for all users)
// router.get('/news', verifyToken, async (req, res) => {
//   try {
//     const news = await News.find().sort({ createdAt: -1 });
//     res.status(200).json(news);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;