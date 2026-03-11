import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  TrendingDown, 
  Calendar, 
  ChevronRight,
  Wallet,
  ArrowUpRight,
  Clock,
  PieChart as PieChartIcon,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  Moon,
  Sun,
  Trash2,
  Settings,
  DollarSign,
  TrendingUp as TrendingUpIcon,
  Edit,
  Calculator
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, Loan, LoanDetail, cn } from './lib/utils';
import { format, addMonths } from 'date-fns';
import { getLoanInsights } from './services/aiService';

// --- Components ---

const Card = ({ children, className, title, subtitle, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string, icon?: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn("glass-card p-8", className)}
  >
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-8">
        <div>
          {title && <h3 className="text-2xl font-display font-bold text-white tracking-tight uppercase">{title}</h3>}
          {subtitle && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <Icon className="w-5 h-5 text-brand-primary" />
          </div>
        )}
      </div>
    )}
    {children}
  </motion.div>
);

const StatCard = ({ label, value, icon: Icon, trend, color = "indigo" }: { label: string, value: string, icon: any, trend?: string, color?: string }) => {
  const accentColors: Record<string, string> = {
    indigo: "text-brand-primary",
    emerald: "text-brand-secondary",
    rose: "text-brand-accent",
    amber: "text-yellow-400",
  };

  return (
    <Card className="p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-brand-primary/10 transition-all" />
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl group-hover:border-brand-primary/50 transition-all">
          <Icon className={cn("w-5 h-5", accentColors[color])} />
        </div>
        {trend && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter",
              trend.startsWith('+') 
                ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20" 
                : "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
            )}
          >
            {trend}
          </motion.span>
        )}
      </div>
      <div className="relative z-10">
        <p className="stat-label mb-1">{label}</p>
        <p className="stat-value text-white">{value}</p>
      </div>
    </Card>
  );
};

