import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { buildSystemPrompt, chat, continueWithToolResults, activeProvider } from '../services/llmService.js';
import { searchKnowledge } from '../services/ragService.js';
import Project from '../models/Project.js';
import SiteLog from '../models/SiteLog.js';
import Milestone from '../models/Milestone.js';
import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import Vendor from '../models/Vendor.js';
import Organisation from '../models/Organisation.js';
import User from '../models/User.js';
import Material from '../models/Material.js';
import Equipment from '../models/Equipment.js';

// ─────────────────────────────────────────────
// Conversation Store
// ─────────────────────────────────────────────
const conversationStore = new Map();
const MAX_HISTORY = 50; // Increased for better context retention

/**
 * GET /api/v1/plinthai/init
 * Bootstrap the chat session with user context.
 */
export const initSession = catchAsync(async (req, res) => {
  const user = req.user;

  const isGlobalManager = ['SuperAdmin', 'admin', 'owner', 'Owner'].includes(user.role);
  const projectFilter = { isDeleted: false, organisation: user.organisation };
  if (!isGlobalManager) {
    projectFilter['team.user'] = user._id;
  }

  const projects = await Project.find(projectFilter)
    .select('name status progress startDate endDate location totalBudget')
    .lean();

  const pendingNotifications = await Notification.countDocuments({
    recipient: user._id,
    isRead: false,
  });

  const context = {
    user: {
      first_name: user.name.split(' ')[0],
      name: user.name,
      role: user.role,
    },
    active_projects: projects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      status: p.status,
      progress: p.progress || 0,
    })),
    pending_notifications: pendingNotifications,
    llm_provider: activeProvider,
  };

  res.json({ success: true, data: context });
});

/**
 * POST /api/v1/plinthai/chat
 * Main conversational endpoint with multi-provider LLM support.
 */
