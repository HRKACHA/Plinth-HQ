export const projects = [
  {
    id: '1',
    name: 'Skyline Residency Tower B',
    description: '24-floor residential tower with basement parking',
    status: 'active',
    progress: 68,
    location: 'Pune, Maharashtra',
    totalBudget: 45000000,
    spent: 30600000,
    lastLogDate: '2026-06-08',
    coverPhoto: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    team: 12,
    startDate: '2025-03-01',
    endDate: '2026-12-31',
  },
  {
    id: '2',
    name: 'Green Valley Commercial Complex',
    description: 'Mixed-use commercial development with retail and office spaces',
    status: 'active',
    progress: 42,
    location: 'Bangalore, Karnataka',
    totalBudget: 78000000,
    spent: 28500000,
    lastLogDate: '2026-06-07',
    coverPhoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    team: 18,
    startDate: '2025-06-15',
    endDate: '2027-06-30',
  },
  {
    id: '3',
    name: 'Heritage Villa Renovation',
    description: 'Heritage structure restoration and modern extension',
    status: 'planning',
    progress: 15,
    location: 'Jaipur, Rajasthan',
    totalBudget: 12000000,
    spent: 1800000,
    lastLogDate: '2026-06-05',
    coverPhoto: 'https://images.unsplash.com/photo-1590496793907-2a5c2f2f4f4f?w=800&q=80',
    team: 6,
    startDate: '2026-01-10',
    endDate: '2026-10-31',
  },
];

export const dailyLogs = [
  {
    id: 'l1',
    projectId: '1',
    date: '2026-06-08',
    weather: 'sunny',
    temperature: 34,
    activities: 'Completed slab casting for 14th floor. Installed rebar for column grid C1-C8. Started waterproofing on terrace level.',
    remarks: 'Concrete pour delayed 2 hours due to traffic on supply route.',
    photoCount: 8,
    author: 'Rajesh Kumar',
    labour: { mason: 24, carpenter: 12, electrician: 8, plumber: 6 },
    materials: ['Cement 200 bags', 'Steel TMT 2.5 tons'],
    isLocked: false,
  },
  {
    id: 'l2',
    projectId: '1',
    date: '2026-06-07',
    weather: 'cloudy',
    temperature: 31,
    activities: 'Formwork removal on 13th floor. Electrical conduit laying in progress. Plastering started on 10th floor units.',
    remarks: '',
    photoCount: 5,
    author: 'Priya Sharma',
    labour: { mason: 20, carpenter: 10, electrician: 14, plumber: 4 },
    materials: ['Sand 15 cubic meters', 'Electrical conduit 500m'],
    isLocked: false,
  },
  {
    id: 'l3',
    projectId: '1',
    date: '2026-06-06',
    weather: 'rainy',
    temperature: 28,
    activities: 'Work halted after 11 AM due to heavy rain. Covered exposed rebar. Interior finishing on 8th floor continued under shelter.',
    remarks: 'Safety inspection passed. No incidents reported.',
    photoCount: 3,
    author: 'Rajesh Kumar',
    labour: { mason: 8, carpenter: 6, electrician: 4, plumber: 2 },
    materials: [],
    isLocked: true,
  },
];

export const expenses = [
  { id: 'e1', date: '2026-06-07', category: 'material', vendor: 'UltraTech Cement', amount: 185000, description: 'Cement supply - 200 bags' },
  { id: 'e2', date: '2026-06-05', category: 'labour', vendor: 'Shree Contractors', amount: 420000, description: 'Weekly labour payment' },
  { id: 'e3', date: '2026-06-03', category: 'equipment', vendor: 'JCB Rentals', amount: 95000, description: 'Excavator rental - 5 days' },
  { id: 'e4', date: '2026-06-01', category: 'overhead', vendor: 'Site Office Supplies', amount: 28000, description: 'Safety gear and signage' },
  { id: 'e5', date: '2026-05-28', category: 'material', vendor: 'Tata Steel', amount: 890000, description: 'TMT bars - 5 tons' },
];

export const budgetCategories = [
  { name: 'Materials', allocated: 18000000, spent: 14200000 },
  { name: 'Labour', allocated: 12000000, spent: 9800000 },
  { name: 'Equipment', allocated: 6000000, spent: 3200000 },
  { name: 'Overhead', allocated: 5000000, spent: 2100000 },
  { name: 'Contingency', allocated: 4000000, spent: 1300000 },
];

export const milestones = [
  { id: 'm1', title: 'Foundation Complete', status: 'completed', startDate: '2025-03-01', endDate: '2025-05-15', weightage: 15, assignee: 'Rajesh Kumar' },
  { id: 'm2', title: 'Structure to 10th Floor', status: 'completed', startDate: '2025-05-16', endDate: '2025-10-30', weightage: 25, assignee: 'Priya Sharma' },
  { id: 'm3', title: 'Structure to 20th Floor', status: 'inProgress', startDate: '2025-11-01', endDate: '2026-04-30', weightage: 25, assignee: 'Rajesh Kumar' },
  { id: 'm4', title: 'MEP Installation', status: 'planned', startDate: '2026-05-01', endDate: '2026-09-30', weightage: 20, assignee: 'Amit Patel' },
  { id: 'm5', title: 'Finishing & Handover', status: 'planned', startDate: '2026-10-01', endDate: '2026-12-31', weightage: 15, assignee: 'Priya Sharma' },
];

