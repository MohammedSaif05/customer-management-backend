const { User, EmployeeProfile } = require('../models');
const { getPagination, textSearchFilter, paginatedResponse } = require('../utils/pagination');
const { AppError } = require('../middlewares/errorHandler');
const { sendWelcomeEmail, sendPasswordAssignedEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

function tempPassword() {
  return crypto.randomBytes(6).toString('hex');
}

async function createUser(req, res, next) {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) throw new AppError('Email required', 400);
    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(
        existing.isActive
          ? 'Email already in use by an active account.'
          : 'Email already in use by a deactivated account. It cannot be reused.',
        409
      );
    }
    const pwd = req.body.password || tempPassword();
    const user = await User.create({
      name: req.body.name,
      email,
      password: pwd,
      role: req.body.role || 'EMPLOYEE',
      employeeId: req.body.employeeId,
      department: req.body.department,
      designation: req.body.designation,
    });
    const u = user.toObject();
    delete u.password;
    if (req.body.sendEmail) {
      try {
        await sendWelcomeEmail(user.email, user.name, pwd);
      } catch (e) {
        logger.error('Welcome email failed:', e.message);
      }
    }
    res.status(201).json({ success: true, data: u, initialPassword: pwd });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(req.user.role);
    if (req.user.role !== 'ADMIN' && req.user._id.toString() !== req.params.id) {
      throw new AppError('Insufficient permissions', 403);
    }
    if (req.body.email != null) {
      const newEmail = String(req.body.email).trim().toLowerCase();
      if (newEmail !== user.email) {
        const existing = await User.findOne({ email: newEmail });
        if (existing) {
          throw new AppError(
            existing.isActive
              ? 'Email already in use by another account.'
              : 'Email already in use by a deactivated account. It cannot be reused.',
            409
          );
        }
        user.email = newEmail;
      }
    }
    const allowed = ['name', 'employeeId', 'department', 'designation'];
    allowed.forEach((k) => {
      if (req.body[k] != null) user[k] = req.body[k];
    });
    if (isAdminOrManager && req.body.role != null) user.role = req.body.role;
    if (isAdminOrManager && typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
    await user.save();
    const u = user.toObject();
    delete u.password;
    res.status(200).json({ success: true, data: u });
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, data: { _id: user._id, isActive: false } });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) throw new AppError('User not found', 404);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = { isActive: req.query.active !== 'false' };
    Object.assign(filter, textSearchFilter(req.query, 'search', ['name', 'email', 'employeeId', 'department', 'designation']));
    if (req.query.role) filter.role = req.query.role;
    const [data, total] = await Promise.all([
      User.find(filter).select('-password').sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, ...paginatedResponse(data, total, page, limit) });
  } catch (err) {
    next(err);
  }
}

async function listEmployees(req, res, next) {
  try {
    const { page, limit, skip, sort } = getPagination(req.query);
    const filter = { isActive: true, role: 'EMPLOYEE' };
    Object.assign(filter, textSearchFilter(req.query, 'search', ['name', 'email', 'employeeId', 'department', 'designation']));
    const [data, total] = await Promise.all([
      User.find(filter).select('-password').sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, ...paginatedResponse(data, total, page, limit) });
  } catch (err) {
    next(err);
  }
}

async function setPassword(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) throw new AppError('User not found', 404);
    const newPassword = req.body.newPassword;
    if (!newPassword || String(newPassword).length < 6) {
      throw new AppError('newPassword required, at least 6 characters', 400);
    }
    user.password = newPassword;
    await user.save();
    const sendEmail = req.body.sendEmail === true;
    if (sendEmail) {
      try {
        await sendPasswordAssignedEmail(user.email, user.name, newPassword);
      } catch (e) {
        logger.error('Password-assigned email failed:', e.message);
      }
    }
    res.status(200).json({
      success: true,
      message: sendEmail ? 'Password set and email sent.' : 'Password set. Share it with the user manually.',
      newPassword: newPassword,
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const userId = req.params.userId || req.user._id.toString();
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user._id.toString() !== userId) {
      throw new AppError('Insufficient permissions', 403);
    }
    let profile = await EmployeeProfile.findOne({ user: userId }).populate('user', 'name email employeeId department designation');
    if (!profile) {
      profile = await EmployeeProfile.create({ user: userId });
      profile = await EmployeeProfile.findById(profile._id).populate('user', 'name email employeeId department designation');
    }
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.params.userId || req.user._id.toString();
    if (req.user._id.toString() !== userId && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    let profile = await EmployeeProfile.findOne({ user: userId });
    if (!profile) profile = await EmployeeProfile.create({ user: userId });
    const allowed = ['dateOfBirth', 'gender', 'phone', 'address', 'bloodGroup', 'maritalStatus', 'nationality', 'emergencyContacts', 'documents', 'skills', 'qualifications'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) profile[k] = req.body[k];
    });
    await profile.save();
    profile = await EmployeeProfile.findById(profile._id).populate('user', 'name email employeeId department designation');
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser, updateUser, deactivateUser, getUser, listUsers, listEmployees, setPassword, getProfile, updateProfile };