export const chatHandler = catchAsync(async (req, res) => {
  const { session_id, message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new AppError('Message is required.', 400);
  }

  const user = req.user;
  const sessionKey = `${user._id}:${session_id || 'default'}`;

  // Load or create conversation history
  if (!conversationStore.has(sessionKey)) {
    conversationStore.set(sessionKey, []);
  }
  const history = conversationStore.get(sessionKey);

  const isGlobalManager = ['SuperAdmin', 'admin', 'owner', 'Owner'].includes(user.role);
  const projectFilter = { isDeleted: false, organisation: user.organisation };
  if (!isGlobalManager) {
    projectFilter['team.user'] = user._id;
  }

  // Get user projects for context
  const projects = await Project.find(projectFilter)
    .select('name status progress _id totalBudget startDate endDate location')
    .lean();

  const userContext = {
    name: user.name,
    role: user.role,
    userId: user._id.toString(),
    orgId: user.organisation?.toString(),
    projects: projects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      status: p.status,
      progress: p.progress || 0,
    })),
  };

  // Try LLM providers (Claude → Gemini)
  if (activeProvider !== 'fallback') {
    const systemPrompt = buildSystemPrompt(userContext);

    history.push({ role: 'user', content: message });
    while (history.length > MAX_HISTORY) history.shift();

    try {
      let response = await chat(systemPrompt, history);

      // Handle tool use loop
      let maxIterations = 8;
      while (response.stop_reason === 'tool_use' && maxIterations > 0) {
        maxIterations--;
        const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
        history.push({ role: 'assistant', content: response.content });

        const toolResults = [];
        for (const toolBlock of toolUseBlocks) {
          const result = await executeTool(toolBlock.name, toolBlock.input, user, projects);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            _toolName: toolBlock.name, // Needed for Gemini format conversion
            content: JSON.stringify(result),
          });
        }

        history.push({ role: 'user', content: toolResults });
        response = await continueWithToolResults(systemPrompt, history);
      }

      const textBlocks = response.content.filter((b) => b.type === 'text');
      const assistantMessage = textBlocks.map((b) => b.text).join('\n');

      history.push({ role: 'assistant', content: response.content });
      while (history.length > MAX_HISTORY) history.shift();

      return res.json({
        success: true,
        data: { message: assistantMessage, session_id: session_id || 'default', provider: activeProvider },
      });
    } catch (err) {
      console.error('[PlinthAI] LLM error, falling back to built-in mode:', err.message);
      // Remove the failed user message from history before fallback
      if (history.length > 0 && history[history.length - 1]?.content === message) {
        history.pop();
      }

      // If the error is an API key issue, tell the user directly instead of using offline mode
      if (err.message?.includes('API key not valid') || err.message?.includes('API_KEY_INVALID') || err.message?.includes('400')) {
        return res.json({
          success: true,
          data: {
            message: "⚠️ **API Key Error**\n\nMy Gemini API key is invalid, so I cannot process your request using AI. Google Gemini API keys usually start with `AIza`.\n\nPlease update your `.env` file with a valid `GEMINI_API_KEY` and restart the server to unlock my full AI capabilities!",
            session_id: session_id || 'default',
            provider: 'fallback'
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────
  // Built-in Fallback Mode
  // ─────────────────────────────────────────
  try {
    const assistantMessage = await generateFallbackResponse(message, user, projects, history);

    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: [{ type: 'text', text: assistantMessage }] });
    while (history.length > MAX_HISTORY) history.shift();

    res.json({
      success: true,
      data: { message: assistantMessage, session_id: session_id || 'default', provider: 'fallback' },
    });
  } catch (err) {
    console.error('[PlinthAI] Fallback error:', err);
    throw new AppError('Failed to get AI response. Please try again.', 500);
  }
});

/**
 * POST /api/v1/plinthai/feedback
 */
export const feedbackHandler = catchAsync(async (req, res) => {
  const { session_id, message_id, rating, comment } = req.body;
  console.log(`[PlinthAI Feedback] User: ${req.user._id}, Session: ${session_id}, Message: ${message_id}, Rating: ${rating}, Comment: ${comment || 'N/A'}`);
  res.json({ success: true, message: 'Feedback recorded. Thank you!' });
});

// ─────────────────────────────────────────────
// Tool Router
// ─────────────────────────────────────────────
async function executeTool(name, input, user, userProjects) {
  const projectIds = userProjects.map((p) => p._id.toString());

  switch (name) {
    case 'get_user_profile': {
      return {
        name: user.name,
        role: user.role,
        email: user.email,
        projects: userProjects.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          status: p.status,
          progress: p.progress || 0,
        })),
      };
    }

    case 'get_site_progress': {
      const { project_id } = input;
      if (!projectIds.includes(project_id)) return { error: 'not_authorized' };

      const project = await Project.findById(project_id).lean();
      const recentLogs = await SiteLog.find({ project: project_id })
        .sort({ date: -1 })
        .limit(5)
        .select('date weather activities remarks labour materials')
        .lean();

      const milestones = await Milestone.find({ project: project_id })
        .sort({ order: 1 })
        .select('title status startDate endDate weightage')
        .lean();

      return {
        project_name: project?.name,
        progress: project?.progress || 0,
        status: project?.status,
        start_date: project?.startDate,
        end_date: project?.endDate,
        recent_logs: recentLogs.map((log) => ({
          date: log.date,
          weather: log.weather,
          activities: log.activities,
          remarks: log.remarks,
          labour_count: log.labour?.reduce((sum, l) => sum + (l.present || 0), 0) || 0,
          materials_count: log.materials?.length || 0,
        })),
        milestones: milestones.map((m) => ({
          title: m.title,
          status: m.status,
          start_date: m.startDate,
          end_date: m.endDate,
          weightage: m.weightage,
        })),
      };
    }

    case 'get_project_summary': {
      const { project_id } = input;
      if (!projectIds.includes(project_id)) return { error: 'not_authorized' };

      const project = await Project.findById(project_id)
        .populate('team.user', 'name role email')
        .lean();

      if (!project) return { error: 'project_not_found' };

      const totalExpenses = await Expense.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      return {
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress || 0,
        location: project.location,
        start_date: project.startDate,
        end_date: project.endDate,
        total_budget: project.totalBudget,
        spent: totalExpenses[0]?.total || 0,
        remaining: project.totalBudget - (totalExpenses[0]?.total || 0),
        currency: project.currency,
        budget_categories: project.budgetCategories,
        team: project.team?.map((t) => ({
          name: t.user?.name,
          role: t.role || t.user?.role,
        })),
      };
    }

    case 'get_material_inventory': {
      // Return organization wide central material warehouse data
      const warehouseMaterials = await Material.find({ organisation: user.organisation }).lean();

      return {
        warehouse_materials: warehouseMaterials.map(m => ({
          name: m.name,
          category: m.category,
          quantity: m.currentStock,
          unit: m.unit,
          reorder_level: m.minThreshold,
          unit_price: m.unitPrice,
          supplier: m.supplier
        })),
        total_items: warehouseMaterials.length,
      };
    }

    case 'get_equipment_inventory': {
      const equipment = await Equipment.find({ organisation: user.organisation })
        .populate('assignedProject', 'name')
        .lean();

      return {
        total_equipment: equipment.length,
        equipment_list: equipment.map(eq => ({
          name: eq.name,
          category: eq.category,
          type: eq.type, // Owned or Rented
          status: eq.status,
          assigned_project: eq.assignedProject ? eq.assignedProject.name : 'Unassigned/Idle',
          daily_rate: eq.dailyRate || 0,
          rental_end_date: eq.rentalEndDate || null,
        }))
      };
    }

    case 'get_user_tasks': {
      const recentLogs = await SiteLog.find({ createdBy: user._id })
        .sort({ date: -1 })
        .limit(10)
        .populate('project', 'name')
        .select('date activities remarks project weather')
        .lean();

      return {
        user_name: user.name,
        recent_activities: recentLogs.map((log) => ({
          date: log.date,
          project: log.project?.name || 'Unknown',
          activities: log.activities,
          remarks: log.remarks,
          weather: log.weather,
        })),
      };
    }

    case 'get_project_expenses': {
      const { project_id } = input;
      if (!projectIds.includes(project_id)) return { error: 'not_authorized' };

      const expenses = await Expense.find({ project: project_id })
        .sort({ invoiceDate: -1 })
        .limit(20)
        .select('category vendor description amount invoiceDate')
        .lean();

      const { default: mongoose } = await import('mongoose');
      const projObjId = new mongoose.Types.ObjectId(project_id);
      const categoryTotals = await Expense.aggregate([
        { $match: { project: projObjId } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).catch(() => []);

      return {
        recent_expenses: expenses.map((e) => ({
          category: e.category,
          vendor: e.vendor,
          description: e.description,
          amount: e.amount,
          date: e.invoiceDate,
        })),
        category_breakdown: categoryTotals,
      };
    }

    case 'get_project_milestones': {
      const { project_id } = input;
      if (!projectIds.includes(project_id)) return { error: 'not_authorized' };

      const milestones = await Milestone.find({ project: project_id })
        .sort({ order: 1 })
        .populate('assignee', 'name')
        .lean();

      return {
        milestones: milestones.map((m) => ({
          title: m.title,
          description: m.description,
          status: m.status,
          start_date: m.startDate,
          end_date: m.endDate,
          actual_end: m.actualEnd,
          weightage: m.weightage,
          assignee: m.assignee?.name,
          approval_required: m.ownerApproval?.required,
          approved: m.ownerApproval?.approved,
        })),
      };
    }

    case 'get_user_notifications': {
      const query = { recipient: user._id };
      if (input.unread_only) query.isRead = false;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .select('title body type isRead link createdAt')
        .lean();

      const unreadCount = await Notification.countDocuments({ recipient: user._id, isRead: false });

      return {
        unread_count: unreadCount,
        total_shown: notifications.length,
        notifications: notifications.map((n) => ({
          title: n.title,
          body: n.body,
          type: n.type,
          is_read: n.isRead,
          link: n.link,
          created_at: n.createdAt,
        })),
      };
    }

    case 'search_construction_knowledge': {
      const { query } = input;
      return searchKnowledge(query, { topK: 5 });
    }

    case 'get_vendors': {
      const vendors = await Vendor.find({ organisation: user.organisation })
        .sort('name')
        .lean();

      return {
        total: vendors.length,
        vendors: vendors.map((v) => ({
          name: v.name,
          category: v.category,
          contact: v.contact,
          email: v.email,
          pending_orders: v.pendingOrders || 0,
          total_spend: v.totalSpend || 0,
        })),
      };
    }

    case 'get_billing_info': {
      const org = await Organisation.findById(user.organisation).lean();
      if (!org) return { error: 'organisation_not_found' };

      const projectCount = await Project.countDocuments({ organisation: org._id, isDeleted: false });
      const userCount = await User.countDocuments({ organisation: org._id, isActive: true });
      const allPlans = Organisation.getAllPlans();

      return {
        current_plan: org.plan,
        plan_expiry: org.planExpiry,
        plan_selected_at: org.planSelectedAt,
        billing_cycle: org.billingCycle,
        cancelled_at: org.cancelledAt,
        limits: {
          max_projects: org.maxProjects === -1 ? 'unlimited' : org.maxProjects,
          max_users: org.maxUsers === -1 ? 'unlimited' : org.maxUsers,
          max_storage_mb: org.maxStorageMB,
        },
        usage: {
          projects_used: projectCount,
          users_used: userCount,
          projects_remaining: org.maxProjects === -1 ? 'unlimited' : Math.max(0, org.maxProjects - projectCount),
          users_remaining: org.maxUsers === -1 ? 'unlimited' : Math.max(0, org.maxUsers - userCount),
        },
        available_plans: allPlans.map((p) => ({
          name: p.name,
          price: p.priceLabel,
          period: p.period,
          max_projects: p.maxProjects === -1 ? 'unlimited' : p.maxProjects,
          max_users: p.maxUsers,
          features: p.features,
          is_current: p.name === org.plan,
        })),
      };
    }

    case 'get_team_members': {
      const users = await User.find({ organisation: user.organisation, isActive: true })
        .select('name email role phone lastLogin')
        .lean();

      return {
        total: users.length,
        members: users.map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone || null,
          last_login: u.lastLogin || null,
        })),
      };
    }

    default:
      return { error: 'unknown_tool' };
  }
}

