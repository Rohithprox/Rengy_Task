const router = require('express').Router();
const Team = require('../models/Team');
const authenticate = require('../middleware/auth');

// GET /api/teams
router.get('/', async (_req, res) => {
  try {
    const teams = await Team.find().populate('createdBy', 'name email').select('-__v');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teams
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Team name is required' });
    const team = await Team.create({ name, description, createdBy: req.user.id });
    res.status(201).json(team);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Team name already exists' });
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('createdBy', 'name email');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/teams/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
