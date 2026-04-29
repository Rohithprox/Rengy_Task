const router = require('express').Router();
const TeamMembership = require('../models/TeamMembership');
const authenticate = require('../middleware/auth');

// GET /api/memberships?team=<id>   — members of a team
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.team) filter.team = req.query.team;
    if (req.query.user) filter.user = req.query.user;

    const memberships = await TeamMembership.find(filter)
      .populate('user', 'name email')
      .populate('team', 'name')
      .populate({ path: 'role', populate: { path: 'permissions', select: 'name description' } })
      .select('-__v');
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/memberships  — add user to team with a role
// { user, team, role }
router.post('/', authenticate, async (req, res) => {
  try {
    const { user, team, role } = req.body;
    if (!user || !team || !role)
      return res.status(400).json({ message: 'user, team and role are required' });

    const membership = await TeamMembership.create({ user, team, role });
    await membership.populate([
      { path: 'user', select: 'name email' },
      { path: 'team', select: 'name' },
      { path: 'role', populate: { path: 'permissions', select: 'name description' } },
    ]);
    res.status(201).json(membership);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'User already has a role in this team' });
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/memberships/:id  — change role
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const membership = await TeamMembership.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).populate([
      { path: 'user', select: 'name email' },
      { path: 'team', select: 'name' },
      { path: 'role', populate: { path: 'permissions', select: 'name description' } },
    ]);
    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    res.json(membership);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/memberships/:id  — remove user from team
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const membership = await TeamMembership.findByIdAndDelete(req.params.id);
    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/memberships/user/:userId/team/:teamId/permissions
// — get a user's effective permissions in a specific team
router.get('/user/:userId/team/:teamId/permissions', async (req, res) => {
  try {
    const membership = await TeamMembership.findOne({
      user: req.params.userId,
      team: req.params.teamId,
    }).populate({ path: 'role', populate: { path: 'permissions', select: 'name description' } });

    if (!membership)
      return res.status(404).json({ message: 'User is not a member of this team' });

    res.json({
      role: membership.role.name,
      permissions: membership.role.permissions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
