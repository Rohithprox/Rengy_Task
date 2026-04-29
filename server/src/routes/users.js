const router = require('express').Router();
const User = require('../models/User');
const TeamMembership = require('../models/TeamMembership');
const authenticate = require('../middleware/auth');

// GET /api/users?search=<name_or_email>
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const re = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const users = await User.find(filter).select('-__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users  — admin creates a user + optional immediate team membership
// Body: { name, email, password, teamId?, roleId? }
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, password, teamId, roleId } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email and password are required' });

    if ((teamId && !roleId) || (!teamId && roleId))
      return res.status(400).json({ message: 'Provide both teamId and roleId together, or neither' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });

    let membership = null;
    if (teamId && roleId) {
      membership = await TeamMembership.create({ user: user._id, team: teamId, role: roleId });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      membership: membership
        ? { _id: membership._id, team: teamId, role: roleId }
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/memberships  — all teams + roles for a user
router.get('/:id/memberships', async (req, res) => {
  try {
    const memberships = await TeamMembership.find({ user: req.params.id })
      .populate('team', 'name')
      .populate({ path: 'role', populate: { path: 'permissions', select: 'name description' } })
      .select('-__v');
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
