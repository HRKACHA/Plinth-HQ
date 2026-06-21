import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Cloud, Sun, CloudRain, CloudLightning, Minus, Plus, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { logApi, uploadApi, budgetApi } from '../../api/index';
import VoiceInput from '../../components/common/VoiceInput';
import GlassDatePicker from '../../components/common/GlassDatePicker';
const STEPS = ['Date & Weather', 'Activities', 'Labour', 'Materials', 'Photos', 'Review'];
const WEATHER = [
  { id: 'sunny', icon: Sun, label: 'Sunny' },
  { id: 'cloudy', icon: Cloud, label: 'Cloudy' },
  { id: 'rainy', icon: CloudRain, label: 'Rainy' },
  { id: 'stormy', icon: CloudLightning, label: 'Stormy' },
];
const TRADES = ['mason', 'carpenter', 'electrician', 'plumber', 'welder', 'helper'];
const TRADE_RATES = {
  mason: 800,
  carpenter: 750,
  electrician: 900,
  plumber: 850,
  welder: 950,
  helper: 500
};

export default function LogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('sunny');
  const [activities, setActivities] = useState('');
  
  const activitiesRef = useRef(null);
  useEffect(() => {
    if (activitiesRef.current) {
      activitiesRef.current.style.height = '80px';
      activitiesRef.current.style.height = Math.min(activitiesRef.current.scrollHeight, 300) + 'px';
    }
  }, [activities]);
  const [labour, setLabour] = useState(Object.fromEntries(TRADES.map((t) => [t, { present: 0, wage: TRADE_RATES[t] }])));
  const [materials, setMaterials] = useState([{ name: '', qty: '', unit: 'bags', supplier: '', price: '' }]);
  const [photos, setPhotos] = useState([]);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      setSubmitting(true);
      const data = await uploadApi.photos(files);
      setPhotos((prev) => [...prev, ...data.map(d => d.url)]);
    } catch (err) {
      console.error(err);
      alert('Failed to upload photos');
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => step < 5 && setStep(step + 1);
  const prev = () => step > 0 && setStep(step - 1);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await logApi.create(id, {
        date,
        weather,
        activities,
        labour: TRADES.filter((t) => labour[t].present > 0).map((t) => ({ trade: t, present: labour[t].present, absent: 0, wagePerDay: labour[t].wage })),
        materials: materials.filter((m) => m.name).map((m) => ({ ...m, recdAt: date })),
        photos: photos.map(url => ({ url, caption: '' })),
      });
      
      const totalLabourCost = TRADES.reduce((sum, t) => sum + (labour[t].present * labour[t].wage), 0);
      if (totalLabourCost > 0) {
        await budgetApi.createExpense(id, {
          category: 'labour',
          vendor: 'Internal Payroll',
          description: `Daily Labour Cost (${date})`,
          amount: totalLabourCost,
          invoiceDate: date
        });
      }

      const totalMaterialCost = materials.filter((m) => m.name && Number(m.price) > 0).reduce((sum, m) => sum + Number(m.price), 0);
      if (totalMaterialCost > 0) {
        await budgetApi.createExpense(id, {
          category: 'material',
          vendor: materials.filter((m) => m.supplier)[0]?.supplier || 'Various Suppliers',
          description: `Material Cost (${date}) — ${materials.filter((m) => m.name).map((m) => m.name).join(', ')}`,
          amount: totalMaterialCost,
          invoiceDate: date
        });
      }

      navigate(`/projects/${id}/logs`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout backTo={`/projects/${id}/logs`}>
      <div className="mx-auto max-w-2xl">
        <h2 className="section-title mb-6">Create Daily Log Entry</h2>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <div className="mb-8 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${i <= step ? 'bg-orange text-white shadow-md shadow-orange/30' : 'bg-surface text-muted border border-[var(--color-glass-border)]'}`}>{i + 1}</div>
            </div>
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <div className="space-y-6">
              <div className="mb-4 text-sm text-muted">
                <p><strong>Step 1:</strong> Select the date of the log and the primary weather condition for the day.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-navy">Date</label>
                <GlassDatePicker value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-navy">Weather</label>
                <div className="grid grid-cols-4 gap-3">
                  {WEATHER.map(({ id: wId, icon: Icon, label }) => (
                    <button key={wId} type="button" onClick={() => setWeather(wId)} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${weather === wId ? 'border-orange bg-orange/5 shadow-sm' : 'border-[var(--color-glass-border)] hover:border-muted/30'}`}>
                      <Icon className={`h-6 w-6 ${weather === wId ? 'text-orange' : 'text-muted'}`} />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <div className="mb-4 text-sm text-muted">
                <p><strong>Step 2:</strong> Provide a detailed summary of the work accomplished on site today.</p>
              </div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-navy">Activities</label>
                <VoiceInput onTranscript={(text) => setActivities(text)} />
              </div>
              <textarea 
                ref={activitiesRef}
                value={activities} 
                onChange={(e) => setActivities(e.target.value)} 
                maxLength={2000} 
                rows={3} 
                className="input-field resize-none overflow-hidden" 
                placeholder="Describe today's work..." 
                style={{ minHeight: '80px', maxHeight: '300px' }}
              />
              <p className="mt-1 text-right text-xs text-muted">{activities.length}/2000</p>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-4 text-sm text-muted">
                <p><strong>Step 3:</strong> Record the number of workers present on site for each trade. The total labour cost will automatically be calculated and added to the project expenses.</p>
              </div>
              {TRADES.map((trade) => (
                <div key={trade} className="flex items-center justify-between rounded-xl bg-surface border border-[var(--color-glass-border)] px-4 py-3">
                  <div className="flex flex-col gap-2 w-1/3">
                    <span className="font-medium capitalize text-navy block">{trade}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted">₹</span>
                      <input 
                        type="number" 
                        min="0"
                        value={labour[trade].wage} 
                        onChange={(e) => setLabour({ ...labour, [trade]: { ...labour[trade], wage: Number(e.target.value) } })} 
                        className="w-16 sm:w-20 rounded-md border border-[var(--color-glass-border)] bg-surface px-2 py-1 text-sm outline-none focus:border-orange" 
                      />
                      <span className="text-xs text-muted">/day</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setLabour({ ...labour, [trade]: { ...labour[trade], present: Math.max(0, labour[trade].present - 1) } })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-card shadow-sm border border-[var(--color-glass-border)] text-navy hover:bg-surface"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-mono font-bold text-navy">{labour[trade].present}</span>
                    <button type="button" onClick={() => setLabour({ ...labour, [trade]: { ...labour[trade], present: labour[trade].present + 1 } })} className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-white hover:bg-orange-dark shadow-sm"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-4 text-sm text-muted">
                <p><strong>Step 4:</strong> Log any materials delivered to site today. Enter the item name, quantity, supplier, and total price (₹) for each material.</p>
              </div>
              {materials.map((m, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-5">
                  <input placeholder="Item" className="input-field sm:col-span-2" value={m.name} onChange={(e) => { const n = [...materials]; n[i].name = e.target.value; setMaterials(n); }} />
                  <input placeholder="Qty" className="input-field" value={m.qty} onChange={(e) => { const n = [...materials]; n[i].qty = e.target.value; setMaterials(n); }} />
                  <input placeholder="Supplier" className="input-field" value={m.supplier} onChange={(e) => { const n = [...materials]; n[i].supplier = e.target.value; setMaterials(n); }} />
                  <input placeholder="Price (₹)" type="number" min="0" className="input-field" value={m.price} onChange={(e) => { const n = [...materials]; n[i].price = e.target.value; setMaterials(n); }} />
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setMaterials([...materials, { name: '', qty: '', unit: 'bags', supplier: '', price: '' }])} className="text-sm font-semibold text-orange">+ Add Row</button>
                <span className="text-sm font-semibold text-navy">Total: ₹{materials.reduce((sum, m) => sum + (Number(m.price) || 0), 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <div className="mb-4 text-sm text-muted">
                <p><strong>Step 5:</strong> Upload any relevant site photos, such as progress shots, material deliveries, or safety incidents.</p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-navy/20 bg-info/30 p-8 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted mb-4" />
                <p className="font-medium text-navy mb-2">Upload Site Photos</p>
                <p className="text-sm text-muted mb-6">Take a new photo or select from gallery</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-6 py-3 bg-orange text-white rounded-lg cursor-pointer hover:bg-orange-dark transition shadow-sm w-full sm:w-auto">
                    <Camera size={18} />
                    <span>Take Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handlePhotoUpload} 
                      disabled={submitting}
                      className="hidden"
                    />
                  </label>
                  
                  <label className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border-2 border-[var(--color-glass-border)] text-navy rounded-lg cursor-pointer hover:bg-info/50 transition w-full sm:w-auto">
                    <ImageIcon size={18} />
                    <span>Browse Files</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      disabled={submitting}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-lg">
                      <img src={url} alt={`Upload ${idx}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {step === 5 && (
            <div className="space-y-4">
              <div className="mb-4 text-sm text-muted">
                <p><strong>Step 6:</strong> Review your daily log entry details below. Click Submit when you are ready to save it.</p>
              </div>
              <div className="rounded-lg bg-info p-4 space-y-2 text-sm">
                <p><strong>Date:</strong> {date}</p>
              <p><strong>Weather:</strong> {weather}</p>
              <p><strong>Activities:</strong> {activities || '—'}</p>
              <p><strong>Labour:</strong> {Object.values(labour).reduce((a, b) => a + b.present, 0)} workers</p>
              <p><strong>Total Labour Cost:</strong> ₹{TRADES.reduce((sum, t) => sum + (labour[t].present * labour[t].wage), 0).toLocaleString('en-IN')}</p>
              <p><strong>Materials:</strong> {materials.filter((m) => m.name).length} items</p>
              <p><strong>Total Material Cost:</strong> ₹{materials.reduce((sum, m) => sum + (Number(m.price) || 0), 0).toLocaleString('en-IN')}</p>
            </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button type="button" onClick={prev} disabled={step === 0} className="btn-secondary disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>
            {step < 5 ? (
              <button type="button" onClick={next} className="btn-primary">Next <ChevronRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting || !activities} className="btn-accent disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit Log Entry'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
