import React, { useEffect, useState } from 'react';
import { fetchAdvice } from '../services/api';
import { AlertTriangle, Sun, Droplets, Zap, Wrench, Leaf, ArrowLeft, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const iconMap = {
    AlertTriangle,
    Sun,
    Droplets,
    Zap,
    Wrench,
    Leaf
};

const Advice = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { _id: 'mock_id' };

    const [adviceList, setAdviceList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!user.token) return;
            try {
                const data = await fetchAdvice(user._id, user.token);
                setAdviceList(data);
            } catch (error) {
                console.error("Error loading advice", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user._id, user.token]);

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader className="animate-spin text-sky-600" size={32} /></div>;

    return (
        <div className="max-w-5xl mx-auto animate-in pb-10">
            <div className="mb-8 flex items-center gap-4">
                <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800">Consigli su Misura</h2>
                    <p className="text-slate-500 mt-1">Suggerimenti personalizzati per ridurre i tuoi consumi.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adviceList.map((advice) => {
                    const Icon = iconMap[advice.icon] || Droplets;
                    return (
                        <div key={advice.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${advice.color || 'bg-sky-50 text-sky-600'}`}>
                                    <Icon size={24} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${advice.category === 'URGENTE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {advice.category}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">{advice.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">{advice.description}</p>

                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <span>Impatto:</span>
                                <span className={`px-2 py-0.5 rounded-md ${advice.impact === 'Alto' ? 'bg-emerald-100 text-emerald-700' :
                                        advice.impact === 'Medio' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {advice.impact}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Advice;
