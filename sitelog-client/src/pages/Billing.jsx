import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { subscriptionApi } from '../api/index';
import { Check, CreditCard, Building2, X, Crown, Zap, Rocket, Star, AlertCircle, ArrowUpRight, ArrowDownRight, Loader2, Users, FolderKanban, HardDrive, MessageSquare } from 'lucide-react';

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, statusData] = await Promise.all([
        subscriptionApi.plans(),
        subscriptionApi.status(),
      ]);
      setPlans(plansData);
      setStatus(statusData);
    } catch (err) {
      setError('Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectPlan = async (planName) => {
    if (planName === status?.plan) return;
    setShowConfirm(planName);
  };

  const confirmPlanChange = async () => {
    const planName = showConfirm;
    setShowConfirm(null);
    setSwitching(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await subscriptionApi.selectPlan(planName);
      setSuccess(result.message);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change plan.');
    } finally {
      setSwitching(false);
    }
  };

  const planIcons = { free: Star, starter: Zap, pro: Rocket, business: Crown };
  const planColors = {
    free: 'from-slate-400 to-slate-500',
    starter: 'from-blue-500 to-indigo-600',
    pro: 'from-orange to-orange-dark',
    business: 'from-purple-500 to-purple-700',
  };

  if (loading) {
    return (
      <AppLayout title="Billing & Subscription">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange" />
            <span className="text-sm text-muted">Loading billing info...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isUpgrade = (planName) => {
    const order = ['free', 'starter', 'pro', 'business'];
    return order.indexOf(planName) > order.indexOf(status?.plan);
  };

  return (
    <AppLayout title="Billing & Subscription">
      <div className="animate-fadeIn space-y-8">
        {/* Success / Error Alerts */}
        {success && (
          <div className="rounded-xl bg-success/10 border border-success/20 p-4 flex items-center gap-3 animate-slideUp">
            <Check className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm font-medium text-success">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto text-success/60 hover:text-success"><X className="h-4 w-4" /></button>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 p-4 flex items-center gap-3 animate-slideUp">
            <AlertCircle className="h-5 w-5 text-danger shrink-0" />
            <p className="text-sm font-medium text-danger">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-danger/60 hover:text-danger"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Current Plan Overview */}
        {status && (
          <div className="rounded-2xl bg-card p-8 shadow-card border border-[var(--color-glass-border)] transition-all hover:shadow-elevated">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${planColors[status.plan] || planColors.starter} shadow-lg`}>
                  {(() => { const Icon = planIcons[status.plan] || Star; return <Icon className="h-8 w-8 text-white" />; })()}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted uppercase tracking-wider mb-1">Current Plan</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl font-bold text-navy capitalize">PlinthHQ {status.plan}</h2>
                    <span className="rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-xs font-semibold text-success">Active</span>
                  </div>
                  <p className="mt-2 text-sm text-muted flex items-center gap-2">
                    <span>{status.pricing?.priceLabel}{status.pricing?.period !== 'forever' ? status.pricing?.period : ''}</span>
                    {status.planExpiry && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-muted/30" />
                        <span>Renews on {new Date(status.planExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-surface border border-[var(--color-glass-border)] p-4">
                <div className="flex items-center gap-2 text-muted mb-2">
                  <FolderKanban className="h-4 w-4" />
                  <span className="text-xs font-medium">Projects</span>
                </div>
                <p className="text-2xl font-bold text-navy">
                  {status.usage?.projects}
                  <span className="text-sm font-normal text-muted">/{status.limits?.maxProjects === -1 ? '∞' : status.limits?.maxProjects}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${status.limits?.maxProjects !== -1 && status.usage?.projects >= status.limits?.maxProjects ? 'bg-danger' : 'bg-orange'}`}
                    style={{ width: `${status.limits?.maxProjects === -1 ? 10 : Math.min(100, (status.usage?.projects / status.limits?.maxProjects) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-surface border border-[var(--color-glass-border)] p-4">
                <div className="flex items-center gap-2 text-muted mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Users</span>
                </div>
                <p className="text-2xl font-bold text-navy">
                  {status.usage?.users}
                  <span className="text-sm font-normal text-muted">/{status.limits?.maxUsers === -1 ? '∞' : status.limits?.maxUsers}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${status.limits?.maxUsers !== -1 && status.usage?.users >= status.limits?.maxUsers ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${status.limits?.maxUsers === -1 ? 10 : Math.min(100, (status.usage?.users / status.limits?.maxUsers) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-surface border border-[var(--color-glass-border)] p-4">
                <div className="flex items-center gap-2 text-muted mb-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-xs font-medium">Storage</span>
                </div>
                <p className="text-2xl font-bold text-navy">
                  {status.limits?.maxStorageMB >= 1024 ? `${(status.limits?.maxStorageMB / 1024).toFixed(0)}GB` : `${status.limits?.maxStorageMB}MB`}
                </p>
                <p className="text-xs text-muted mt-1">Allocated</p>
              </div>

              <div className="rounded-xl bg-surface border border-[var(--color-glass-border)] p-4">
                <div className="flex items-center gap-2 text-muted mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-medium">AI Chats</span>
                </div>
                <p className="text-2xl font-bold text-navy">
                  {status.limits?.aiChatsPerDay === -1 ? '∞' : status.limits?.aiChatsPerDay}
                </p>
                <p className="text-xs text-muted mt-1">{status.limits?.aiChatsPerDay === -1 ? 'Unlimited' : 'per day'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div>
          <h3 className="text-lg font-bold text-navy mb-4">Available Plans</h3>
          <div className="grid gap-6 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.current;
              const Icon = planIcons[plan.name] || Star;
              const isUpg = isUpgrade(plan.name);
              return (
                <div
                  key={plan.name}
                  className={`card relative transition-all duration-300 hover:-translate-y-1 ${isCurrent ? 'ring-2 ring-orange shadow-lg shadow-orange/5' : ''}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange px-4 py-1 text-xs font-bold text-white shadow-sm">
                      Your Plan
                    </span>
                  )}

                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br ${planColors[plan.name] || planColors.starter} shadow-md mb-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-navy capitalize">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="font-mono text-3xl font-bold text-navy">{plan.priceLabel}</span>
                    <span className="text-sm font-medium text-muted">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-navy/80">
                        <Check className="h-4 w-4 shrink-0 text-success" /> {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !isCurrent && handleSelectPlan(plan.name)}
                    disabled={isCurrent || switching}
                    className={`mt-6 w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-surface border border-[var(--color-glass-border)] text-muted cursor-default'
                        : isUpg
                        ? 'bg-gradient-to-r from-orange to-orange-dark text-white hover:shadow-lg hover:shadow-orange/20 hover:-translate-y-0.5'
                        : 'bg-white/5 border border-[var(--color-glass-border)] text-navy hover:bg-white/5'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : switching ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        {isUpg ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {isUpg ? 'Upgrade' : 'Downgrade'}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Section (placeholder for future Stripe integration) */}
        <div className="card">
          <h3 className="font-bold font-display text-navy flex items-center gap-2 text-lg border-b border-[var(--color-glass-border)] pb-4 mb-4">
            <CreditCard className="h-5 w-5 text-orange" /> Payment Method
          </h3>
          <div className="rounded-xl bg-surface/50 border border-dashed border-[var(--color-glass-border)] p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-navy">Payment processing coming soon</p>
            <p className="text-xs text-muted mt-1">Plans are currently in demo mode. Stripe integration will be added for real payments.</p>
          </div>
        </div>
      </div>

      {/* Confirm Plan Change Modal */}
      {showConfirm && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md p-6 animate-slideUp">
            <div className="mb-6 flex items-center justify-between border-b border-[var(--color-glass-border)] pb-4">
              <h3 className="font-display text-xl font-bold text-navy">
                {isUpgrade(showConfirm) ? 'Upgrade' : 'Downgrade'} Plan
              </h3>
              <button onClick={() => setShowConfirm(null)} className="rounded-xl p-2 text-muted hover:bg-info hover:text-navy transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 rounded-xl bg-info/50 p-4 border border-[var(--color-glass-border)]">
              <p className="text-sm text-navy">
                {isUpgrade(showConfirm)
                  ? `You are upgrading to the "${showConfirm}" plan. Your limits will increase immediately.`
                  : `You are downgrading to the "${showConfirm}" plan. Make sure your current usage is within the new plan's limits.`
                }
              </p>
            </div>

            {!isUpgrade(showConfirm) && (
              <div className="mb-4 rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning">
                  If you have more projects or users than the new plan allows, you'll need to reduce them first.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-[var(--color-glass-border)]">
              <button onClick={() => setShowConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmPlanChange} className="btn-primary flex-1">
                {isUpgrade(showConfirm) ? 'Upgrade Now' : 'Confirm Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
