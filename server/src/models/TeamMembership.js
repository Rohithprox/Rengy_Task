const mongoose = require('mongoose');

// A user can hold a different role in each team.
const teamMembershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  },
  { timestamps: true }
);

// Enforce one role per user-team pair
teamMembershipSchema.index({ user: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('TeamMembership', teamMembershipSchema);
