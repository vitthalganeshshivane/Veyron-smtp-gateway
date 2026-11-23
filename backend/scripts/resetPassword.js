import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Admin } from '../src/models/Admin.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3]?.trim();

if (!email || !newPassword) {
  console.error('Usage: node scripts/resetPassword.js <email> <newPassword>');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('Error: Password must be at least 8 characters long.');
  process.exit(1);
}

async function reset() {
  try {
    console.log(`Connecting to database to reset password for: ${email}...`);
    await connectDatabase();

    // 1. Check User model
    let account = await User.findOne({ email });
    let accountType = 'User';

    // 2. Fallback to Admin model
    if (!account) {
      account = await Admin.findOne({ email });
      accountType = 'Admin';
    }

    if (!account) {
      console.error(`Error: No account found with email "${email}".`);
      await disconnectDatabase();
      process.exit(1);
    }

    // Setting password and calling save() triggers Mongoose pre('save') bcrypt hashing
    account.password = newPassword;
    await account.save();

    console.log(`\n Successfully updated password for ${accountType} "${account.email}" (${account.name || 'Admin'}).`);
    console.log(`Password has been securely re-hashed with bcrypt (salt rounds: 10).\n`);

    await disconnectDatabase();
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset password:', err.message);
    process.exit(1);
  }
}

reset();