const LoanForm = ({ onSuccess, initialData, isEditing }: { onSuccess: () => void, initialData?: any, isEditing?: boolean }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount || '',
    interest_rate: initialData?.interest_rate || '',
    tenure_months: initialData?.tenure_months || '',
    start_date: initialData?.start_date || format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/loans/${initialData.id}` : '/api/loans';
    const method = isEditing ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        amount: parseFloat(formData.amount.toString()),
        interest_rate: parseFloat(formData.interest_rate.toString()),
        tenure_months: parseInt(formData.tenure_months.toString())
      })
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Account_Name</label>
          <input 
            type="text" 
            required
            className="input-field"
            placeholder="e.g. HDFC_HOME_LOAN"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Principal_Amount</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-bold">₹</span>
              <input 
                type="number" 
                required
                className="input-field pl-10"
                placeholder="5,00,000"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Interest_Rate (%)</label>
            <input 
              type="number" 
              step="0.1"
              required
              className="input-field"
              placeholder="8.5"
              value={formData.interest_rate}
              onChange={e => setFormData({...formData, interest_rate: e.target.value})}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tenure (Months)</label>
            <input 
              type="number" 
              required
              className="input-field"
              placeholder="120"
              value={formData.tenure_months}
              onChange={e => setFormData({...formData, tenure_months: e.target.value})}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Start_Date</label>
            <input 
              type="date" 
              required
              className="input-field"
              value={formData.start_date}
              onChange={e => setFormData({...formData, start_date: e.target.value})}
            />
          </div>
        </div>
      </div>
      <button 
        type="submit"
        className="primary-button w-full py-5 text-sm"
      >
        {isEditing ? 'UPDATE_DEBT_PARAMETERS' : 'INITIALIZE_DEBT_TRACKER'}
      </button>
    </form>
  );
};

const Simulator = ({ loan, darkMode }: { loan: Loan, darkMode: boolean }) => {
  if (!loan) return null;
  const [simulation, setSimulation] = useState<any>(null);
  const [activeStrategy, setActiveStrategy] = useState<'extra' | 'lump'>('extra');
  const [extraPayment, setExtraPayment] = useState('');
  const [lumpSum, setLumpSum] = useState('');
  const [lumpSumMonth, setLumpSumMonth] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          monthlyExtra: activeStrategy === 'extra' ? (parseFloat(extraPayment) || 0) : 0,
          lumpSum: activeStrategy === 'lump' ? (parseFloat(lumpSum) || 0) : 0,
          lumpSumMonth: activeStrategy === 'lump' ? (parseInt(lumpSumMonth) || 1) : 1
        })
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [loan.id, activeStrategy]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-xl mb-4">
            <button 
              onClick={() => setActiveStrategy('extra')}
              className={cn(
                "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeStrategy === 'extra' ? "bg-brand-primary text-black shadow-[0_0_15px_rgba(0,255,148,0.3)]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Monthly_Extra
            </button>
            <button 
              onClick={() => setActiveStrategy('lump')}
              className={cn(
                "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeStrategy === 'lump' ? "bg-brand-primary text-black shadow-[0_0_15px_rgba(0,255,148,0.3)]" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Lump_Sum
            </button>
          </div>

          <div className="space-y-6">
            <div className={cn("space-y-3 transition-all duration-300", activeStrategy !== 'extra' && "opacity-20 grayscale pointer-events-none")}>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Extra_Monthly_Payment</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-bold text-xl">₹</span>
                <input 
                  type="number" 
                  disabled={activeStrategy !== 'extra'}
                  className="w-full pl-12 pr-6 py-5 bg-white/5 border border-white/10 rounded-xl focus:border-brand-primary transition-all font-display font-bold text-2xl outline-none text-white"
                  placeholder="0"
                  value={extraPayment}
                  onChange={e => setExtraPayment(e.target.value)}
                />
              </div>
            </div>

            <div className={cn("grid grid-cols-2 gap-6 transition-all duration-300", activeStrategy !== 'lump' && "opacity-20 grayscale pointer-events-none")}>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lump_Sum_Amount</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-bold text-xl">₹</span>
                  <input 
                    type="number" 
                    disabled={activeStrategy !== 'lump'}
                    className="w-full pl-12 pr-6 py-5 bg-white/5 border border-white/10 rounded-xl focus:border-brand-primary transition-all font-display font-bold text-2xl outline-none text-white"
                    placeholder="0"
                    value={lumpSum}
                    onChange={e => setLumpSum(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Target_Month</label>
                <input 
                  type="number" 
                  disabled={activeStrategy !== 'lump'}
                  className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-xl focus:border-brand-primary transition-all font-display font-bold text-2xl outline-none text-white"
                  placeholder="1"
                  value={lumpSumMonth}
                  onChange={e => setLumpSumMonth(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSimulate}
              disabled={loading}
              className="primary-button w-full py-6 text-sm flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  EXECUTE_SIMULATION_SEQUENCE
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          {simulation ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-primary text-black rounded-xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Simulation_Result</h4>
                    <p className="text-3xl font-display font-black text-white tracking-tighter">SUCCESSFUL_PROJECTION</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Total_Interest_Saved</p>
                    <p className="text-5xl font-display font-black text-brand-primary tracking-tighter">{formatCurrency(simulation.interestSaved)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Time_Saved</p>
                      <p className="text-4xl font-display font-black text-white tracking-tighter">{simulation.monthsSaved} <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Months</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">New_Tenure</p>
                      <p className="text-4xl font-display font-black text-white tracking-tighter">{simulation.newTenure} <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Months</span></p>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Acceleration_Factor</p>
                      <span className="text-xl font-display font-black text-brand-primary">+{((simulation.monthsSaved / loan.tenure_months) * 100).toFixed(1)}% FASTER</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (simulation.newTenure / loan.tenure_months) * 100)}%` }}
                        className="h-full bg-brand-primary shadow-[0_0_15px_#00FF94] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full bg-zinc-900/50 border border-white/5 border-dashed rounded-2xl flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Awaiting_Input_Parameters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LoanDetailView = ({ loanId, onBack, darkMode, onDelete, onEdit }: { loanId: number, onBack: () => void, darkMode: boolean, onDelete: () => void, onEdit: () => void }) => {
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const fetchLoanDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loanId}`);
      const data = await res.json();
      setLoan(data);
      
      // Fetch AI Insights
      setLoadingInsights(true);
      const aiInsights = await getLoanInsights(data);
      setInsights(aiInsights);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchLoanDetail();
  }, [loanId]);

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
      return;
    }
    
    try {
      const res = await fetch(`/api/loans/${loanId}`, { method: 'DELETE' });
      if (res.ok) onDelete();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !loan) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8">
        <div className="w-16 h-16 border-4 border-white/5 border-t-brand-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">Analyzing_Loan_Structure...</p>
      </div>
    );
  }

  const currentOutstanding = loan.schedule.find(s => s.status === 'Upcoming')?.outstanding || 0;
  const progress = ((loan.amount - currentOutstanding) / loan.amount) * 100;
  const chartData = loan.schedule.slice(0, 24).map(s => ({
    name: format(addMonths(new Date(loan.start_date), s.month - 1), 'MMM'),
    Principal: s.principal,
    Interest: s.interest
  }));

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="secondary-button !p-4 rounded-full border-white/10 hover:border-brand-primary/50 transition-all">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-5xl font-display font-black text-white leading-none tracking-tighter uppercase">{loan.name}</h2>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">ID: {loan.id.toString().padStart(4, '0')}</span>
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full shadow-[0_0_10px_#00FF94]"></span>
              <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em]">Status: Operational</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onEdit}
            className="secondary-button flex items-center gap-3"
          >
            <Edit className="w-4 h-4" />
            Edit_Parameters
          </button>
          <button 
            onClick={handleDelete}
            className={cn(
              "secondary-button flex items-center gap-3 text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/50",
              isConfirmingDelete && "bg-rose-500/20 border-rose-500"
            )}
          >
            <Trash2 className="w-4 h-4" />
            {isConfirmingDelete ? "Confirm_Wipe?" : "Delete_Entry"}
          </button>
          <button className="primary-button">Execute_Payment</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Monthly_EMI" value={formatCurrency(loan.emi)} icon={Wallet} color="indigo" />
        <StatCard label="Outstanding_Debt" value={formatCurrency(currentOutstanding)} icon={TrendingDown} color="rose" />
        <StatCard label="Interest_Rate" value={`${loan.interest_rate}%`} icon={ArrowUpRight} color="amber" />
        <StatCard label="Liquidation_Progress" value={`${progress.toFixed(0)}%`} icon={BarChart3} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card title="Repayment_Trajectory" subtitle="24_MONTH_PROJECTION_DATA">
            <div className="h-[400px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF94" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00FF94" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 9, fontWeight: 800}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="Principal" stroke="#00FF94" strokeWidth={3} fillOpacity={1} fill="url(#colorPrincipal)" />
                  <Area type="monotone" dataKey="Interest" stroke="#00D1FF" strokeWidth={3} fillOpacity={1} fill="url(#colorInterest)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Amortization_Schedule" subtitle="FULL_BREAKDOWN_LOGS">
            <div className="overflow-x-auto mt-8 max-h-[600px] overflow-y-auto custom-scrollbar rounded-xl border border-white/5">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/5 border-b border-white/10 z-10">
                  <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    <th className="p-5">Month</th>
                    <th className="p-5">EMI</th>
                    <th className="p-5">Principal</th>
                    <th className="p-5">Interest</th>
                    <th className="p-5">Outstanding</th>
                    <th className="p-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loan.schedule.map((item) => (
                    <tr key={item.month} className="text-[11px] font-bold text-zinc-300 hover:bg-white/5 transition-colors">
                      <td className="p-5 font-mono">{format(addMonths(new Date(loan.start_date), item.month - 1), 'MMM yyyy')}</td>
                      <td className="p-5">{formatCurrency(item.emi)}</td>
                      <td className="p-5 text-brand-primary">{formatCurrency(item.principal)}</td>
                      <td className="p-5 text-brand-secondary">{formatCurrency(item.interest)}</td>
                      <td className="p-5 font-mono text-white">{formatCurrency(item.outstanding)}</td>
                      <td className="p-5">
                        <span className={cn(
                          "px-2 py-1 rounded font-black text-[8px] uppercase tracking-widest",
                          item.status === 'Paid' ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20" : "bg-white/5 text-zinc-600"
                        )}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-10">
          <Card className="bg-white/5 border-white/10 shadow-[0_0_50px_rgba(0,255,148,0.05)]" title="AI_STRATEGIST" icon={Sparkles}>
            <div className="space-y-8">
              {loadingInsights ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-3 bg-white/5 rounded-full w-3/4"></div>
                  <div className="h-3 bg-white/5 rounded-full w-full"></div>
                  <div className="h-3 bg-white/5 rounded-full w-2/3"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {insights.map((insight, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 items-start"
                    >
                      <div className="mt-1 p-1.5 bg-brand-primary/10 rounded border border-brand-primary/20">
                        <Zap className="w-3 h-3 text-brand-primary" />
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              <button className="primary-button w-full flex items-center justify-center gap-3 mt-4">
                Full_Analysis_Report <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'dashboard' | 'loans' | 'add' | 'settings' | 'simulator'>('dashboard');
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState({ monthly_salary: 0, currency: 'INR' });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    console.log('Loans state updated:', loans);
  }, [loans]);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

  const fetchLoans = async () => {
    const res = await fetch('/api/loans');
    const data = await res.json();
    setLoans(data);
  };

  const fetchProfile = async () => {
    const res = await fetch('/api/profile');
    const data = await res.json();
    setProfile(data);
  };

  useEffect(() => {
    fetchLoans();
    fetchProfile();
  }, []);

  const totalOutstanding = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);
  const disposableIncome = profile.monthly_salary - totalEMI;

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white selection:bg-brand-primary/30 selection:text-brand-primary transition-colors duration-500">
      <div className="marquee-container">
        <div className="marquee-content">
          SYSTEM STATUS: OPTIMIZED • DEBT REDUCTION ACTIVE • INTEREST SAVINGS CALCULATED • CRUSHER AI v2.0 • MISSION CRITICAL DATA • SYSTEM STATUS: OPTIMIZED • DEBT REDUCTION ACTIVE • INTEREST SAVINGS CALCULATED • CRUSHER AI v2.0 • MISSION CRITICAL DATA •
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLoan(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl glass-card p-10 z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-4xl font-display font-black text-white leading-tight uppercase tracking-tighter">Edit_Debt_Parameters</h3>
                  <p className="text-[10px] font-black text-zinc-500 mt-2 uppercase tracking-widest">Update account identification and financial data</p>
                </div>
                <button onClick={() => setEditingLoan(null)} className="p-3 hover:bg-white/5 rounded-full transition-colors">
                  <PlusCircle className="w-6 h-6 rotate-45 text-zinc-500" />
                </button>
              </div>
              <LoanForm 
                isEditing 
                initialData={editingLoan} 
                onSuccess={() => {
                  fetchLoans();
                  setEditingLoan(null);
                  if (selectedLoanId === editingLoan.id) {
                    setSelectedLoanId(null);
                    setTimeout(() => setSelectedLoanId(editingLoan.id), 10);
                  }
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#121216] border-r border-white/5 p-8 hidden xl:flex flex-col gap-12 z-20">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,148,0.3)] animate-float">
            <Zap className="text-black w-6 h-6 fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-display font-black text-white leading-none tracking-tighter uppercase">Crusher</h1>
            <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] mt-1.5 block">Terminal v2.0</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'loans', icon: List, label: 'Portfolios' },
            { id: 'add', icon: PlusCircle, label: 'Track Debt' },
            { id: 'simulator', icon: Calculator, label: 'Simulator' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setView(item.id as any); setSelectedLoanId(null); }}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all",
                view === item.id 
                  ? "bg-white/5 text-brand-primary border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]" 
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-8 bg-white/5 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Intelligence</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-300 leading-relaxed uppercase tracking-tight">
            Consolidating high-interest debt into a personal loan can save you up to 12% in annual interest.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="xl:ml-72 p-6 md:p-12 lg:p-20 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-6xl font-display font-black text-white leading-none tracking-tighter uppercase"
            >
              {view === 'dashboard' && "Overview"}
              {view === 'loans' && "Portfolios"}
              {view === 'add' && "Track Debt"}
              {view === 'simulator' && "Simulator"}
              {view === 'settings' && "Settings"}
              {selectedLoanId && "Details"}
            </motion.h2>
            <p className="text-zinc-500 font-black mt-4 flex items-center gap-3 uppercase tracking-[0.3em] text-[10px]">
              <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></span>
              System Online // User: Strategist
            </p>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="SEARCH_DEBT_DATABASE..." 
                className="pl-12 pr-6 py-4 bg-zinc-900/50 border border-white/10 rounded-xl font-mono text-[10px] uppercase tracking-widest focus:border-brand-primary transition-all outline-none w-full md:w-80"
              />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {selectedLoanId && view !== 'simulator' ? (
            <motion.div 
              key="loan-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <LoanDetailView 
                loanId={selectedLoanId} 
                onBack={() => setSelectedLoanId(null)} 
                darkMode={darkMode} 
                onDelete={() => {
                  fetchLoans();
                  setSelectedLoanId(null);
                  setView('loans');
                }}
                onEdit={() => {
                  const loanToEdit = loans.find(l => l.id === selectedLoanId);
                  if (loanToEdit) setEditingLoan(loanToEdit);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {view === 'dashboard' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard label="Total Debt" value={formatCurrency(totalOutstanding)} icon={Wallet} trend="+1.2%" color="indigo" />
                    <StatCard label="Monthly EMI" value={formatCurrency(totalEMI)} icon={Calendar} color="amber" />
                    <StatCard label="Disposable" value={formatCurrency(disposableIncome)} icon={TrendingUpIcon} color="emerald" />
                    <StatCard label="Monthly Salary" value={formatCurrency(profile.monthly_salary)} icon={DollarSign} color="rose" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Card className="lg:col-span-2" title="Debt Distribution" subtitle="Portfolio breakdown by principal">
                      <div className="h-[400px] w-full mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={loans.map(l => ({ name: l.name, value: l.amount }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 9, fontWeight: 800}} dy={10} />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{fill: 'rgba(0, 255, 148, 0.05)'}}
                              contentStyle={{ 
                                backgroundColor: '#09090b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                              }}
                              itemStyle={{ color: '#00FF94' }}
                              formatter={(value: number) => formatCurrency(value)}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {loans.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index % 2 === 0 ? '#00FF94' : '#00D1FF'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                    <Card title="Upcoming Payments" subtitle="Next 30 days">
                      <div className="space-y-4 mt-6">
                        {loans.length === 0 ? (
                          <div className="text-center py-16 text-zinc-700">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">System_Idle</p>
                          </div>
                        ) : (
                          loans.map(loan => (
                            <motion.div 
                              key={loan.id} 
                              whileHover={{ x: 4 }}
                              className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl transition-all cursor-pointer hover:border-brand-primary/30" 
                              onClick={() => setSelectedLoanId(loan.id)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center group-hover:border-brand-primary/50 transition-colors">
                                  <Calendar className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white leading-none">{loan.name}</p>
                                  <p className="text-[9px] font-black text-zinc-500 mt-1 uppercase tracking-widest">Due in 4 days</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-display font-bold text-white">{formatCurrency(loan.emi)}</p>
                                <ArrowRight className="w-3 h-3 ml-auto mt-1 text-brand-primary opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                      <button className="secondary-button w-full mt-6">
                        FULL_CALENDAR_VIEW
                      </button>
                    </Card>
                  </div>
                </div>
              )}

              {view === 'loans' && (
                <Card title="Debt Inventory" subtitle="Manage all active loan accounts">
                  <div className="overflow-x-auto mt-6 rounded-xl border border-white/5">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/5 border-b border-white/5">
                        <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                          <th className="p-5">Account_Name</th>
                          <th className="p-5">Principal</th>
                          <th className="p-5">Monthly_EMI</th>
                          <th className="p-5">Rate</th>
                          <th className="p-5">Tenure</th>
                          <th className="p-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loans.map((loan) => (
                          <tr 
                            key={loan.id} 
                            className="group hover:bg-white/5 transition-all cursor-pointer"
                            onClick={() => setSelectedLoanId(loan.id)}
                          >
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center group-hover:border-brand-primary/50 transition-all">
                                  <Wallet className="w-4 h-4 text-brand-primary transition-all" />
                                </div>
                                <div>
                                  <span className="font-bold block text-white">{loan.name}</span>
                                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">ID: #{loan.id.toString().padStart(4, '0')}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-sm font-display font-bold text-white">{formatCurrency(loan.amount)}</td>
                            <td className="p-5 text-sm font-display font-bold text-white">{formatCurrency(loan.emi)}</td>
                            <td className="p-5">
                              <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full text-[9px] font-black">{loan.interest_rate}%</span>
                            </td>
                            <td className="p-5 text-sm font-display font-bold text-white">{loan.tenure_months} Mo</td>
                            <td className="p-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLoan(loan);
                                  }}
                                  className="h-9 w-9 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 text-zinc-400 hover:border-brand-primary hover:text-brand-primary transition-all"
                                  title="Edit Loan"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    
                                    if (confirmingDeleteId !== loan.id) {
                                      setConfirmingDeleteId(loan.id);
                                      setTimeout(() => setConfirmingDeleteId(null), 4000);
                                      return;
                                    }

                                    try {
                                      const res = await fetch(`/api/loans/${loan.id}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        await fetchLoans();
                                        setConfirmingDeleteId(null);
                                      }
                                    } catch (err) {
                                      console.error(`Error during delete:`, err);
                                    }
                                  }}
                                  className={cn(
                                    "h-9 rounded-lg border flex items-center justify-center transition-all gap-2 px-3 font-black text-[9px] uppercase",
                                    confirmingDeleteId === loan.id
                                    ? 'bg-brand-accent border-brand-accent text-white'
                                    : 'bg-white/5 border-white/10 text-brand-accent hover:border-brand-accent/50'
                                  )}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {confirmingDeleteId === loan.id && <span>Confirm?</span>}
                                </button>
                                <div className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center bg-white/5 text-zinc-600 group-hover:bg-brand-primary group-hover:text-black transition-all">
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {loans.length === 0 && (
                      <div className="text-center py-24 text-zinc-700">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">No_Active_Debts_Found</p>
                        <button 
                          onClick={() => setView('add')}
                          className="primary-button mt-6"
                        >
                          INITIALIZE_FIRST_LOAN
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {view === 'add' && (
                <div className="max-w-3xl mx-auto">
                  <Card title="Initialize New Debt Tracker" subtitle="Enter your loan details accurately for best AI insights">
                    <div className="mt-8">
                      <LoanForm onSuccess={() => { fetchLoans(); setView('loans'); }} />
                    </div>
                  </Card>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 flex gap-4">
                      <div className="p-3 bg-brand-primary text-black rounded-xl h-fit">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Secure Tracking</h4>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 leading-relaxed">Your data is stored locally and never shared with third parties.</p>
                      </div>
                    </div>
                    <div className="p-6 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/10 flex gap-4">
                      <div className="p-3 bg-brand-secondary text-black rounded-xl h-fit">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">AI Optimization</h4>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 leading-relaxed">Instantly receive payoff strategies once you add your loan.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'simulator' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    <div className="lg:col-span-1 space-y-6">
                      <Card title="Select Account" subtitle="Choose a loan to simulate">
                        <div className="space-y-3 mt-4">
                          {loans.map(loan => (
                            <button
                              key={loan.id}
                              onClick={() => setSelectedLoanId(loan.id)}
                              className={cn(
                                "w-full flex items-center justify-between p-5 rounded-xl border transition-all text-left",
                                selectedLoanId === loan.id
                                ? "bg-brand-primary border-brand-primary text-black shadow-[0_0_20px_rgba(0,255,148,0.3)]"
                                : "bg-zinc-900 border-white/5 hover:border-white/20"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg", selectedLoanId === loan.id ? "bg-black/10" : "bg-zinc-800")}>
                                  <Wallet className={cn("w-4 h-4", selectedLoanId === loan.id ? "text-black" : "text-zinc-500")} />
                                </div>
                                <div>
                                  <p className="font-bold text-xs">{loan.name}</p>
                                  <p className={cn("text-[9px] font-black uppercase tracking-widest mt-0.5", selectedLoanId === loan.id ? "text-black/60" : "text-zinc-500")}>
                                    {formatCurrency(loan.emi)} / mo
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className={cn("w-4 h-4 transition-transform", selectedLoanId === loan.id ? "text-black translate-x-1" : "text-zinc-700")} />
                            </button>
                          ))}
                          {loans.length === 0 && (
                            <div className="text-center py-10">
                              <AlertCircle className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                              <p className="text-zinc-600 font-black text-[9px] uppercase tracking-widest">No_Active_Accounts</p>
                            </div>
                          )}
                        </div>
                      </Card>

                      <div className="p-8 bg-zinc-900 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <Sparkles className="w-5 h-5 text-brand-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Intelligence_Tip</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                          Even an extra ₹1,000 per month can shave off years from a long-term home loan. Try it now!
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      {selectedLoanId ? (
                        <Card title="Smart Payoff Simulator" subtitle="Real-time debt reduction engine" icon={Calculator}>
                          <div className="mt-8">
                            <Simulator 
                              loan={loans.find(l => l.id === selectedLoanId) as any} 
                              darkMode={darkMode} 
                            />
                          </div>
                        </Card>
                      ) : (
                        <div className="h-full flex items-center justify-center p-20 bg-white dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                          <div className="text-center max-w-sm">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                              <Calculator className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Select an Account</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold mt-3 leading-relaxed">
                              Choose a loan from your portfolio on the left to start simulating your payoff strategies.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {view === 'settings' && (
                <div className="max-w-3xl mx-auto">
                  <Card title="Financial Settings" subtitle="Manage your income and preferences">
                    <div className="mt-8 space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Monthly_Salary (Net_Income)</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-bold text-2xl">₹</span>
                          <input 
                            type="number" 
                            className="w-full pl-12 pr-6 py-5 bg-white/5 border border-white/10 rounded-xl focus:border-brand-primary transition-all font-display font-bold text-2xl outline-none text-white"
                            placeholder="0"
                            value={profile.monthly_salary || ''}
                            onChange={async (e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setProfile({ ...profile, monthly_salary: val });
                              await fetch('/api/profile', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...profile, monthly_salary: val })
                              });
                            }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-600 ml-1 uppercase tracking-widest">System uses this for disposable_income_projection</p>
                      </div>

                      <div className="p-10 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[50px] rounded-full" />
                        <div className="flex items-center gap-6 mb-8 relative z-10">
                          <div className="p-4 bg-brand-primary text-black rounded-xl">
                            <Zap className="w-8 h-8" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-display font-black text-white tracking-tighter">FINANCIAL_HEALTH_SCORE</h4>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">DEBT_TO_INCOME_RATIO_ANALYSIS</p>
                          </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden relative z-10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, (disposableIncome / profile.monthly_salary) * 100))}%` }}
                            className="h-full bg-brand-primary shadow-[0_0_15px_#00FF94] rounded-full"
                          />
                        </div>
                        <div className="flex justify-between mt-4 relative z-10">
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Disposable: {((disposableIncome / profile.monthly_salary) * 100 || 0).toFixed(1)}%</span>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Target: 40%+</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
