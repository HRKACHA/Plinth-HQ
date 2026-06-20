import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, ClipboardList, IndianRupee, AlertTriangle, Plus,
  Sun, ArrowUpRight, FileText, Upload, CalendarClock, Activity,
  TrendingUp, Building2, Pencil, Package, CheckCircle2,
  Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import StatCard from '../components/common/StatCard';
import GlassSelect from '../components/common/GlassSelect';
import ProjectCard from '../components/common/ProjectCard';
import { formatCurrency, formatCompactCurrency } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { projectApi, notificationApi, uploadApi, budgetApi, logApi } from '../api/index';

import GlassDatePicker from '../components/common/GlassDatePicker';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
export default function Dashboard() {
  const { user } = useAuth();
  const { data: projects, loading: loadingProjects, refresh } = useAsync(() => projectApi.list(), []);
  const { data: notifications } = useAsync(() => notificationApi.list(), []);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [burnRateFilter, setBurnRateFilter] = useState('all');

  // Material Form State
  const [materialForm, setMaterialForm] = useState({
    projectId: '',
    name: '',
    quantity: '',
    supplier: '',
    price: ''
  });
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [materialSuccess, setMaterialSuccess] = useState(false);

  const [weatherData, setWeatherData] = useState({ temp: '--', condition: 'Loading...', icon: Sun, city: 'Local Site' });

  useEffect(() => {
    async function fetchWeather() {
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        if (!geoRes.ok) throw new Error('Geo failed');
        const geo = await geoRes.json();
        
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`);
        if (!wRes.ok) throw new Error('Weather failed');
        const w = await wRes.json();
        
        const code = w.current_weather.weathercode;
        let condition = 'Clear';
        let Icon = Sun;
        
        if (code >= 1 && code <= 3) { condition = 'Cloudy'; Icon = Cloud; }
        if (code >= 45 && code <= 48) { condition = 'Foggy'; Icon = CloudFog; }
        if (code >= 51 && code <= 67) { condition = 'Rainy'; Icon = CloudRain; }
        if (code >= 71 && code <= 77) { condition = 'Snowy'; Icon = CloudSnow; }
        if (code >= 80 && code <= 82) { condition = 'Showers'; Icon = CloudRain; }
        if (code >= 95) { condition = 'Thunderstorm'; Icon = CloudLightning; }
        
        setWeatherData({
          temp: `${Math.round(w.current_weather.temperature)}°C`,
          condition,
          icon: Icon,
          city: geo.city || 'Site'
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
        setWeatherData({ temp: '34°C', condition: 'Sunny', icon: Sun, city: 'Site' });
      }
    }
    fetchWeather();
  }, []);

  const openEdit = (p) => {
    setSelectedProject(p);
    setFormData({
      name: p.name,
      description: p.description,
      location: p.location,
      state: p.state || '',
      progress: p.progress || 0,
      totalBudget: p.totalBudget,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      coverPhoto: p.coverPhoto || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        location: { city: formData.location },
        totalBudget: Number(formData.totalBudget)
      };
      await projectApi.update(selectedProject._id || selectedProject.id, payload);
      setShowEditModal(false);
      setSelectedProject(null);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const data = await uploadApi.file(file);
      setFormData(prev => ({ ...prev, coverPhoto: data.url }));
    } catch (err) {
      alert('Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    setMaterialSubmitting(true);
    setMaterialSuccess(false);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const newMat = {
        name: materialForm.name,
        qty: materialForm.quantity,
        unit: 'Units',
        supplier: materialForm.supplier,
        price: Number(materialForm.price),
        recdAt: dateStr
      };

      const logs = await logApi.list(materialForm.projectId);
      const existingLog = logs.find(l => l.date.substring(0, 10) === dateStr);
      
      if (existingLog) {
        await logApi.update(materialForm.projectId, existingLog._id || existingLog.id, {
          materials: [...(existingLog.materials || []), newMat]
        });
      } else {
        let apiWeather = 'sunny';
        const cond = weatherData.condition.toLowerCase();
        if (cond.includes('cloud')) apiWeather = 'cloudy';
        if (cond.includes('fog')) apiWeather = 'foggy';
        if (cond.includes('rain') || cond.includes('shower') || cond.includes('snow')) apiWeather = 'rainy';
        if (cond.includes('thunderstorm')) apiWeather = 'stormy';

        await logApi.create(materialForm.projectId, {
          date: dateStr,
          weather: apiWeather,
          activities: `Material Delivery: ${materialForm.name}`,
          materials: [newMat]
        });
      }

      const payload = {
        category: 'material',
        description: `${materialForm.name} (Qty: ${materialForm.quantity})`,
        amount: Number(materialForm.price),
        invoiceDate: new Date().toISOString(),
        vendor: materialForm.supplier || 'Various Suppliers'
      };
      await budgetApi.createExpense(materialForm.projectId, payload);

      setMaterialSuccess(true);
      setMaterialForm({ projectId: '', name: '', quantity: '', supplier: '', price: '' });
      setTimeout(() => setMaterialSuccess(false), 3000);
      refresh();
    } catch (err) {
      console.error('Submit Error:', err);
      alert(err.response?.data?.message || 'Failed to add material log or expense');
    } finally {
      setMaterialSubmitting(false);
    }
  };

  if (loadingProjects) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <div className="skeleton h-8 w-64 mb-2" />
              <div className="skeleton h-4 w-40" />
            </div>
            <div className="skeleton h-10 w-36 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  const safeProjects = projects || [];
  const safeNotifications = notifications || [];

  const totalBudget = safeProjects.reduce((s, p) => s + (p.totalBudget || 0), 0);
  const totalSpent = safeProjects.reduce((s, p) => s + (p.spent || 0), 0);
  const activeProjects = safeProjects.filter((p) => p.status === 'active').length;
  const unreadNotifs = safeNotifications.filter((n) => !n.isRead);

  const displayBudget = budgetFilter === 'all' ? totalBudget : (safeProjects.find(p => (p._id || p.id) === budgetFilter)?.totalBudget || 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const displayBurnRateProject = burnRateFilter === 'all' ? null : safeProjects.find(p => (p._id || p.id) === burnRateFilter);
  const displayBurnRateBudget = displayBurnRateProject ? (displayBurnRateProject.totalBudget || 0) : totalBudget;
  const displayBurnRateSpent = displayBurnRateProject ? (displayBurnRateProject.spent || 0) : totalSpent;
  const displayBurnRatePct = displayBurnRateBudget ? Math.round((displayBurnRateSpent / displayBurnRateBudget) * 100) : 0;


  return (
    <AppLayout>
      <div className="animate-fadeIn">
        {/* Welcome hero */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-navy lg:text-3xl tracking-tight">
              {greeting}, <span className="text-orange">{user?.name?.split(' ')[0]}</span>
            </h2>
            <p className="mt-1 text-sm text-white/30">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link to="/projects" className="btn-accent">
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8">
          <StatCard label="Active Projects" value={activeProjects} sub={`${safeProjects.length} total`} icon={FolderKanban} accent="navy" />
          <StatCard label="Total Budget" value={formatCompactCurrency(displayBudget)} sub={budgetFilter === 'all' ? "Across all projects" : safeProjects.find(p => (p._id || p.id) === budgetFilter)?.name} icon={IndianRupee} accent="orange">
            <GlassSelect
              value={budgetFilter}
              onChange={setBudgetFilter}
              accent="orange"
              options={[
                { value: 'all', label: 'All Projects' },
                ...safeProjects.map(p => ({ value: p._id || p.id, label: p.name }))
              ]}
            />
          </StatCard>
          <StatCard label="Burn Rate" value={`${displayBurnRatePct}%`} sub={formatCompactCurrency(displayBurnRateSpent) + ' spent'} icon={TrendingUp} accent="danger">
            <GlassSelect
              value={burnRateFilter}
              onChange={setBurnRateFilter}
              accent="danger"
              options={[
                { value: 'all', label: 'All Projects' },
                ...safeProjects.map(p => ({ value: p._id || p.id, label: p.name }))
              ]}
            />
          </StatCard>
          <StatCard label="Alerts" value={unreadNotifs.length} sub="Require attention" icon={AlertTriangle} accent="danger" />
        </div>


        {/* Main grid: Projects + sidebar */}
        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          {/* Projects section */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange" /> Your Projects
              </h3>
              <Link to="/projects" className="flex items-center gap-1 text-sm font-semibold text-orange hover:text-orange-light transition">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {safeProjects.slice(0, 4).map((p) => (
                <div key={p._id || p.id} className="relative group">
                  <ProjectCard project={{ ...p, id: p._id || p.id, team: p.teamCount || p.team?.length || 0 }} />
                  {user?.role === 'PM' && (
                    <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
                      <button onClick={(e) => { e.preventDefault(); openEdit(p); }} className="p-1.5 rounded-lg text-white hover:bg-orange hover:text-white transition shadow-sm"
                        style={{ background: 'rgba(16,18,24,0.70)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!safeProjects.length && (
                <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl p-12 text-center animate-slideUp"
                  style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(16,18,24,0.12)', backdropFilter: 'blur(12px)' }}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <FolderKanban className="h-8 w-8 text-white/20" />
                  </div>
                  <h4 className="mt-5 text-base font-bold text-navy tracking-tight">No projects yet</h4>
                  <p className="mt-2 max-w-xs text-sm text-white/30">
                    Create your first project to start tracking daily logs, budgets, and milestones.
                  </p>
                  <Link to="/projects" className="btn-accent mt-6">
                    <Plus className="h-4 w-4" /> Create First Project
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Weather widget */}
            <div className="card overflow-hidden !p-0 !border-0 shadow-elevated">
              <div className="relative p-6" style={{ background: 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #0f172a 100%)' }}>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-white/50 font-semibold tracking-wide uppercase">Site Weather • {weatherData.city}</p>
                    <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-white">{weatherData.temp}</p>
                    <p className="mt-2 text-xs text-white/40 font-medium px-2 py-1 rounded-md inline-block" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>{weatherData.condition}</p>
                  </div>
                  <weatherData.icon className="h-16 w-16 text-white/10" />
                </div>
              </div>
            </div>

            {/* Quick Add Material */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange" /> Quick Add Material
                </h3>
              </div>
              {safeProjects.length > 0 ? (
                <form className="space-y-3" onSubmit={handleMaterialSubmit}>
                  <CustomSelectMenu
                    value={materialForm.projectId}
                    onChange={val => setMaterialForm({ ...materialForm, projectId: val })}
                    options={[{value: '', label: 'Select Project...'}, ...safeProjects.map(p => ({value: p.id || p._id, label: p.name}))]}
                    placeholder="Select Project"
                    className="mb-3"
                  />
                  <input
                    type="text"
                    placeholder="Material Name (e.g. Cement)"
                    className="input-field py-2 text-sm"
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Quantity (e.g. 50 bags)"
                      className="input-field py-2 text-sm"
                      value={materialForm.quantity}
                      onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Total Price (₹)"
                      className="input-field py-2 text-sm"
                      min="0"
                      value={materialForm.price}
                      onChange={(e) => setMaterialForm({ ...materialForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    className="input-field py-2 text-sm"
                    value={materialForm.supplier}
                    onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                    required
                  />
                  <button type="submit" disabled={materialSubmitting} className="btn-accent w-full py-2.5 text-sm mt-2">
                    {materialSubmitting ? 'Adding...' : 'Add Material'}
                  </button>
                  {materialSuccess && (
                    <div className="flex items-center gap-2 text-sm text-success mt-2 justify-center py-1.5 rounded-xl" style={{ background: 'rgba(74,200,140,0.06)', border: '1px solid rgba(74,200,140,0.10)' }}>
                      <CheckCircle2 className="h-4 w-4" /> Material added successfully!
                    </div>
                  )}
                </form>
              ) : (
                <p className="text-sm text-white/30">Create a project first</p>
              )}
            </div>

            {/* Recent alerts */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-danger" /> Recent Alerts
                </h3>
                <Link to="/notifications" className="text-xs font-semibold text-orange hover:text-orange-light transition-colors">See all</Link>
              </div>
              <div className="space-y-2">
                {safeNotifications.slice(0, 4).map((n) => (
                  <Link
                    key={n._id}
                    to={n.link || '/notifications'}
                    className={`block rounded-xl p-3 transition-colors border border-transparent hover:bg-white/3 ${!n.isRead ? 'border-l-2 !border-l-orange bg-orange/5' : ''}`}
                    style={{ borderColor: !n.isRead ? undefined : 'transparent' }}
                  >
                    <p className="text-sm font-semibold text-navy">{n.title}</p>
                    <p className="mt-1 text-xs text-white/30 line-clamp-2">{n.body}</p>
                  </Link>
                ))}
                {!safeNotifications.length && (
                  <div className="text-center py-6 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="text-sm font-medium text-white/30">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedProject && (
        <div className="modal-backdrop z-[100]">
          <div className="modal-content max-w-lg p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-navy tracking-tight">Edit Project</h3>
            </div>
            <form onSubmit={handleEdit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Project Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field min-h-[100px] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">City / Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" placeholder="e.g. Pune" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input-field" placeholder="e.g. Maharashtra" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Start Date *</label>
                  <GlassDatePicker value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">End Date *</label>
                  <GlassDatePicker value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Total Budget (₹) *</label>
                  <input type="number" value={formData.totalBudget} onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })} className="input-field" required min="0" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">Current Progress (%)</label>
                  <input type="number" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} className="input-field" min="0" max="100" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-navy">Cover Photo</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-xl px-4 py-6 text-sm font-semibold text-white/60 transition-colors hover:text-orange"
                      style={{ border: '1px dashed rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>
                      <Upload className="h-5 w-5" />
                      <span>Click to upload image</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={submitting} className="hidden" />
                  </label>
                  {formData.coverPhoto && <img src={formData.coverPhoto} alt="Cover" className="h-20 w-20 shrink-0 rounded-xl object-cover shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />}
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary px-6">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-accent px-8">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
