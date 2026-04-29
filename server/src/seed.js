require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const User = require('./models/User');
const Team = require('./models/Team');
const TeamMembership = require('./models/TeamMembership');

const DEFAULT_PERMISSIONS = [
  { name: 'CREATE_TASK', description: 'Can create new tasks' },
  { name: 'EDIT_TASK', description: 'Can edit existing tasks' },
  { name: 'DELETE_TASK', description: 'Can delete tasks' },
  { name: 'VIEW_ONLY', description: 'Can only view tasks, no modifications' },
];

const DEFAULT_ROLES = [
  { name: 'Admin', permissions: ['CREATE_TASK', 'EDIT_TASK', 'DELETE_TASK', 'VIEW_ONLY'] },
  { name: 'Editor', permissions: ['CREATE_TASK', 'EDIT_TASK', 'VIEW_ONLY'] },
  { name: 'Viewer', permissions: ['VIEW_ONLY'] },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Permissions
  const permMap = {};
  for (const p of DEFAULT_PERMISSIONS) {
    const doc = await Permission.findOneAndUpdate(
      { name: p.name },
      p,
      { upsert: true, new: true }
    );
    permMap[p.name] = doc._id;
  }
  console.log('Permissions seeded:', Object.keys(permMap));

  // Roles
  const roleMap = {};
  for (const r of DEFAULT_ROLES) {
    const permIds = r.permissions.map((n) => permMap[n]);
    const doc = await Role.findOneAndUpdate(
      { name: r.name },
      { name: r.name, permissions: permIds },
      { upsert: true, new: true }
    );
    roleMap[r.name] = doc._id;
  }
  console.log('Roles seeded:', Object.keys(roleMap));

  // Demo users
  const users = [
    { name: 'Alice Admin', email: 'alice@demo.com', password: 'password123' },
    { name: 'Bob Editor', email: 'bob@demo.com', password: 'password123' },
    { name: 'Carol Viewer', email: 'carol@demo.com', password: 'password123' },
  ];
  const userMap = {};
  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      userMap[u.name] = existing._id;
    } else {
      const doc = await User.create(u);
      userMap[u.name] = doc._id;
    }
  }
  console.log('Demo users seeded:', Object.keys(userMap));

  // Demo teams
  const teams = [
    { name: 'Engineering', description: 'Core engineering team' },
    { name: 'Design', description: 'UI/UX design team' },
  ];
  const teamMap = {};
  for (const t of teams) {
    const doc = await Team.findOneAndUpdate(
      { name: t.name },
      t,
      { upsert: true, new: true }
    );
    teamMap[t.name] = doc._id;
  }
  console.log('Demo teams seeded:', Object.keys(teamMap));

  // Demo memberships
  const memberships = [
    { user: userMap['Alice Admin'], team: teamMap['Engineering'], role: roleMap['Admin'] },
    { user: userMap['Bob Editor'], team: teamMap['Engineering'], role: roleMap['Editor'] },
    { user: userMap['Carol Viewer'], team: teamMap['Engineering'], role: roleMap['Viewer'] },
    { user: userMap['Alice Admin'], team: teamMap['Design'], role: roleMap['Viewer'] },
    { user: userMap['Bob Editor'], team: teamMap['Design'], role: roleMap['Admin'] },
  ];
  for (const m of memberships) {
    await TeamMembership.findOneAndUpdate(
      { user: m.user, team: m.team },
      m,
      { upsert: true, new: true }
    );
  }
  console.log('Demo memberships seeded');

  console.log('\nSeed complete! Demo credentials: alice@demo.com / password123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
