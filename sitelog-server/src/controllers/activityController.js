import SiteLog from '../models/SiteLog.js';
import Expense from '../models/Expense.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Material from '../models/Material.js';
import Equipment from '../models/Equipment.js';

/**
 * GET /api/v1/activity
 * Aggregates recent activity across all models into a unified timeline feed.
 */
export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's projects
    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { 'team.user': userId },
      ],
    }).select('_id name').lean();

    const projectIds = projects.map((p) => p._id);
    const projectMap = {};
    projects.forEach((p) => { projectMap[p._id.toString()] = p.name; });

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Fetch recent site logs
    const logs = await SiteLog.find({
      project: { $in: projectIds },
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'name')
      .lean();

    // Fetch recent expenses
    const expenses = await Expense.find({
      project: { $in: projectIds },
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('addedBy', 'name')
      .lean();

    // Fetch recent materials
    const materials = await Material.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category createdAt')
      .lean();

    // Fetch recent equipment
    const equipment = await Equipment.find({
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type createdAt')
      .lean();

    // Build unified activity feed
    const activities = [];

    logs.forEach((log) => {
      activities.push({
        id: log._id,
        type: 'daily_log',
        title: 'Daily Log Added',
        description: log.activities ? log.activities.substring(0, 100) : 'Site log recorded',
        projectName: projectMap[log.project?.toString()] || 'Unknown',
        projectId: log.project,
        user: log.createdBy?.name || 'System',
        timestamp: log.createdAt,
        icon: 'clipboard',
      });
    });

    expenses.forEach((exp) => {
      activities.push({
        id: exp._id,
        type: 'expense',
        title: 'Expense Recorded',
        description: `₹${exp.amount?.toLocaleString('en-IN')} — ${exp.description || exp.category || 'Expense'}`,
        projectName: projectMap[exp.project?.toString()] || 'Unknown',
        projectId: exp.project,
        user: exp.addedBy?.name || 'System',
        timestamp: exp.createdAt,
        icon: 'receipt',
      });
    });

    materials.forEach((m) => {
      activities.push({
        id: m._id,
        type: 'material',
        title: 'Material Added',
        description: `${m.name} (${m.category || 'General'})`,
        user: 'System',
        timestamp: m.createdAt,
        icon: 'package',
      });
    });

    equipment.forEach((eq) => {
      activities.push({
        id: eq._id,
        type: 'equipment',
        title: 'Equipment Registered',
        description: `${eq.name} — ${eq.type || 'Equipment'}`,
        user: 'System',
        timestamp: eq.createdAt,
        icon: 'wrench',
      });
    });

    // Sort by timestamp descending and take top 15
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: activities.slice(0, 15),
    });
  } catch (err) {
    console.error('[Activity] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch activity feed' });
  }
};
