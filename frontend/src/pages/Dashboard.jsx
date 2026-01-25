import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Droplets, TrendingDown, AlertTriangle, ArrowRight, Loader, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDashboardData, fetchChartData, submitReading } from '../services/api';
import NewReadingModal from '../components/NewReadingModal';

const StatCard = ({ title, value, subtext, icon: Icon, trend, color }) => (
    <div className={`relative overflow-hidden bg-white p-6 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 group hover:translate-y-[-2px] transition-all duration-300`}>
        <div className={`absolute top-0 right-0 p-4 opacity-[0.03] transform scale-150 group-hover:scale-[1.7] transition-transform duration-500`}>
            <Icon size={100} />
        </div>

        <div className="relative z-10 flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {trend && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${trend === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {trend === 'positive' ? 'Ottimo' : 'Attenzione'}
                </span>
            )}
        </div>

        <div className="relative z-10">
            <h3 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">{value}</h3>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg">
                {subtext}
            </p>
        </div>
    </div>
);

const Dashboard = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { _id: 'mock_id' };

    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [timeframe, setTimeframe] = useState('90days');

    const loadData = async () => {
        if (user._id === 'mock_id' || !user.token) {
            setTimeout(() => setLoading(false), 800); // Simulate load if unauthorized
            return;
        }
        try {
            // Parallel fetch
            const [dashboardStats, chart] = await Promise.all([
                fetchDashboardData(user._id, user.token),
                fetchChartData(user._id, user.token, timeframe)
            ]);
            setStats(dashboardStats);
            setChartData(chart);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user._id, user.token, timeframe]);

    const handleNewReading = async (value, date) => {
        await submitReading(user._id, user.token, value, date);
        // Refresh data
        setLoading(true);
        await loadData();
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-sky-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                    <Loader className="animate-spin text-sky-600 relative z-10" size={48} strokeWidth={2.5} />
                </div>
                <p className="text-slate-400 font-medium mt-6 animate-pulse">Analisi consumi in corso...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in pb-10">
            <NewReadingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleNewReading}
            />

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-end bg-slate-900 overflow-hidden p-8 rounded-[2rem] text-white shadow-2xl shadow-slate-200 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full blur-[80px] opacity-40 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 uppercase tracking-wider">Premium Dashboard</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
                        Ciao, <span className="text-sky-400">{user.firstName || 'Utente'}</span>
                    </h2>
                    <p className="text-slate-300 text-lg font-medium max-w-lg leading-relaxed">
                        {stats?.suggestions && stats.suggestions[0] ? stats.suggestions[0].text : 'Monitora i tuoi consumi per risparmiare.'}
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative z-10 mt-6 md:mt-0 bg-white text-slate-900 hover:bg-sky-50 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 group"
                >
                    Nuova Lettura
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Consumo Settimanale"
                    value={stats?.currentConsumption ? `${stats.currentConsumption} L` : '0 L'}
                    subtext={stats?.trendPercentage ? `${stats.trendPercentage > 0 ? '+' : ''}${stats.trendPercentage}% rispetto alla media` : 'Dati insufficienti'}
                    icon={Droplets}
                    trend={parseFloat(stats?.trendPercentage) > 0 ? 'negative' : 'positive'}
                    color="bg-sky-500"
                />
                <StatCard
                    title="Spesa Stimata"
                    value={stats?.estimatedCost ? `€ ${stats.estimatedCost.toFixed(2)}` : '€ 0.00'}
                    subtext="Proiezione mensile corrente"
                    icon={TrendingDown}
                    trend="positive"
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Efficienza Impianto"
                    value=" ottimale"
                    subtext="Nessuna perdita rilevata"
                    icon={Zap}
                    trend="positive"
                    color="bg-indigo-500"
                />
            </div>

            {/* Admin Link (Only for Admins) */}
            {(user.userType === 'ADMIN' || user.email === 'admin@dropzero.com') && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-700 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="text-yellow-400" /> Pannello Aamministratore
                        </h3>
                        <p className="text-slate-400 text-sm">Accedi alla vista aggregata del comune.</p>
                    </div>
                    <Link to="/admin" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                        Vai alla Dashboard Comune
                    </Link>
                </div>
            )}

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Weekly Trend Chart */}
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 lg:col-span-2 relative">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Analisi Andamento</h3>
                            <p className="text-slate-400 text-sm font-medium">Confronto ultimi {timeframe === '90days' ? '3 mesi' : '1 anno'}</p>
                        </div>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-sky-500/20 font-bold"
                        >
                            <option value="90days">Ultimi 90 giorni</option>
                            <option value="1year">Quest'anno</option>
                        </select>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorLitri" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px', fontFamily: 'Outfit' }}
                                    cursor={{ stroke: '#0ea5e9', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="litri"
                                    stroke="#0ea5e9"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorLitri)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Suggestions / Side Panel */}
                <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-200 h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-300" />
                            AI Insights
                        </h3>

                        <div className="space-y-4">
                            {stats?.suggestions?.length > 0 ? stats.suggestions.map((s, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                    <p className="font-bold text-sm mb-1 text-white">{s.title}</p>
                                    <p className="text-xs text-indigo-100 leading-relaxed opacity-90">{s.text}</p>
                                </div>
                            )) : (
                                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                                    <h4 className="font-bold text-sm mb-2 text-yellow-300">💡 Consiglio del Giorno</h4>
                                    <p className="text-sm text-indigo-50 leading-relaxed font-medium">Installa rompigetto aerati sui rubinetti: riducono il flusso d'acqua del 50% mantenendo la pressione invariata.</p>
                                </div>
                            )}
                        </div>

                        <Link to="/advice" className="mt-auto w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors mt-6 block text-center">
                            Vedi tutti i consigli
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
