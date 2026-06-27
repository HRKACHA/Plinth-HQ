import { 
  Camera, ShieldCheck, FileText, BarChart3, TrendingUp, Target, 
  Package, Wrench, Globe, MessageSquare, Users, Mic, Bot 
} from 'lucide-react';

export const FEATURES = [
  {
    category: 'Daily Operations',
    color: '#4285F4',
    items: [
      { icon: Camera, title: 'Photo-Evidence Logs', desc: 'Attach up to 20 photos per daily entry with automatic compression. Record weather, workforce count, and detailed observations.' },
      { icon: ShieldCheck, title: 'Issue & Snag Tracking', desc: 'Create punch-list items, set priority levels, and assign them directly to contractors with Kanban-style status tracking.' },
      { icon: FileText, title: 'Automated PDF Reports', desc: 'Instantly export professional PDF summaries of project budget, burn rate, and complete expense history.' },
    ]
  },
  {
    category: 'Financial Control',
    color: '#34A853',
    items: [
      { icon: BarChart3, title: 'Budget Dashboard', desc: 'Visual breakdown of budget allocation vs. actual spend with category-wise tracking and trend analysis.' },
      { icon: TrendingUp, title: 'Expense Management', desc: 'Log expenses with receipts, categorize by type, and get instant visibility into where every rupee is going.' },
      { icon: Target, title: 'Milestone Tracking', desc: 'Define project milestones with deadlines, track completion percentage, and get PM/Owner approval workflows.' },
    ]
  },
  {
    category: 'Resource Management',
    color: '#F59E0B',
    items: [
      { icon: Package, title: 'Material Inventory', desc: 'Track material stock with movements (in/out), supplier linkage, unit costs, and automatic low-stock notifications.' },
      { icon: Wrench, title: 'Equipment Portal', desc: 'Manage heavy equipment with assignment tracking, service history, maintenance schedules, and utilization rates.' },
      { icon: Globe, title: 'Vendor Management', desc: 'Maintain vendor directory with contact details, spending history, and performance records in one place.' },
    ]
  },
  {
    category: 'Collaboration',
    color: '#A855F7',
    items: [
      { icon: MessageSquare, title: 'Project-Wise Chat', desc: 'Real-time encrypted messaging scoped to each project. Only team members assigned to a project can access its chat.' },
      { icon: Camera, title: 'Project Photo Gallery', desc: 'A centralized masonry grid that automatically aggregates all photos uploaded across Daily Logs and Issues.' },
      { icon: Users, title: 'Team Management', desc: 'Invite members via email, assign roles (Engineer, Contractor, Accounts, Owner, PM), and manage rosters.' },
    ]
  },
  {
    category: 'AI & Accessibility',
    color: '#EC4899',
    items: [
      { icon: Mic, title: 'Voice Dictation', desc: 'Keep your gloves on. Log site updates, create issues, and chat using voice dictation directly from the job site.' },
      { icon: Globe, title: 'Multi-Language Translation', desc: 'Communicate seamlessly across regional languages with real-time translation for English, Hindi, and Gujarati.' },
      { icon: Bot, title: 'PlinthAI Assistant', desc: 'A floating, context-aware AI assistant available everywhere to answer project queries and help you navigate the platform instantly.' },
    ]
  },
];
