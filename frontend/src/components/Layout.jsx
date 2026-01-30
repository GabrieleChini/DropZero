import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, User, LogOut, Droplets, Settings, Loader } from 'lucide-react';
import { fetchDashboardData } from '../services/api';

const Layout = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadStats = async () => {
            if (user?._id && user?.token) {
                try {
                    const data = await fetchDashboardData(user._id, user.token);
                    setStats(data);
                } catch (err) {
                    console.error("Layout stats fetch failed", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadStats();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/readings', label: 'Storico Consumi', icon: History },
        { path: '/profile', label: 'Profilo Utente', icon: User },
    ];

    if (user?.userType === 'ADMIN') {
        navItems.push({ path: '/admin', label: 'Vista Comune', icon: Settings });
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 hidden md:flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-8 pb-4 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-sky-500/30">
                        <Droplets size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900 block leading-none">DropZero</span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Water Monitor</span>
                    </div>
                </div>

                <div className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu Principale</p>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? 'text-sky-600 bg-sky-50 font-semibold shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-r-full" />}
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Droplets size={80} />
                        </div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 relative z-10">Tuo Risparmio</p>
                        {loading ? (
                            <div className="h-12 flex items-center"><Loader size={16} className="animate-spin text-slate-500" /></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold mb-1 relative z-10 ${parseFloat(stats?.savingsPercentage) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {parseFloat(stats?.savingsPercentage) >= 0 ? '-' : '+'}{Math.abs(stats?.savingsPercentage || 0).toFixed(0)}%
                                </div>
                                <p className="text-xs text-slate-300 relative z-10 opacity-80">
                                    {parseFloat(stats?.savingsPercentage) >= 0 ? 'Ottimo lavoro questo mese!' : 'Consumi in aumento questo mese'}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-bold text-slate-800">{user?.firstName || 'Utente'}</p>
                                <p className="text-xs text-slate-500">Piano Privato</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Esci">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
                {/* Top Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-64 bg-slate-50 -z-10" />

                <div className="max-w-7xl mx-auto p-8 pt-10">
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
};

export default Layout;
