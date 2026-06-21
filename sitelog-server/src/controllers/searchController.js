import catchAsync from '../utils/catchAsync.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Material from '../models/Material.js';
import Equipment from '../models/Equipment.js';
import Expense from '../models/Expense.js';
import SiteLog from '../models/SiteLog.js';
import mongoose from 'mongoose';

export const globalSearch = catchAsync(async (req, res) => {
  const { q } = req.query;
  const user = req.user;

  if (!q || q.trim() === '') {
    return res.json({
      success: true,
      data: {
        projects: [],
        team: [],
        vendors: [],
        materials: [],
        equipment: [],
        expenses: [],
        logs: []
      }
    });
  }

  const queryRegex = new RegExp(q.trim(), 'i');

  // Determine Project Visibility
  const isGlobalManager = ['SuperAdmin', 'admin', 'owner', 'Owner'].includes(user.role);
  const projectFilter = { isDeleted: false, organisation: user.organisation };
  if (!isGlobalManager) {
    projectFilter['team.user'] = user._id;
  }

  const visibleProjects = await Project.find(projectFilter).select('_id').lean();
  const visibleProjectIds = visibleProjects.map(p => p._id);

  // Parallel Searches
  const [
    projects,
    team,
    vendors,
    materials,
    equipment,
    expenses,
    logs
  ] = await Promise.all([
    // Projects
    Project.find({
      _id: { $in: visibleProjectIds },
      $or: [
        { name: queryRegex },
        { location: queryRegex },
        { description: queryRegex }
      ]
    }).select('name location status').limit(5).lean(),

    // Team Members
    User.find({
      organisation: user.organisation,
      isActive: true,
      $or: [
        { name: queryRegex },
        { email: queryRegex },
        { role: queryRegex }
      ]
    }).select('name email role').limit(5).lean(),

    // Vendors
    Vendor.find({
      organisation: user.organisation,
      $or: [
        { name: queryRegex },
        { category: queryRegex }
      ]
    }).select('name category contact').limit(5).lean(),

    // Materials
    Material.find({
      organisation: user.organisation,
      $or: [
        { name: queryRegex },
        { category: queryRegex }
      ]
    }).select('name category quantity unit').limit(5).lean(),

    // Equipment
    Equipment.find({
      organisation: user.organisation,
      $or: [
        { name: queryRegex },
        { type: queryRegex }
      ]
    }).select('name type status').limit(5).lean(),

    // Expenses (restricted to visible projects)
    Expense.find({
      project: { $in: visibleProjectIds },
      $or: [
        { vendor: queryRegex },
        { description: queryRegex },
        { category: queryRegex }
      ]
    }).select('vendor description amount project').populate('project', 'name').limit(5).lean(),

    // Logs (restricted to visible projects)
    SiteLog.find({
      project: { $in: visibleProjectIds },
      $or: [
        { activities: queryRegex },
        { remarks: queryRegex }
      ]
    }).select('date activities project').populate('project', 'name').limit(5).lean()
  ]);

  res.json({
    success: true,
    data: {
      projects,
      team,
      vendors,
      materials,
      equipment,
      expenses,
      logs
    }
  });
});
