import React, { useEffect, useState } from 'react';
import { fetchAdminStats, fetchAdminMapData, fetchAdminAlerts } from '../services/api';
import { LayoutDashboard, AlertTriangle, Map as MapIcon, Users, Droplets, Loader, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Detailed Trento District Map (Schematic SVG)
const TrentoMap = ({ zones, onZoneClick, selectedZone }) => {
    // Schematic positions for Trento's 12 districts
    // Rough relative positioning (0-100 coord system)
    const districtPaths = {
        'Gardolo': { d: "M 40 5 L 60 5 L 65 25 L 45 30 L 35 15 Z", cx: 50, cy: 15 }, // North
        'Meano': { d: "M 60 5 L 80 10 L 75 30 L 65 25 Z", cx: 70, cy: 18 }, // North East
        'Argentario': { d: "M 75 30 L 95 35 L 90 55 L 70 50 L 65 25 Z", cx: 80, cy: 40 }, // East (Hill)
        'Povo': { d: "M 70 50 L 90 55 L 85 75 L 65 70 Z", cx: 78, cy: 62 }, // East
        'Villazzano': { d: "M 65 70 L 85 75 L 75 90 L 55 85 Z", cx: 70, cy: 80 }, // South East
        'Mattarello': { d: "M 45 85 L 65 85 L 60 100 L 40 100 Z", cx: 52, cy: 92 }, // Far South

        'Ravina-Romagnano': { d: "M 25 75 L 45 75 L 50 90 L 30 95 Z", cx: 38, cy: 85 }, // South West
        'Bondone': { d: "M 5 55 L 25 50 L 30 75 L 10 80 Z", cx: 18, cy: 65 }, // West (Mountain)
        'Sardagna': { d: "M 10 35 L 30 30 L 35 55 L 15 60 Z", cx: 22, cy: 45 }, // West (Elevated)

        'Centro Storico - Piedicastello': { d: "M 35 40 L 55 40 L 55 55 L 35 55 Z", cx: 45, cy: 48 }, // Center
        'San Giuseppe-Santa Chiara': { d: "M 55 40 L 65 35 L 70 50 L 55 55 Z", cx: 60, cy: 45 }, // Center-East
        'Oltrefersina': { d: "M 45 55 L 65 55 L 60 70 L 40 65 Z", cx: 52, cy: 60 }, // Center-South
    };

    const getColor = (status) => {
        if (status === 'CRITICAL') return '#e11d48'; // Rose-600
        if (status === 'WARNING') return '#f59e0b'; // Amber-500
        return '#10b981'; // Emerald-500
    };

    return (
        <div className="w-full h-[500px] bg-slate-50 rounded-3xl relative overflow-hidden border border-slate-200 shadow-inner group">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-xl shadow-sm border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mappa Territoriale</h4>
                <p className="text-lg font-extrabold text-slate-800">Trento</p>
            </div>

            <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-xl p-4">
                {/* Adige River Logic (Background) */}
                <path d="M 35 0 C 35 20 25 40 35 60 C 45 80 35 100 45 110" stroke="#bae6fd" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5" />

                {Object.keys(districtPaths).map((zoneName) => {
                    const zoneData = zones.find(z => z.name === zoneName);
                    const status = zoneData?.status || 'OK';
                    const pathDef = districtPaths[zoneName];
                    const isSelected = selectedZone?.name === zoneName;

                    return (
                        <g key={zoneName}
                            onClick={() => onZoneClick(zoneData || { name: zoneName, status: 'OK', consumption: 0, anomalies: 0 })}
                            className="cursor-pointer transition-all hover:opacity-90"
                        >
                            <path
                                d={pathDef.d}
                                fill={getColor(status)}
                                stroke={isSelected ? "#4f46e5" : "white"}
                                strokeWidth={isSelected ? "1" : "0.5"}
                                fillOpacity={isSelected ? "1" : "0.85"}
                                className="transition-all duration-300 hover:scale-[1.02] origin-center"
                                style={{ transformOrigin: `${pathDef.cx}px ${pathDef.cy}px` }}
                            />
                            {/* Label */}
                            <text
                                x={pathDef.cx}
                                y={pathDef.cy}
                                fontSize="2"
                                fontWeight="bold"
                                fill="white"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                className="pointer-events-none drop-shadow-md select-none"
                            >
                                {zoneName.split(' ')[0]} {/* Short name */}
                            </text>

                            {/* Anomaly Indicator */}
                            {status !== 'OK' && (
                                <circle cx={pathDef.cx + 2} cy={pathDef.cy - 2} r="1.5" fill="#ef4444" stroke="white" strokeWidth="0.2" className="animate-pulse" />
                            )}
                        </g>
                    );
                })}
            </svg>

            <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-medium">
                * Mappa schematica circoscrizioni
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { _id: 'mock_id' };

    const [stats, setStats] = useState(null);
    const [mapData, setMapData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user.token) return;
            try {
                const [statsData, mapRes, alertsRes] = await Promise.all([
                    fetchAdminStats(user.token),
                    fetchAdminMapData(user.token),
                    fetchAdminAlerts(user.token)
                ]);
                setStats(statsData);
                setMapData(mapRes);
                setAlerts(alertsRes);
            } catch (error) {
                console.error("Error loading admin data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user._id, user.token]);

    if (loading) return <div className="h-[70vh] flex items-center justify-center"><Loader className="animate-spin text-indigo-600" size={48} /></div>;

    return (
        <div className="space-y-8 animate-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Comune</h1>
                    <p className="text-slate-500 font-medium">Monitoraggio Idrico: {stats?.municipality || 'Trento'}</p>
                </div>
                <Link to="/" className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 font-bold flex items-center gap-2">
                    <ArrowLeft size={18} /> Torna alla User Dashboard
                </Link>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Users size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Contatori Attivi</p>
                        <h3 className="text-3xl font-extrabold text-slate-800">{stats?.totalMeters || 0}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
                        <Droplets size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Consumo 7gg (m³)</p>
                        <h3 className="text-3xl font-extrabold text-slate-800">{stats?.totalConsumptionLastWeek || 0}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <AlertTriangle size={100} />
                    </div>
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl relative z-10">
                        <AlertTriangle size={32} strokeWidth={2.5} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Anomalie Rilevate</p>
                        <h3 className="text-3xl font-extrabold text-slate-800">{stats?.activeAlerts || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Map Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MapIcon className="text-indigo-500" size={24} />
                            Mappa Circoscrizioni
                        </h2>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Ottimale</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Attenzione</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Critico</span>
                        </div>
                    </div>

                    <TrentoMap zones={mapData} onZoneClick={setSelectedZone} selectedZone={selectedZone} />

                    <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {mapData.map(zone => (
                            <button key={zone.name}
                                onClick={() => setSelectedZone(zone)}
                                className={`flex-shrink-0 px-3 py-2 rounded-lg border text-xs font-bold transition-all whitespace-nowrap ${selectedZone?.name === zone.name ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`inline-block w-2 h-2 rounded-full mr-2 ${zone.status === 'CRITICAL' ? 'bg-rose-500' :
                                    zone.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}></div>
                                {zone.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Panel / Selected Zone */}
                <div className="flex flex-col gap-6">
                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white h-full relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-20 translate-x-1/3 -translate-y-1/3"></div>

                        {selectedZone ? (
                            <div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                <span className="uppercase tracking-widest text-xs font-bold text-slate-400 mb-2 block">Dettaglio Circoscrizione</span>
                                <h2 className="text-2xl font-extrabold mb-6 text-white leading-tight">{selectedZone.name}</h2>

                                <div className="space-y-6">
                                    <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10">
                                        <p className="text-slate-300 text-sm font-medium mb-1">Stato Attuale</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${selectedZone.status === 'CRITICAL' ? 'bg-rose-500' :
                                                selectedZone.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></div>
                                            <span className="text-xl font-bold">{
                                                selectedZone.status === 'CRITICAL' ? 'Critico' :
                                                    selectedZone.status === 'WARNING' ? 'Attenzione' : 'Ottimale'
                                            }</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Consumo</p>
                                            <p className="text-2xl font-bold">{selectedZone.consumption} <span className="text-sm font-medium text-slate-400">m³</span></p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-1">Anomalie</p>
                                            <p className="text-2xl font-bold">{selectedZone.anomalies}</p>
                                        </div>
                                    </div>

                                    {selectedZone.status === 'CRITICAL' ? (
                                        <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-200 text-sm font-medium">
                                            ⚠️ Rilevate multiple anomalie. Verifica prioritaria richiesta.
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm font-medium">
                                            ✅ Consumi nella norma. Nessuna azione richiesta.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center relative z-10 opacity-50">
                                <MapIcon size={48} className="mb-4 text-slate-600" />
                                <p className="text-lg font-bold text-slate-300">Seleziona una zona</p>
                                <p className="text-sm text-slate-500">Clicca sulla mappa per i dettagli</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Alerts List Section */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Segnalazioni Recenti</h2>
                        <p className="text-slate-400 text-sm font-medium">Anomalie di consumo rilevate nell'ultima settimana</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                <th className="py-4 pl-4">Stato</th>
                                <th className="py-4">Zona</th>
                                <th className="py-4">Utente</th>
                                <th className="py-4">Indirizzo</th>
                                <th className="py-4 text-right pr-4">Consumo (m³)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {alerts.length > 0 ? alerts.map((alert) => (
                                <tr key={alert.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                                                }`}></div>
                                            {alert.severity === 'CRITICAL' ? 'CRITICO' : 'ATTENZIONE'}
                                        </span>
                                    </td>
                                    <td className="py-4 font-medium text-slate-700">{alert.zone}</td>
                                    <td className="py-4 text-slate-600 font-medium">{alert.user}</td>
                                    <td className="py-4 text-slate-400 max-w-xs truncate">{alert.address}</td>
                                    <td className="py-4 text-right pr-4 font-bold text-slate-800">{alert.volume}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                                        Nessuna anomalia rilevata di recente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
