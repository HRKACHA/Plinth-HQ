import User from './models/User.js';
import Organisation from './models/Organisation.js';
import Project from './models/Project.js';
import SiteLog from './models/SiteLog.js';
import Expense from './models/Expense.js';
import Milestone from './models/Milestone.js';
import Document from './models/Document.js';
import Notification from './models/Notification.js';
import Vendor from './models/Vendor.js';
import { generateShareToken } from './utils/jwt.js';

export async function seedDatabase({ clear = true } = {}) {
  if (clear) {
    await Promise.all([
      User.deleteMany({}),
      Organisation.deleteMany({}),
      Project.deleteMany({}),
      SiteLog.deleteMany({}),
      Expense.deleteMany({}),
      Milestone.deleteMany({}),
      Document.deleteMany({}),
      Notification.deleteMany({}),
      Vendor.deleteMany({}),
    ]);
  }

  const org = await Organisation.create({
    name: 'BuildRight Constructions',
    plan: 'pro',
    maxProjects: 10,
    billingEmail: 'billing@buildright.in',
  });

  const pm = await User.create({
    name: 'Priya Sharma',
    email: 'priya@sitelog.in',
    password: 'password123',
    role: 'PM',
    organisation: org._id,
    phone: '+919876543210',
  });

  const engineer = await User.create({
    name: 'Rajesh Kumar',
    email: 'rajesh@sitelog.in',
    password: 'password123',
    role: 'Engineer',
    organisation: org._id,
  });

  const accounts = await User.create({
    name: 'Meera Nair',
    email: 'meera@sitelog.in',
    password: 'password123',
    role: 'Accounts',
    organisation: org._id,
  });

  org.owner = pm._id;
  await org.save();

  const project1 = await Project.create({
    name: 'Skyline Residency Tower B',
    description: '24-floor residential tower with basement parking',
    organisation: org._id,
    status: 'active',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2026-12-31'),
    location: { city: 'Pune', state: 'Maharashtra', address: 'Hinjewadi Phase 2' },
    coverPhoto: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    totalBudget: 45000000,
    progress: 68,
    budgetCategories: [
      { name: 'Materials', allocated: 18000000, spent: 0 },
      { name: 'Labour', allocated: 12000000, spent: 0 },
      { name: 'Equipment', allocated: 6000000, spent: 0 },
      { name: 'Overhead', allocated: 5000000, spent: 0 },
      { name: 'Contingency', allocated: 4000000, spent: 0 },
    ],
    team: [
      { user: pm._id, role: 'PM' },
      { user: engineer._id, role: 'Engineer' },
      { user: accounts._id, role: 'Accounts' },
    ],
  });
  project1.shareToken = generateShareToken(project1._id.toString());
  await project1.save();

  const project2 = await Project.create({
    name: 'Green Valley Commercial Complex',
    description: 'Mixed-use commercial development',
    organisation: org._id,
    status: 'active',
    startDate: new Date('2025-06-15'),
    endDate: new Date('2027-06-30'),
    location: { city: 'Bangalore', state: 'Karnataka' },
    coverPhoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    totalBudget: 78000000,
    progress: 42,
    budgetCategories: [
      { name: 'Materials', allocated: 31200000, spent: 0 },
      { name: 'Labour', allocated: 21000000, spent: 0 },
      { name: 'Equipment', allocated: 10000000, spent: 0 },
      { name: 'Overhead', allocated: 8800000, spent: 0 },
      { name: 'Contingency', allocated: 7000000, spent: 0 },
    ],
    team: [{ user: pm._id, role: 'PM' }, { user: engineer._id, role: 'Engineer' }],
  });
  project2.shareToken = generateShareToken(project2._id.toString());
  await project2.save();

  await SiteLog.insertMany([
    {
      project: project1._id,
      date: new Date('2026-06-08'),
      weather: 'sunny',
      temperature: 34,
      activities: 'Completed slab casting for 14th floor. Installed rebar for column grid C1-C8.',
      remarks: 'Concrete pour delayed 2 hours due to traffic.',
      photos: [{ url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=60' }],
      labour: [
        { trade: 'mason', present: 24, absent: 0 },
        { trade: 'carpenter', present: 12, absent: 0 },
        { trade: 'electrician', present: 8, absent: 0 },
        { trade: 'plumber', present: 6, absent: 0 },
      ],
      materials: [{ name: 'Cement', qty: '200', unit: 'bags', supplier: 'UltraTech' }],
      createdBy: engineer._id,
    },
    {
      project: project1._id,
      date: new Date('2026-06-07'),
      weather: 'cloudy',
      temperature: 31,
      activities: 'Formwork removal on 13th floor. Electrical conduit laying in progress.',
      labour: [{ trade: 'mason', present: 20, absent: 0 }, { trade: 'electrician', present: 14, absent: 0 }],
      materials: [{ name: 'Sand', qty: '15', unit: 'cubic m', supplier: 'Local' }],
      createdBy: engineer._id,
    },
    {
      project: project1._id,
      date: new Date('2026-06-06'),
      weather: 'rainy',
      temperature: 28,
      activities: 'Work halted after 11 AM due to heavy rain.',
      labour: [{ trade: 'mason', present: 8, absent: 0 }],
      createdBy: engineer._id,
      isLocked: true,
    },
  ]);

  await Expense.insertMany([
    { project: project1._id, category: 'material', vendor: 'UltraTech Cement', description: 'Cement supply', amount: 185000, invoiceDate: new Date('2026-06-07'), addedBy: accounts._id },
    { project: project1._id, category: 'labour', vendor: 'Shree Contractors', description: 'Weekly labour', amount: 420000, invoiceDate: new Date('2026-06-05'), addedBy: accounts._id },
    { project: project1._id, category: 'equipment', vendor: 'JCB Rentals', description: 'Excavator rental', amount: 95000, invoiceDate: new Date('2026-06-03'), addedBy: accounts._id },
    { project: project1._id, category: 'material', vendor: 'Tata Steel', description: 'TMT bars', amount: 890000, invoiceDate: new Date('2026-05-28'), addedBy: accounts._id },
  ]);

  await Milestone.insertMany([
    { project: project1._id, title: 'Foundation Complete', status: 'completed', startDate: new Date('2025-03-01'), endDate: new Date('2025-05-15'), weightage: 15, assignee: engineer._id, order: 0, actualEnd: new Date('2025-05-14') },
    { project: project1._id, title: 'Structure to 10th Floor', status: 'completed', startDate: new Date('2025-05-16'), endDate: new Date('2025-10-30'), weightage: 25, assignee: pm._id, order: 1, actualEnd: new Date('2025-10-28') },
    { project: project1._id, title: 'Structure to 20th Floor', status: 'inProgress', startDate: new Date('2025-11-01'), endDate: new Date('2026-04-30'), weightage: 25, assignee: engineer._id, order: 2 },
    { project: project1._id, title: 'MEP Installation', status: 'planned', startDate: new Date('2026-05-01'), endDate: new Date('2026-09-30'), weightage: 20, order: 3 },
    { project: project1._id, title: 'Finishing & Handover', status: 'planned', startDate: new Date('2026-10-01'), endDate: new Date('2026-12-31'), weightage: 15, assignee: pm._id, order: 4 },
  ]);

  await Document.insertMany([
    { project: project1._id, name: 'Architectural Drawings - Rev 4', type: 'drawing', fileUrl: '/uploads/sample.pdf', fileSize: 12400000, version: 4, tags: ['architecture'], uploadedBy: pm._id },
    { project: project1._id, name: 'Building Permit', type: 'permit', fileUrl: '/uploads/sample.pdf', fileSize: 1800000, tags: ['legal'], uploadedBy: pm._id },
  ]);

  await Notification.insertMany([
    { recipient: pm._id, project: project1._id, type: 'newLog', title: 'New daily log submitted', body: 'Rajesh Kumar submitted log for June 8', link: `/projects/${project1._id}/logs`, isRead: false },
    { recipient: pm._id, project: project1._id, type: 'budgetAlert', title: 'Budget threshold reached', body: 'Materials at 79% of budget', link: `/projects/${project1._id}/budget`, isRead: false },
  ]);

  await Vendor.insertMany([
    { organisation: org._id, name: 'UltraTech Cement', category: 'Materials', contact: '+91 98765 43210', pendingOrders: 2, totalSpend: 2450000 },
    { organisation: org._id, name: 'Tata Steel', category: 'Materials', contact: '+91 98765 43211', pendingOrders: 1, totalSpend: 5680000 },
    { organisation: org._id, name: 'Shree Contractors', category: 'Labour', contact: '+91 98765 43212', totalSpend: 8900000 },
    { organisation: org._id, name: 'JCB Rentals', category: 'Equipment', contact: '+91 98765 43213', pendingOrders: 1, totalSpend: 780000 },
  ]);

  console.log('✅ Demo data seeded — priya@sitelog.in / password123');
  return { project1, pm };
}

export async function seedOrgData(orgId, userId) {
  const project1 = await Project.create({
    name: 'Skyline Residency Tower B',
    description: '24-floor residential tower with basement parking',
    organisation: orgId,
    status: 'active',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2026-12-31'),
    location: { city: 'Pune', state: 'Maharashtra', address: 'Hinjewadi Phase 2' },
    coverPhoto: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    totalBudget: 45000000,
    progress: 68,
    budgetCategories: [
      { name: 'Materials', allocated: 18000000, spent: 185000 },
      { name: 'Labour', allocated: 12000000, spent: 420000 },
      { name: 'Equipment', allocated: 6000000, spent: 95000 },
      { name: 'Overhead', allocated: 5000000, spent: 0 },
      { name: 'Contingency', allocated: 4000000, spent: 0 },
    ],
    team: [{ user: userId, role: 'PM' }],
  });
  project1.shareToken = generateShareToken(project1._id.toString());
  await project1.save();

  const project2 = await Project.create({
    name: 'Green Valley Commercial Complex',
    description: 'Mixed-use commercial development',
    organisation: orgId,
    status: 'active',
    startDate: new Date('2025-06-15'),
    endDate: new Date('2027-06-30'),
    location: { city: 'Bangalore', state: 'Karnataka' },
    coverPhoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    totalBudget: 78000000,
    progress: 0,
    budgetCategories: [
      { name: 'Materials', allocated: 31200000, spent: 0 },
      { name: 'Labour', allocated: 21000000, spent: 0 },
      { name: 'Equipment', allocated: 10000000, spent: 0 },
      { name: 'Overhead', allocated: 8800000, spent: 0 },
      { name: 'Contingency', allocated: 7000000, spent: 0 },
    ],
    team: [{ user: userId, role: 'PM' }],
  });
  project2.shareToken = generateShareToken(project2._id.toString());
  await project2.save();

  const SiteLog = (await import('./models/SiteLog.js')).default;
  await SiteLog.insertMany([
    {
      project: project1._id,
      date: new Date('2026-06-08'),
      weather: 'sunny',
      temperature: 34,
      activities: 'Completed slab casting for 14th floor. Installed rebar for column grid C1-C8.',
      remarks: 'Concrete pour delayed 2 hours due to traffic.',
      photos: [{ url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=60' }],
      labour: [
        { trade: 'mason', present: 24, absent: 0 },
        { trade: 'carpenter', present: 12, absent: 0 },
        { trade: 'electrician', present: 8, absent: 0 },
        { trade: 'plumber', present: 6, absent: 0 },
      ],
      materials: [{ name: 'Cement', qty: '200', unit: 'bags', supplier: 'UltraTech' }],
      createdBy: userId,
    },
    {
      project: project1._id,
      date: new Date('2026-06-07'),
      weather: 'cloudy',
      temperature: 31,
      activities: 'Formwork removal on 13th floor. Electrical conduit laying in progress.',
      labour: [{ trade: 'mason', present: 20, absent: 0 }, { trade: 'electrician', present: 14, absent: 0 }],
      materials: [{ name: 'Sand', qty: '15', unit: 'cubic m', supplier: 'Local' }],
      createdBy: userId,
    },
  ]);

  const Expense = (await import('./models/Expense.js')).default;
  await Expense.insertMany([
    { project: project1._id, category: 'material', vendor: 'UltraTech Cement', description: 'Cement supply', amount: 185000, invoiceDate: new Date('2026-06-07'), addedBy: userId },
    { project: project1._id, category: 'labour', vendor: 'Shree Contractors', description: 'Weekly labour', amount: 420000, invoiceDate: new Date('2026-06-05'), addedBy: userId },
    { project: project1._id, category: 'equipment', vendor: 'JCB Rentals', description: 'Excavator rental', amount: 95000, invoiceDate: new Date('2026-06-03'), addedBy: userId },
  ]);

  const Milestone = (await import('./models/Milestone.js')).default;
  await Milestone.insertMany([
    { project: project1._id, title: 'Foundation Complete', status: 'completed', startDate: new Date('2025-03-01'), endDate: new Date('2025-05-15'), weightage: 15, assignee: userId, order: 0, actualEnd: new Date('2025-05-14') },
    { project: project1._id, title: 'Structure to 10th Floor', status: 'completed', startDate: new Date('2025-05-16'), endDate: new Date('2025-10-30'), weightage: 25, assignee: userId, order: 1, actualEnd: new Date('2025-10-28') },
    { project: project1._id, title: 'Structure to 20th Floor', status: 'inProgress', startDate: new Date('2025-11-01'), endDate: new Date('2026-04-30'), weightage: 25, assignee: userId, order: 2 },
  ]);

  const Document = (await import('./models/Document.js')).default;
  await Document.insertMany([
    { project: project1._id, name: 'Architectural Drawings - Rev 4', type: 'drawing', fileUrl: '/uploads/sample.pdf', fileSize: 12400000, version: 4, tags: ['architecture'], uploadedBy: userId },
    { project: project1._id, name: 'Building Permit', type: 'permit', fileUrl: '/uploads/sample.pdf', fileSize: 1800000, tags: ['legal'], uploadedBy: userId },
  ]);

  const Notification = (await import('./models/Notification.js')).default;
  await Notification.insertMany([
    { recipient: userId, project: project1._id, type: 'budgetAlert', title: 'Budget threshold reached', body: 'Materials at 79% of budget', link: `/projects/${project1._id}/budget`, isRead: false },
  ]);

  const Vendor = (await import('./models/Vendor.js')).default;
  await Vendor.insertMany([
    { organisation: orgId, name: 'UltraTech Cement', category: 'Materials', contact: '+91 98765 43210', pendingOrders: 2, totalSpend: 2450000 },
    { organisation: orgId, name: 'Tata Steel', category: 'Materials', contact: '+91 98765 43211', pendingOrders: 1, totalSpend: 5680000 },
  ]);
}