// ─────────────────────────────────────────────
// Intelligent Fallback Response Generator
// ─────────────────────────────────────────────

/**
 * Score how well a message matches a set of patterns.
 * Returns a number — higher = better match.
 */
function intentScore(msg, patterns) {
  let score = 0;
  for (const pattern of patterns) {
    if (pattern instanceof RegExp) {
      if (pattern.test(msg)) score += 2;
    } else {
      if (msg.includes(pattern)) score += 1;
    }
  }
  return score;
}

async function generateFallbackResponse(message, user, projects, history) {
  const msg = message.toLowerCase().trim();
  const firstName = user.name.split(' ')[0];
  const now = new Date();
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Intent Scoring ──
  const intents = {
    greeting: intentScore(msg, [/^(hi|hello|hey|namaste|howdy|sup|yo|kem cho|su chale che)\b/, /good\s*(morning|afternoon|evening|night)/, 'how are you', 'kese ho']),
    notification: intentScore(msg, ['notification', 'alert', 'unread', 'updates', /any\s*notif/, /pending\s*alert/, 'bell', /what.*new/, 'sandesh', 'suchna']),
    project: intentScore(msg, ['project', 'progress', 'summary', 'status', 'overview', 'dashboard', /how.*project/, /show.*project/, 'kaam', 'yojna', 'site']),
    tasks: intentScore(msg, ['task', 'activit', 'log', 'today', /my\s*work/, 'doing', 'recent', /what.*done/, 'daily log', 'aaj', 'kam karyu', 'kaam kiya']),
    budget: intentScore(msg, ['budget', 'expense', 'spend', 'cost', 'money', 'financ', 'bill', 'payment', 'invoice', /how\s*much/, 'kharcha', 'paise', 'rupya', 'karcho']),
    materials: intentScore(msg, ['material', 'inventor', 'stock', 'supply', 'deliver', 'cement', 'steel', 'brick', 'sand', 'quantity', 'saman', 'maal']),
    equipment: intentScore(msg, ['equipment', 'machine', 'rent', 'owned', 'asset', 'tractor', 'crane', 'jcb', 'sadhan']),
    milestones: intentScore(msg, ['milestone', 'timeline', 'deadline', 'phase', 'schedule', 'gantt', 'when', /due\s*date/, 'plan', 'planning', 'samay']),
    construction: intentScore(msg, [/\bis\s*\d/, 'cpwd', 'concrete', 'curing', 'reinforc', 'beam', 'column', 'slab', 'footing', 'foundation', 'scaffold', 'earthquake', 'seismic', 'plaster', 'excavat', 'civil engineer', 'estimation', 'chunai', 'chatar']),
    help: intentScore(msg, ['help', /how\s*to/, 'navigate', 'feature', /what\s*can/, 'guide', /how\s*do\s*i/, 'tutorial', 'madad', 'sahaya']),
    thanks: intentScore(msg, [/^(thanks|thank\s*you|thx|ty|dhanyavad|aabhar)\b/, 'appreciate', 'grateful']),
    bye: intentScore(msg, [/^(bye|goodbye|see\s*you|good\s*night|alvida|aavjo)\b/, 'later', 'signing off']),
    team: intentScore(msg, ['team', 'member', 'colleague', 'user', 'people', 'workforce', 'labour', 'worker', 'staff', 'log', 'manas', 'majdoor']),
    weather: intentScore(msg, ['weather', 'rain', 'temperature', 'climate', 'forecast', 'sunny', 'storm', 'mausam', 'vatavaran', 'barsat', 'varsad']),
    math: intentScore(msg, [/\d+\s*[\+\-\*\/\%]\s*\d+/, /calculate/, /what\s*is\s*\d+/, /percentage/, /convert/, 'ganti', 'hisab']),
    capabilities: intentScore(msg, [/what\s*can\s*you/, /what\s*do\s*you/, /your\s*capabilit/, /are\s*you\s*able/, /can\s*you\s*help/, 'su kari sake che', 'kya kar sakte ho']),
    writing: intentScore(msg, ['write', 'email', 'draft', 'letter', 'proposal', 'report', 'message', 'likho', 'lakh']),
    vendor: intentScore(msg, ['vendor', 'supplier', 'contractor', /purchase\s*order/, 'supply', 'procurement', /vendor\s*list/, /vendor\s*contact/, 'vyapari', 'thekedar']),
    billing: intentScore(msg, ['billing', 'subscription', 'plan', 'pricing', 'upgrade', 'downgrade', 'renewal', 'expire', /my\s*plan/, /change\s*plan/, /current\s*plan/, 'tier', 'paisa']),
  };

  // Find the highest-scoring intent
  const bestIntent = Object.entries(intents).reduce(
    (best, [intent, score]) => (score > best.score ? { intent, score } : best),
    { intent: 'general', score: 0 }
  );

  // ── Response Generators ──

  switch (bestIntent.intent) {
    case 'greeting': {
      const projectList = projects.length
        ? projects.map((p) => `- **${p.name}** — ${p.status} (${p.progress || 0}% complete)`).join('\n')
        : '- No projects assigned yet';

      const unreadCount = await Notification.countDocuments({ user: user._id, isRead: false });
      const notifLine = unreadCount > 0 ? `\n📬 You have **${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}**.` : '';

      return `${timeGreeting}, ${firstName}! 👋 Great to see you.\n\nHere's a quick snapshot:\n\n### 📊 Your Projects\n${projectList}${notifLine}\n\n### What can I help you with?\nI'm a **full AI assistant** — I can help with anything, not just construction! Ask me about:\n\n- 📋 **Project data** — progress, budgets, expenses, milestones\n- 👥 **Team & Chat** — team roles, invites, real-time messaging\n- 📝 **Your activities** — recent logs, tasks, notifications\n- 🏗️ **Construction standards** — IS codes, CPWD specs, safety\n- 💻 **Coding** — write, debug, or explain code in any language\n- ✍️ **Writing** — emails, reports, proposals, documentation\n- 🧮 **Calculations** — math, percentages, cost estimates\n- 📚 **Research** — explain topics, compare options, analysis\n- 📋 **Planning** — schedules, task breakdowns, roadmaps\n\nJust ask! 🚀`;
    }

    case 'notification': {
      const unreadCount = await Notification.countDocuments({ recipient: user._id, isRead: false });
      const recentNotifs = await Notification.find({ recipient: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title body type isRead link createdAt')
        .lean();

      if (recentNotifs.length === 0) {
        return `You're all caught up, ${firstName}! 🎉\n\nYou have **0 notifications** right now. When there are updates on your projects (new logs, milestone approvals, budget changes, etc.), they'll appear here.\n\nIs there anything else I can help you with?`;
      }

      const unreadNotifs = recentNotifs.filter((n) => !n.isRead);
      const notifList = recentNotifs.slice(0, 8).map((n) => {
        const time = new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const readIcon = n.isRead ? '✅' : '🔴';
        return `${readIcon} **${n.title}**\n   ${n.body || 'No details'} — *${time}*`;
      });

      return `### 🔔 Your Notifications\n\n📬 **${unreadCount} unread** out of ${recentNotifs.length} recent notifications.\n\n${notifList.join('\n\n')}\n\n${unreadCount > 0 ? `\n💡 **Tip:** You can mark all as read from the [Notifications page](/notifications).` : '\n✅ All caught up!'}\n\nWant me to help with anything related to these notifications?`;
    }

    case 'project': {
      if (projects.length === 0) {
        return `You don't have any projects assigned yet, ${firstName}.\n\n### How to get started:\n1. **Create a new project** from the **Projects** page\n2. Or ask your **Project Manager** to add you to an existing team\n\nWould you like me to explain how to set up a new project?`;
      }

      // Filter projects based on message content
      let targetProjects = projects;
      const matchedProjects = projects.filter(p => msg.includes(p.name.toLowerCase()));
      if (matchedProjects.length > 0) {
        targetProjects = matchedProjects;
      }

      const projectDetails = [];
      for (const p of targetProjects) {
        const recentLogs = await SiteLog.find({ project: p._id })
          .sort({ date: -1 }).limit(3).select('date activities weather').lean();

        const totalExpenses = await Expense.aggregate([
          { $match: { project: p._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).catch(() => []);

        const spent = totalExpenses[0]?.total || 0;
        const budget = p.totalBudget ? `₹${(p.totalBudget / 100000).toFixed(1)}L` : 'N/A';
        const spentStr = `₹${(spent / 100000).toFixed(1)}L`;
        const pct = p.totalBudget ? Math.round((spent / p.totalBudget) * 100) : 0;
        const burnIcon = pct > 80 ? '🔴' : pct > 50 ? '🟡' : '🟢';

        const timeline = p.startDate && p.endDate
          ? `${new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} → ${new Date(p.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Not set';

        const logSummary = recentLogs.length
          ? recentLogs.map((l) => `  - ${new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${(l.activities || '').slice(0, 100)}${(l.activities || '').length > 100 ? '...' : ''}`).join('\n')
          : '  - No recent site logs';

        projectDetails.push(
          `### 📋 ${p.name}\n| Field | Value |\n|---|---|\n| **Status** | ${p.status} |\n| **Progress** | ${p.progress || 0}% |\n| **Budget** | ${budget} |\n| **Spent** | ${spentStr} (${pct}%) ${burnIcon} |\n| **Timeline** | ${timeline} |\n| **Location** | ${p.location?.city || p.location || 'Not specified'} |\n\n**Recent Activity:**\n${logSummary}`
        );
      }

      return `Here's an overview of the requested project${targetProjects.length > 1 ? 's' : ''}, ${firstName}:\n\n${projectDetails.join('\n\n---\n\n')}\n\n### 💡 What's next?\nAsk me to dive deeper into any project — budgets, milestones, materials, or team details.`;
    }

    case 'tasks': {
      const recentLogs = await SiteLog.find({ createdBy: user._id })
        .sort({ date: -1 }).limit(10)
        .populate('project', 'name')
        .select('date activities remarks project weather').lean();

      if (recentLogs.length === 0) {
        return `No recent activity logs found, ${firstName}.\n\n### How to create a daily log:\n1. Go to your **Project** page\n2. Click the **Daily Logs** tab\n3. Click **Create Log** to record today's activities\n\nDaily logs help track:\n- 🏗️ Construction activities performed\n- 🌤️ Weather conditions\n- 👷 Labour attendance\n- 🧱 Materials used\n- 📸 Site photos\n- 📝 Remarks and observations\n\nWould you like help with anything else?`;
      }

      const logEntries = recentLogs.map((log) => {
        const date = new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const weatherIcon = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️' }[log.weather?.toLowerCase()] || '🌤️';
        return `- **${date}** ${weatherIcon} — *${log.project?.name || 'Unknown'}*\n  ${(log.activities || '').slice(0, 200)}${log.remarks ? `\n  📝 *${log.remarks.slice(0, 100)}*` : ''}`;
      });

      return `### 📝 Your Recent Activities\n\nShowing your last **${recentLogs.length}** site log entries:\n\n${logEntries.join('\n\n')}\n\n---\n\nWant me to help you with:\n- 📊 A specific project's progress?\n- ✍️ Drafting a daily report email?\n- 📋 Planning tomorrow's activities?`;
    }

    case 'budget': {
      if (projects.length === 0) {
        return `No projects found to show budget information for, ${firstName}. Budget tracking becomes available once you're assigned to a project.`;
      }

      const budgetInfo = [];
      let totalBudgetAll = 0;
      let totalSpentAll = 0;

      for (const p of projects) {
        const totalExpenses = await Expense.aggregate([
          { $match: { project: p._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]).catch(() => []);

        const spent = totalExpenses[0]?.total || 0;
        const remaining = (p.totalBudget || 0) - spent;
        const pct = p.totalBudget ? Math.round((spent / p.totalBudget) * 100) : 0;
        const burnIcon = pct > 80 ? '🔴 Critical' : pct > 50 ? '🟡 Moderate' : '🟢 On Track';

        totalBudgetAll += p.totalBudget || 0;
        totalSpentAll += spent;

        budgetInfo.push(
          `### 💰 ${p.name}\n| Metric | Amount |\n|---|---|\n| **Total Budget** | ₹${((p.totalBudget || 0) / 100000).toFixed(1)}L |\n| **Spent** | ₹${(spent / 100000).toFixed(1)}L (${pct}%) |\n| **Remaining** | ₹${(remaining / 100000).toFixed(1)}L |\n| **Burn Rate** | ${burnIcon} |`
        );
      }

      const overallPct = totalBudgetAll ? Math.round((totalSpentAll / totalBudgetAll) * 100) : 0;

      return `## 💰 Budget Overview\n\n**Overall:** ₹${(totalSpentAll / 100000).toFixed(1)}L spent of ₹${(totalBudgetAll / 100000).toFixed(1)}L total (${overallPct}%)\n\n${budgetInfo.join('\n\n---\n\n')}\n\n### 💡 Quick Actions\n- Ask me for a **detailed expense breakdown** by category\n- Ask about **specific project expenses**\n- I can help you **calculate cost estimates** for upcoming work`;
    }

    case 'materials': {
      if (projects.length === 0) {
        return `No projects found for material tracking. Materials are logged as part of daily site logs within each project.`;
      }

      const allMaterials = [];
      for (const p of projects) {
        const logs = await SiteLog.find({ project: p._id })
          .sort({ date: -1 }).limit(10).select('date materials').lean();
        for (const log of logs) {
          for (const mat of log.materials || []) {
            allMaterials.push({ ...mat, projectName: p.name, date: log.date });
          }
        }
      }

      // Also fetch material expenses for cost breakdown
      const projectIds = projects.map((p) => p._id);
      const materialExpenses = await Expense.aggregate([
        { $match: { project: { $in: projectIds }, category: 'material' } },
        { $group: { _id: '$vendor', totalSpent: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
      ]).catch(() => []);

      const totalMaterialCost = materialExpenses.reduce((sum, e) => sum + e.totalSpent, 0);

      if (allMaterials.length === 0 && materialExpenses.length === 0) {
        return `No recent material entries found across your projects, ${firstName}.\n\n### How to log materials:\n1. Create a **Daily Log** for your project\n2. In the materials section, add entries with:\n   - Material name (e.g., Cement, TMT Steel, River Sand)\n   - Quantity and unit\n   - Supplier name\n   - Price\n\nWould you like help with anything else?`;
      }

      let response = '';

      if (allMaterials.length > 0) {
        const matList = allMaterials.slice(0, 12).map((m) => {
          const date = new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const price = m.price ? `₹${m.price.toLocaleString('en-IN')}` : '-';
          return `| ${m.name || 'N/A'} | ${m.qty || '-'} ${m.unit || ''} | ${m.projectName} | ${date} | ${m.supplier || '-'} | ${price} |`;
        });

        response += `### 🧱 Recent Material Deliveries\n\n| Material | Quantity | Project | Date | Supplier | Price |\n|---|---|---|---|---|---|\n${matList.join('\n')}\n\n*Showing ${Math.min(allMaterials.length, 12)} of ${allMaterials.length} entries.*`;
      }

      if (materialExpenses.length > 0) {
        const expList = materialExpenses.slice(0, 8).map((e) => {
          return `| ${e._id || 'Unknown'} | ₹${(e.totalSpent / 100000).toFixed(1)}L | ${e.count} |`;
        });

        response += `\n\n### 💰 Material Expense Summary\n\n**Total material spend:** ₹${(totalMaterialCost / 100000).toFixed(1)}L\n\n| Vendor/Supplier | Total Spent | Invoices |\n|---|---|---|\n${expList.join('\n')}`;
      }

      response += `\n\nWant me to filter by a specific project or material type?`;
      return response;
    }

    case 'equipment': {
      const equipmentList = await Equipment.find({ organisation: user.organisation }).populate('assignedProject', 'name').lean();

      if (equipmentList.length === 0) {
        return `You don't have any equipment logged yet, ${firstName}.\n\n### How to track equipment:\n1. Go to the **Equipment** page from the sidebar.\n2. Add Owned or Rented machinery (e.g., Cranes, Excavators).\n3. Assign them to specific projects to automatically track rental costs!\n\nWould you like me to help with anything else?`;
      }

      const owned = equipmentList.filter(e => e.type === 'Owned');
      const rented = equipmentList.filter(e => e.type === 'Rented');
      const active = equipmentList.filter(e => e.status === 'Active');

      let response = `### 🚜 Equipment Overview\n\n**Total Equipment:** ${equipmentList.length} (${owned.length} Owned, ${rented.length} Rented)\n**Active on Projects:** ${active.length}\n\n| Name | Type | Status | Assigned Project | Daily Rate |\n|---|---|---|---|---|\n`;

      const eqList = equipmentList.slice(0, 15).map(e => {
        const rate = e.dailyRate ? `₹${e.dailyRate.toLocaleString('en-IN')}` : '-';
        const project = e.assignedProject?.name || 'Unassigned';
        const statusIcon = e.status === 'Active' ? '🟢' : e.status === 'Idle' ? '🟡' : '🔴';
        return `| ${e.name} | ${e.type} | ${statusIcon} ${e.status} | ${project} | ${rate} |`;
      });

      response += eqList.join('\n');

      if (equipmentList.length > 15) {
        response += `\n\n*Showing 15 of ${equipmentList.length} items.*`;
      }
      return response;
    }

    case 'milestones': {
      if (projects.length === 0) return `No projects found to show milestones for.`;

      const milestoneInfo = [];
      for (const p of projects) {
        const milestones = await Milestone.find({ project: p._id }).sort({ order: 1 }).lean();
        if (milestones.length === 0) continue;

        const mList = milestones.map((m) => {
          const icon = { planned: '⏳', inProgress: '🔄', completed: '✅', delayed: '⚠️' }[m.status] || '📌';
          const endDate = m.endDate ? new Date(m.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD';
          return `| ${icon} ${m.title} | ${m.status} | ${endDate} | ${m.weightage || '-'}% |`;
        });

        milestoneInfo.push(`### 🏗️ ${p.name}\n\n| Milestone | Status | Due | Weight |\n|---|---|---|---|\n${mList.join('\n')}`);
      }

      if (milestoneInfo.length === 0) {
        return `No milestones have been set for your projects yet, ${firstName}.\n\nYou can add milestones from the **Milestones** tab in any project. Milestones help track:\n- 📅 Project phases and deadlines\n- ✅ Completion status\n- 👤 Assignee accountability\n- 📊 Weighted progress calculation`;
      }

      return `## 📅 Milestone Overview\n\n${milestoneInfo.join('\n\n---\n\n')}\n\nNeed me to analyze timeline risks or suggest schedule adjustments?`;
    }

    case 'team': {
      const users = await User.find({ organisation: user.organisation, isActive: true })
        .select('name role email phone').lean();

      if (users.length === 0) return `You don't have any team members yet. Head over to the **Team** tab to invite some!`;

      const userList = users.map(u => `| ${u.name} | ${u.role || 'User'} | ${u.email} | ${u.phone || '-'} |`);

      return `### 👥 Your Team\n\nYou have **${users.length} active team members** in your organization.\n\n| Name | Role | Email | Phone |\n|---|---|---|---|\n${userList.join('\n')}\n\n💡 **Tip:** You can now chat with your team in real-time! Head over to the **Chat** tab to send them a message.`;
    }

    case 'construction': {
      const ragResult = searchKnowledge(message, { topK: 4 });

      if (ragResult.results.length > 0) {
        const citations = ragResult.results.map((r) =>
          `### 📋 ${r.document} — ${r.clause}\n**${r.title}**\n\n${r.content}`
        );

        return `Here's what I found in the construction knowledge base:\n\n${citations.join('\n\n---\n\n')}\n\n*${ragResult.totalMatches} results found. Showing top ${ragResult.results.length}.*\n\n> 💡 **Note:** For more detailed guidance, always refer to the full standard document. These are key extracts for quick reference.\n\nHave a follow-up question about any of these standards?`;
      }

      return `I couldn't find specific information about "${message.slice(0, 50)}" in the knowledge base.\n\n### Available Topics\nI have detailed knowledge about:\n- **IS 456:2000** — Plain and reinforced concrete\n- **IS 1893:2016** — Earthquake-resistant design\n- **IS 875** — Design loads (dead, live, wind, snow)\n- **IS 13920** — Ductile detailing of RC structures\n- **CPWD Specifications** — Earthwork, brickwork, plastering, concrete\n- **Safety Standards** — IS 3696, National Building Code, BOCW Act\n\nTry rephrasing your question or ask about a specific code!`;
    }

    case 'help':
    case 'capabilities': {
      return `## 🤖 What I Can Do\n\nI'm **PlinthAI** — a premium AI assistant. Here's everything I can help with:\n\n### 📊 PlinthHQ Data\n| Ask me about... | Example |\n|---|---|\n| Projects | "Show my project summary" |\n| Team & Chat | "Who is in my team?" or "Show team members" |\n| Notifications | "Do I have any unread alerts?" |\n| Budget & Expenses | "What's the budget status?" |\n| Materials | "Show recent material deliveries" |\n| Milestones | "What milestones are due this month?" |\n| Daily Logs | "What did I work on recently?" |\n\n### 🧠 General Intelligence\n| Capability | Example |\n|---|---|\n| **Coding** | "Write a React component for a form" |\n| **Math** | "Calculate 15% of ₹2,50,000" |\n| **Writing** | "Draft a site inspection email" |\n| **Analysis** | "Compare React vs Angular for our use case" |\n| **Planning** | "Create a weekly schedule for concrete work" |\n| **Research** | "Explain the RCC design process step by step" |\n| **Construction** | "What does IS 456 say about curing?" |\n\n### 💡 Tips\n- I remember our **entire conversation** — feel free to ask follow-ups\n- I give **detailed answers by default** — say "briefly" if you want short ones\n- I'll **ask for clarification** if your question is ambiguous\n- I handle **any topic** — tech, business, education, writing, math, and more\n\nWhat would you like to start with?`;
    }

    case 'thanks': {
      const responses = [
        `You're welcome, ${firstName}! 😊 Happy to help. Let me know if there's anything else!`,
        `Glad I could help! 🙌 Don't hesitate to ask if you need anything else, ${firstName}.`,
        `Anytime, ${firstName}! That's what I'm here for. 💪 What else can I assist you with?`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    case 'bye': {
      return `${hour >= 17 ? 'Good night' : 'See you later'}, ${firstName}! 👋 Great chatting with you. I'll be right here whenever you need me. Take care! 🏗️`;
    }

    case 'team': {
      // Fetch organisation-level users
      const orgUsers = await User.find({ organisation: user.organisation, isActive: true })
        .select('name email role phone lastLogin').lean();

      const orgUserList = orgUsers.map((u) => {
        const lastActive = u.lastLogin
          ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Never';
        return `| ${u.name} | ${u.role} | ${u.email} | ${lastActive} |`;
      });

      let response = `## 👥 Organisation Team\n\n**${orgUsers.length} member(s)** in your organisation.\n\n| Name | Role | Email | Last Active |\n|---|---|---|---|\n${orgUserList.join('\n')}`;

      // Also show project-level team breakdown if available
      if (projects.length > 0) {
        const teamInfo = [];
        for (const p of projects) {
          const fullProject = await Project.findById(p._id)
            .populate('team.user', 'name role email')
            .select('name team').lean();

          if (fullProject?.team?.length) {
            const members = fullProject.team.map((t) =>
              `| ${t.user?.name || 'Unknown'} | ${t.role || t.user?.role || 'Member'} | ${t.user?.email || '-'} |`
            );
            teamInfo.push(`### 🏗️ ${p.name}\n\n| Name | Role | Email |\n|---|---|---|\n${members.join('\n')}`);
          }
        }
        if (teamInfo.length > 0) {
          response += `\n\n---\n\n## Project Teams\n\n${teamInfo.join('\n\n---\n\n')}`;
        }
      }

      response += `\n\n📋 Manage team from the **Team Management** page.`;
      return response;
    }

    case 'vendor': {
      const vendors = await Vendor.find({ organisation: user.organisation }).sort('name').lean();

      if (vendors.length === 0) {
        return `No vendors found in your organisation yet, ${firstName}.\n\n### How to add a vendor:\n1. Go to **Vendor Portal** from the sidebar\n2. Click **Add Vendor**\n3. Fill in vendor name, category, contact, and email\n\nVendors help you track:\n- 🏭 **Material suppliers** (cement, steel, etc.)\n- 👷 **Labour contractors**\n- 🚜 **Equipment rentals**\n- 💼 **Service providers**\n\nWould you like me to help with anything else?`;
      }

      // Cross-reference with actual expense data for accurate spend
      const projectIds = projects.map((p) => p._id);
      const expensesByVendor = await Expense.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$vendor', totalSpent: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).catch(() => []);
      const expenseMap = {};
      for (const e of expensesByVendor) {
        expenseMap[e._id] = { totalSpent: e.totalSpent, count: e.count };
      }

      const totalSpend = vendors.reduce((sum, v) => sum + (v.totalSpend || 0), 0);
      const totalExpenseSpend = expensesByVendor.reduce((sum, e) => sum + e.totalSpent, 0);
      const displayTotal = Math.max(totalSpend, totalExpenseSpend);

      const vendorList = vendors.map((v) => {
        const expData = expenseMap[v.name];
        const spend = expData ? `₹${(expData.totalSpent / 100000).toFixed(1)}L` : (v.totalSpend ? `₹${(v.totalSpend / 100000).toFixed(1)}L` : '₹0');
        const txnCount = expData ? expData.count : 0;
        return `| ${v.name} | ${v.category} | ${v.contact || '-'} | ${spend} | ${v.pendingOrders || 0} | ${txnCount} |`;
      });

      return `### 🏭 Your Vendors\n\n**${vendors.length} vendor(s)** | Total spend: **₹${(displayTotal / 100000).toFixed(1)}L**\n\n| Name | Category | Contact | Total Spend | Pending | Transactions |\n|---|---|---|---|---|---|\n${vendorList.join('\n')}\n\n📋 Manage vendors from the **Vendor Portal** page. You can edit spend, pending orders, and contact info.\n\nWant details on a specific vendor or help adding one?`;
    }

    case 'billing': {
      const org = await Organisation.findById(user.organisation).lean();
      if (!org) return `Unable to fetch billing information. Please try again.`;

      const projectCount = await Project.countDocuments({ organisation: org._id, isDeleted: false });
      const userCount = await User.countDocuments({ organisation: org._id, isActive: true });
      const limits = Organisation.getPlanLimits(org.plan);
      const allPlans = Organisation.getAllPlans();

      const planOrder = ['free', 'starter', 'pro', 'business'];
      const currentIdx = planOrder.indexOf(org.plan);

      const expiryStr = org.planExpiry
        ? new Date(org.planExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Never (free plan)';

      const projectUsage = org.maxProjects === -1 ? `${projectCount} / ∞` : `${projectCount} / ${org.maxProjects}`;
      const userUsage = org.maxUsers === -1 ? `${userCount} / ∞` : `${userCount} / ${org.maxUsers}`;

      const planTable = allPlans.map((p) => {
        const current = p.name === org.plan ? ' ⭐' : '';
        return `| **${p.name.charAt(0).toUpperCase() + p.name.slice(1)}**${current} | ${p.priceLabel}${p.period !== 'forever' ? p.period : ''} | ${p.maxProjects === -1 ? '∞' : p.maxProjects} | ${p.maxUsers} |`;
      });

      return `### 💳 Billing & Subscription\n\n| Detail | Value |\n|---|---|\n| **Current Plan** | ${org.plan.charAt(0).toUpperCase() + org.plan.slice(1)} ⭐ |\n| **Price** | ${limits.priceLabel}${limits.period !== 'forever' ? limits.period : ''} |\n| **Billing Cycle** | ${org.billingCycle || 'Monthly'} |\n| **Expires** | ${expiryStr} |\n\n### 📊 Usage\n| Resource | Usage |\n|---|---|\n| **Projects** | ${projectUsage} |\n| **Users** | ${userUsage} |\n| **Storage** | ${org.maxStorageMB >= 1024 ? `${(org.maxStorageMB / 1024).toFixed(0)}GB` : `${org.maxStorageMB}MB`} |\n| **AI Chats** | ${limits.aiChatsPerDay === -1 ? 'Unlimited' : `${limits.aiChatsPerDay}/day`} |\n\n### 📋 Available Plans\n| Plan | Price | Projects | Users |\n|---|---|---|---|\n${planTable.join('\n')}\n\n${currentIdx < planOrder.length - 1 ? `\n💡 **Upgrade** from the [Billing page](/billing) to unlock more features!` : '\n🎉 You\'re on the top plan!'}\n\nWant me to explain any plan in detail?`;
    }

    case 'weather': {
      return `### 🌤️ Weather Information\n\nI don't have real-time weather data yet, but here are some tips for construction site planning:\n\n**Concrete Work:**\n- ❌ Avoid pouring in heavy rain or temperatures above 40°C\n- ✅ Best conditions: 15-30°C with moderate humidity\n- 💧 Ensure proper curing for 7-14 days minimum\n\n**General Guidelines:**\n- Check local weather forecasts before scheduling outdoor work\n- Log actual weather conditions in your **Daily Site Logs**\n- Monitor monsoon forecasts for the season\n\nYou can record weather conditions (Sunny, Cloudy, Rainy, Stormy) in your daily logs for each project.\n\nNeed construction advice for specific weather conditions?`;
    }

    case 'math': {
      // Try to evaluate simple math expressions
      try {
        const mathExpr = msg.replace(/[^0-9+\-*/().,%\s]/g, '').trim();
        if (/percentage|percent|%\s*of/.test(msg)) {
          const pctMatch = msg.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*[\₹$]?\s*([\d,]+)/);
          if (pctMatch) {
            const pct = parseFloat(pctMatch[1]);
            const value = parseFloat(pctMatch[2].replace(/,/g, ''));
            const result = (pct / 100) * value;
            return `### 🧮 Calculation\n\n**${pct}% of ₹${value.toLocaleString('en-IN')}**\n\n= ₹**${result.toLocaleString('en-IN', { maximumFractionDigits: 2 })}**\n\n---\n\n**Formula:** ${pct}/100 × ${value.toLocaleString('en-IN')} = ${result.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n\nNeed any other calculations?`;
          }
        }

        // Basic arithmetic
        const arithMatch = msg.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/x×÷])\s*(\d+(?:\.\d+)?)/);
        if (arithMatch) {
          const a = parseFloat(arithMatch[1]);
          const opChar = arithMatch[2];
          const b = parseFloat(arithMatch[3]);
          const ops = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y, 'x': (x, y) => x * y, '×': (x, y) => x * y, '/': (x, y) => x / y, '÷': (x, y) => x / y };
          const fn = ops[opChar];
          if (fn) {
            const result = fn(a, b);
            return `### 🧮 Calculation\n\n**${a} ${opChar} ${b} = ${result.toLocaleString('en-IN', { maximumFractionDigits: 4 })}**\n\nNeed any other calculations?`;
          }
        }
      } catch { /* fall through */ }

      return `I can help with calculations! Try asking like:\n- "What is 15% of 2,50,000"\n- "Calculate 125 × 340"\n- "Convert 100 sq ft to sq meters" (1 sq ft = 0.0929 sq m)\n\nWhat would you like to calculate?`;
    }

    case 'writing': {
      let template = `**Subject:** [Relevant Subject]\n\n**Dear [Name],**\n\n[Your main message here...]\n\n**Best regards,**\n${firstName}`;

      if (/leav|vacation|holiday|sick|absent/.test(msg)) {
        template = `**Subject:** Request for Leave\n\n**Dear [Manager's Name],**\n\nI am writing to formally request a leave of absence from [Start Date] to [End Date] due to [Reason]. I will ensure all my pending tasks are handed over properly before my departure.\n\nThank you for your understanding.\n\n**Best regards,**\n${firstName}`;
      } else if (/inspection|site|report/.test(msg)) {
        template = `**Subject:** Site Inspection Update - [Project Name]\n\n**Dear Team,**\n\nI have completed the site inspection for today. The key observations are:\n- [Observation 1]\n- [Observation 2]\n\nPlease find the detailed daily log updated in PlinthHQ.\n\n**Best regards,**\n${firstName}`;
      }

      return `### 📝 Draft Template\n\n*Note: I am currently running in Local Assistant Mode (without a connected LLM API key), so I cannot generate dynamic custom text. However, here is a standard template you can use:*\n\n---\n\n${template}`;
    }

    default: {
      // 1. Try local construction knowledge base (RAG)
      const ragResult = searchKnowledge(message, { topK: 3 });
      if (ragResult.results.length > 0) {
        const citations = ragResult.results.map((r) =>
          `### 📋 ${r.document} — ${r.clause}\n**${r.title}**\n\n${r.content}`
        );
        return `Based on your query, here is what I found in the construction knowledge base:\n\n${citations.join('\n\n---\n\n')}\n\n*${ragResult.totalMatches} results found. Showing top ${ragResult.results.length}.*\n\n> 💡 **Note:** Refer to the full standard document for detailed guidance.`;
      }

      // 2. Check if the query is a general platform question
      const isQuestion = /\?$|^(what|how|why|when|where|who|which|can|could|would|should|explain|describe|tell|show|list|compare|analyze|write|create|generate|draft|build|make|code|debug|plan|summarize|calculate)/.test(msg);

      if (isQuestion) {
        return `I understand you're asking about **"${message}"**.\n\nI am currently running in local assistant mode. Here is how you can find and manage this information on PlinthHQ:\n\n*   📅 **Project Planning & Gantt**: Click the **Milestones** tab inside your project to view, track, and edit your project timeline.\n*   📊 **Project Progress**: Check the **Overview** dashboard on your project page to see progress percentages.\n*   📝 **Daily Site Reports**: Go to the **Daily Logs** tab to log activities, weather, labour, and materials.\n*   💰 **Budget & Expense Tracking**: Open the **Budget** tab inside your project to view expense breakdowns.\n*   🧱 **Materials Management**: Go to the **Materials** tab to view logged deliveries.\n\nAlternatively, try asking me directly about your live data:\n- **"show my project summary"**\n- **"do I have any notifications?"**\n- **"show budget overview"**\n- **"milestone status"**`;
      }

      // Simple conversational response
      return `Hey ${firstName}! Thanks for your message. 😊\n\nI'm your PlinthAI assistant. I can fetch live data from the website for you! Try asking:\n\n- 🔔 **"Do I have any notifications?"**\n- 📊 **"Show my project summary"**\n- 📝 **"What have I been working on?"**\n- 💰 **"Show budget overview"**\n- 🧱 **"Material inventory"**\n- 📅 **"Milestone status"**\n- 🏗️ **"IS 456 concrete curing"**\n\nJust ask naturally!`;
    }
  }
}
