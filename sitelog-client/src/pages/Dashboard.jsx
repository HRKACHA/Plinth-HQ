import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, ClipboardList, IndianRupee, AlertTriangle, Plus,
  Sun, ArrowUpRight, FileText, Upload, CalendarClock, Activity,
  TrendingUp, Building2, Pencil, Package, CheckCircle2,
  Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning,
  AlertCircle, TrendingDown, Loader2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import AppLayout from '../components/layout/AppLayout';
import StatCard from '../components/common/StatCard';
import GlassSelect from '../components/common/GlassSelect';
import ProjectCard from '../components/common/ProjectCard';
import { formatCurrency, formatCompactCurrency } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAsync } from '../hooks/useAsync';
import { projectApi, notificationApi, uploadApi, budgetApi, logApi } from '../api/index';

import GlassDatePicker from '../components/common/GlassDatePicker';
import CustomSelectMenu from '../components/common/CustomSelectMenu';
export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
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
    unit: 'bags',
    customUnit: '',
    supplier: '',
    price: ''
  });
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [materialSuccess, setMaterialSuccess] = useState(false);

  const [weathers, setWeathers] = useState([]);
  const [currentWeatherIndex, setCurrentWeatherIndex] = useState(0);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [slideDir, setSlideDir] = useState('fadeIn');

  useEffect(() => {
    async function fetchAllWeather() {
      if (!projects || projects.length === 0) {
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          const geo = await geoRes.json();
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`);
          const w = await wRes.json();
          const code = w.current_weather.weathercode;
          let condition = 'Clear'; let Icon = Sun;
          if (code >= 1 && code <= 3) { condition = 'Cloudy'; Icon = Cloud; }
          if (code >= 45 && code <= 48) { condition = 'Foggy'; Icon = CloudFog; }
          if (code >= 51 && code <= 67) { condition = 'Rainy'; Icon = CloudRain; }
          if (code >= 71 && code <= 77) { condition = 'Snowy'; Icon = CloudSnow; }
          if (code >= 80 && code <= 82) { condition = 'Showers'; Icon = CloudRain; }
          if (code >= 95) { condition = 'Thunderstorm'; Icon = CloudLightning; }
          setWeathers([{ temp: `${Math.round(w.current_weather.temperature)}°C`, condition, icon: Icon, city: geo.city || 'Local Site', projectName: 'Local' }]);
        } catch (err) {
          setWeathers([{ temp: '--', condition: 'Unavailable', icon: Sun, city: 'Local Site', projectName: 'Local' }]);
        }
        return;
      }

      let fallbackLat, fallbackLon, fallbackCity = 'Local Site';
      try {
        const fallbackGeo = await fetch('https://ipapi.co/json/').then(r => r.json());
        fallbackLat = fallbackGeo.latitude;
        fallbackLon = fallbackGeo.longitude;
        fallbackCity = fallbackGeo.city || 'Local Site';
      } catch (e) {
        console.error("Fallback geo failed");
      }

      const weatherResults = [];
      const uniqueCities = [...new Set(projects.map(p => p.location?.city || p.location))].filter(Boolean);

      const geoMap = {};
      for (const city of uniqueCities) {
        try {
          const cleanCity = typeof city === 'string' ? city : String(city);
          const searchQuery = cleanCity.split(',')[0].trim();
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`);
          const geo = await geoRes.json();
          if (geo.results && geo.results.length > 0) {
            geoMap[city] = { lat: geo.results[0].latitude, lon: geo.results[0].longitude };
          }
        } catch (e) {
          console.error("Geocode error for", city, e);
        }
      }

      for (const proj of projects) {
        const city = proj.location?.city || proj.location || 'Unknown';
        let weatherObj = { temp: '--', condition: 'Unavailable', icon: Sun, city: city, projectId: proj._id || proj.id, projectName: proj.name };

        let lat = fallbackLat;
        let lon = fallbackLon;
        let resolvedCity = fallbackCity;

        if (geoMap[city]) {
          lat = geoMap[city].lat;
          lon = geoMap[city].lon;
          resolvedCity = typeof city === 'string' ? city : resolvedCity;
        }

        if (lat && lon) {
          try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const w = await wRes.json();
            if (w.current_weather) {
              const code = w.current_weather.weathercode;
              let condition = 'Clear'; let Icon = Sun;
              if (code >= 1 && code <= 3) { condition = 'Cloudy'; Icon = Cloud; }
              if (code >= 45 && code <= 48) { condition = 'Foggy'; Icon = CloudFog; }
              if (code >= 51 && code <= 67) { condition = 'Rainy'; Icon = CloudRain; }
              if (code >= 71 && code <= 77) { condition = 'Snowy'; Icon = CloudSnow; }
              if (code >= 80 && code <= 82) { condition = 'Showers'; Icon = CloudRain; }
              if (code >= 95) { condition = 'Thunderstorm'; Icon = CloudLightning; }
              weatherObj = { ...weatherObj, temp: `${Math.round(w.current_weather.temperature)}°C`, condition, icon: Icon, city: resolvedCity };
            }
          } catch (e) {
            console.error("Weather fetch failed for", proj.name, e);
          }
        }
        weatherResults.push(weatherObj);
      }
      setWeathers(weatherResults);
    }
    fetchAllWeather();
  }, [projects]);

  useEffect(() => {
    let activeFilter = 'all';
    if (budgetFilter !== 'all') activeFilter = budgetFilter;
    else if (burnRateFilter !== 'all') activeFilter = burnRateFilter;

    if (activeFilter !== 'all') {
      const idx = weathers.findIndex(w => w.projectId === activeFilter);
      if (idx !== -1) setCurrentWeatherIndex(idx);
      return;
    }

    if (weathers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentWeatherIndex(prev => (prev + 1) % weathers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [weathers, budgetFilter, burnRateFilter]);

  const openEdit = (p) => {
    setSelectedProject(p);
    let city = '';
    let state = '';
    if (typeof p.location === 'string') {
      const parts = p.location.split(', ');
      city = parts[0] || '';
      state = parts.slice(1).join(', ') || '';
    } else if (p.location) {
      city = p.location.city || '';
      state = p.location.state || '';
    }
    setFormData({
      name: p.name,
      description: p.description,
      location: city,
      state: state,
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
        location: { city: formData.location, state: formData.state },
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
        unit: materialForm.unit === 'Other' ? materialForm.customUnit : materialForm.unit,
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
        const projWeather = weathers.find(w => (w.projectId === materialForm.projectId || w.projectId === (materialForm.projectId?._id || materialForm.projectId?.id)));
        const cond = projWeather ? projWeather.condition.toLowerCase() : 'sunny';
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
      setMaterialForm({ projectId: '', name: '', quantity: '', unit: 'bags', customUnit: '', supplier: '', price: '' });
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
            <p className="mt-1 text-sm text-navy/80 dark:text-white/60">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link to="/projects" className="btn-accent">
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4 mb-6 sm:mb-8 relative z-50">
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
        <div className="flex flex-col lg:grid gap-4 sm:gap-8 lg:grid-cols-3">
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
              <div className="relative pb-6">
                {safeProjects.length > 0 ? (
                  <>
                    {/* Mobile/Tablet Slider */}
                    <div className="lg:hidden relative group overflow-hidden rounded-2xl">
                      <AnimatePresence mode="wait" custom={slideDir}>
                        <motion.div
                          key={currentProjectIndex}
                          custom={slideDir}
                          initial={{ opacity: 0, x: slideDir === 'slideLeft' ? 50 : -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: slideDir === 'slideLeft' ? -50 : 50 }}
                          transition={{ duration: 0.2 }}
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.2}
                          onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x;
                            if (swipe < -50) {
                              setSlideDir('slideLeft');
                              setCurrentProjectIndex((prev) => (prev + 1) % safeProjects.length);
                            } else if (swipe > 50) {
                              setSlideDir('slideRight');
                              setCurrentProjectIndex((prev) => (prev - 1 + safeProjects.length) % safeProjects.length);
                            }
                          }}
                          className="relative"
                        >
                          <ProjectCard project={{ ...safeProjects[currentProjectIndex], id: safeProjects[currentProjectIndex]._id || safeProjects[currentProjectIndex].id, team: safeProjects[currentProjectIndex].teamCount || safeProjects[currentProjectIndex].team?.length || 0 }} />
                          {user?.role === 'PM' && (
                            <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
                              <button onClick={(e) => { e.preventDefault(); openEdit(safeProjects[currentProjectIndex]); }} className="p-1.5 rounded-lg text-white hover:bg-orange hover:text-white transition shadow-sm"
                                style={{ background: 'rgba(16,18,24,0.70)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Pencil className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                      {safeProjects.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              setSlideDir('slideRight');
                              setCurrentProjectIndex((prev) => (prev - 1 + safeProjects.length) % safeProjects.length);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white transition opacity-100 sm:opacity-0 group-hover:opacity-100 z-10 shadow-lg hover:scale-110"
                            style={{ background: 'rgba(16,18,24,0.6)', backdropFilter: 'blur(4px)' }}
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => {
                              setSlideDir('slideLeft');
                              setCurrentProjectIndex((prev) => (prev + 1) % safeProjects.length);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white transition opacity-100 sm:opacity-0 group-hover:opacity-100 z-10 shadow-lg hover:scale-110"
                            style={{ background: 'rgba(16,18,24,0.6)', backdropFilter: 'blur(4px)' }}
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                          <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                            {safeProjects.map((_, idx) => (
                              <span key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentProjectIndex ? 'w-5 bg-orange' : 'w-1.5 bg-navy/20 dark:bg-white/20'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Desktop Grid */}
                    <div className="hidden lg:grid grid-cols-2 gap-4 xl:gap-6">
                      {safeProjects.map((p, idx) => (
                        <div key={idx} className="relative group animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
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
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl p-12 text-center animate-slideUp"
                    style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(16,18,24,0.12)', backdropFilter: 'blur(12px)' }}>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <FolderKanban className="h-8 w-8 text-navy/20 dark:text-white/20" />
                    </div>
                    <h4 className="mt-5 text-base font-bold text-navy tracking-tight">No projects yet</h4>
                    <p className="mt-2 max-w-xs text-sm text-navy/80 dark:text-white/60">
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
                <div className="relative p-6 transition-all duration-300" style={{ background: 'linear-gradient(135deg, var(--gradient-card-start) 0%, var(--gradient-card-mid) 50%, var(--gradient-card-end) 100%)' }}>
                  <div className="flex items-center justify-between relative z-10">
                    {weathers.length > 0 ? (
                      <div key={currentWeatherIndex} className="animate-fadeIn w-full flex items-center justify-between min-h-[100px]">
                        <div>
                          <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--weather-text)' }}>Weather • {weathers[currentWeatherIndex].projectName}</p>
                          <p className="mt-1 font-mono text-4xl font-bold tracking-tight" style={{ color: 'var(--weather-heading)' }}>{weathers[currentWeatherIndex].temp}</p>
                          <p className="mt-2 text-xs font-medium px-2 py-1 rounded-md inline-block" style={{ color: 'var(--weather-text)', background: 'var(--weather-badge-bg)', backdropFilter: 'blur(8px)' }}>
                            {weathers[currentWeatherIndex].condition} • {weathers[currentWeatherIndex].city}
                          </p>
                        </div>
                        {(() => {
                          const WIcon = weathers[currentWeatherIndex].icon;
                          return <WIcon className="h-16 w-16" style={{ color: 'var(--weather-icon)' }} />;
                        })()}
                      </div>
                    ) : (
                      <div className="min-h-[100px]">
                        <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--weather-text)' }}>Site Weather</p>
                        <p className="mt-1 font-mono text-4xl font-bold tracking-tight" style={{ color: 'var(--weather-heading)' }}>--</p>
                      </div>
                    )}
                  </div>
                  {/* Carousel Indicators */}
                  {weathers.length > 1 && (budgetFilter === 'all' && burnRateFilter === 'all') && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {weathers.map((_, idx) => (
                        <span key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentWeatherIndex ? 'w-4 bg-orange' : 'w-1.5 bg-navy/20 dark:bg-white/20'}`} />
                      ))}
                    </div>
                  )}
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
                      options={[{ value: '', label: 'Select Project...' }, ...safeProjects.map(p => ({ value: p.id || p._id, label: p.name }))]}
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
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          className="input-field py-2 text-sm w-1/2"
                          value={materialForm.quantity}
                          onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                          required min="0" step="any"
                        />
                        <select
                          className="input-field py-2 text-sm w-1/2 px-1"
                          value={materialForm.unit}
                          onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                        >
                          {['bags', 'kg', 'ton', 'pieces', 'sqft', 'litres', 'cu.m', 'bundle', 'Other'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
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
                    {materialForm.unit === 'Other' && (
                      <input
                        type="text"
                        placeholder="Specify custom unit"
                        className="input-field py-2 text-sm"
                        value={materialForm.customUnit}
                        onChange={(e) => setMaterialForm({ ...materialForm, customUnit: e.target.value })}
                        required
                      />
                    )}
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
                  <p className="text-sm text-navy/80 dark:text-white/60">Create a project first</p>
                )}
              </div>

              {/* Recent Activity Feed */}
              <div className="h-[500px]">
                <ActivityFeed />
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
                <button type="button" onClick={() => setShowEditModal(false)} className="text-navy/50 hover:text-navy transition-colors">
                  <X className="h-6 w-6" />
                </button>
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
                      <div className="flex items-center justify-center gap-2 rounded-xl px-4 py-6 text-sm font-semibold text-navy/80 dark:text-white/80 transition-colors hover:text-orange"
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