export const documents = [
  { id: 'd1', name: 'Architectural Drawings - Rev 4', type: 'drawing', version: 4, size: '12.4 MB', uploadedAt: '2026-05-20', tags: ['architecture', 'approved'] },
  { id: 'd2', name: 'Structural BOQ', type: 'BOQ', version: 2, size: '3.2 MB', uploadedAt: '2026-04-15', tags: ['structural', 'budget'] },
  { id: 'd3', name: 'Building Permit', type: 'permit', version: 1, size: '1.8 MB', uploadedAt: '2025-02-28', tags: ['legal', 'approved'] },
  { id: 'd4', name: 'Main Contract Agreement', type: 'contract', version: 1, size: '5.6 MB', uploadedAt: '2025-02-15', tags: ['legal'] },
  { id: 'd5', name: 'Safety Inspection Report Q1', type: 'inspection', version: 1, size: '2.1 MB', uploadedAt: '2026-04-01', tags: ['safety', 'inspection'] },
];

export const notifications = [
  { id: 'n1', type: 'newLog', title: 'New daily log submitted', body: 'Rajesh Kumar submitted log for June 8, 2026', time: '2 hours ago', isRead: false, link: '/projects/1/logs' },
  { id: 'n2', type: 'budgetAlert', title: 'Budget threshold reached', body: 'Materials category has reached 79% of allocated budget', time: '5 hours ago', isRead: false, link: '/projects/1/budget' },
  { id: 'n3', type: 'milestoneDelay', title: 'Milestone at risk', body: 'Structure to 20th Floor may be delayed by 5 days', time: '1 day ago', isRead: true, link: '/projects/1/milestones' },
  { id: 'n4', type: 'ownerComment', title: 'Owner comment received', body: 'Mr. Desai commented on June 6 log entry', time: '2 days ago', isRead: true, link: '/projects/1/owner' },
];

export const teamMembers = [
  { id: 'u1', name: 'Rajesh Kumar', role: 'Site Engineer', email: 'rajesh@plinthhq.in', avatar: 'RK', status: 'active' },
  { id: 'u2', name: 'Priya Sharma', role: 'Project Manager', email: 'priya@plinthhq.in', avatar: 'PS', status: 'active' },
  { id: 'u3', name: 'Amit Patel', role: 'Site Engineer', email: 'amit@plinthhq.in', avatar: 'AP', status: 'active' },
  { id: 'u4', name: 'Suresh Desai', role: 'Owner', email: 'suresh.desai@email.com', avatar: 'SD', status: 'active' },
  { id: 'u5', name: 'Meera Nair', role: 'Accounts', email: 'meera@plinthhq.in', avatar: 'MN', status: 'active' },
];

export const billingPlans = [
  { name: 'Starter', price: 'Free', period: 'forever', features: ['1 project', '2 users', '5GB storage', 'Basic logs'], current: false },
  { name: 'Pro', price: '₹2,999', period: '/month', features: ['10 projects', '15 users', '50GB storage', 'All features', 'PDF reports'], current: true },
  { name: 'Business', price: '₹7,999', period: '/month', features: ['Unlimited projects', '50 users', '200GB storage', 'API access', 'Priority support'], current: false },
];

export const vendors = [
  { id: 'v1', name: 'UltraTech Cement', category: 'Materials', contact: '+91 98765 43210', pendingOrders: 2, totalSpend: 2450000 },
  { id: 'v2', name: 'Tata Steel', category: 'Materials', contact: '+91 98765 43211', pendingOrders: 1, totalSpend: 5680000 },
  { id: 'v3', name: 'Shree Contractors', category: 'Labour', contact: '+91 98765 43212', pendingOrders: 0, totalSpend: 8900000 },
  { id: 'v4', name: 'JCB Rentals', category: 'Equipment', contact: '+91 98765 43213', pendingOrders: 1, totalSpend: 780000 },
];

export const monthlyBudget = [
  { month: 'Jan', planned: 3200000, actual: 2980000 },
  { month: 'Feb', planned: 3500000, actual: 3650000 },
  { month: 'Mar', planned: 3800000, actual: 3720000 },
  { month: 'Apr', planned: 4100000, actual: 4280000 },
  { month: 'May', planned: 4200000, actual: 4150000 },
  { month: 'Jun', planned: 4500000, actual: 2890000 },
];

export const weatherIcons = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  stormy: '⛈️',
  foggy: '🌫️',
};

export const badgeColors = {
  active: 'bg-success/20 text-success',
  planning: 'bg-info text-navy',
  onHold: 'bg-warning/20 text-warning',
  completed: 'bg-muted/20 text-muted',
  // task status
  inProgress: 'bg-orange/20 text-orange-dark',
  delayed: 'bg-danger/20 text-danger',
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatCompactCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(amount);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
