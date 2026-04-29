const router = require('express').Router();
const Permission = require('../models/Permission');
const authenticate = require('../middleware/auth');

// GET /api/permissions
router.get('/', async (_req, res) => {
  try {
    const perms = await Permission.find().select('-__v');
    res.json(perms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/permissions
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const perm = await Permission.create({ name, description });
    res.status(201).json(perm);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Permission already exists' });
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
