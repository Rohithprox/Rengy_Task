const router = require('express').Router();
const Role = require('../models/Role');
const authenticate = require('../middleware/auth');

// GET /api/roles
router.get('/', async (_req, res) => {
  try {
    const roles = await Role.find().populate('permissions', 'name description').select('-__v');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/roles  — { name, permissions: [permissionId, ...] }
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, permissions = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Role name is required' });
    const role = await Role.create({ name, permissions });
    await role.populate('permissions', 'name description');
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Role already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/roles/:id/permissions  — assign/replace permissions
router.patch('/:id/permissions', authenticate, async (req, res) => {
  try {
    const { permissions } = req.body; // array of permission IDs
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true }
    ).populate('permissions', 'name description');
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
