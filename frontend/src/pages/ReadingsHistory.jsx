import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../services/api';
import { useOutletContext } from 'react-router-dom';
import { Download, Calendar, Droplets, Euro, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const ReadingsHistory = () => {
    const { user } = useOutletContext();

    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user.token) return;
            try {
                setLoading(true);
                const data = await fetchHistory(user._id, user.token, page);
                // API fetches all for now or paginated? checking controller...
                // The controller implementation supports pagination via query params
                // But let's assume api.js might need a tweak to pass query params or we just fetch all and paginate client side if api.js is simple.
                // Looking at previous step api.js it was generic. Let's assume it returns { readings, totalPages }

                // Note: The controller sends { readings, currentPage, totalPages, totalReadings }
                setReadings(data.readings);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [user._id, user.token, page]);

    const handleExportCSV = () => {
        if (!readings.length) return;

        const headers = ['Data Inizio', 'Data Fine', 'Lettura (m3)', 'Consumo (L)', 'Costo (€)', 'Stato'];
        const rows = readings.map(r => [
            new Date(r.weekStartDate).toLocaleDateString(),
            new Date(r.weekEndDate).toLocaleDateString(),
            r.currentReading,
            r.volumeConsumed,
            r.cost.toFixed(2),
            'Verificato'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `storico_consumi_${user.firstName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800">Storico Letture</h2>
                    <p className="text-slate-500 mt-1">Consulta il dettaglio di tutte le tue letture settimanali.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                >
                    <Download size={18} />
                    <span>Esporta CSV</span>
                </button>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Filters Logic Placeholder */}
                <div className="p-5 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca per data..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-sky-100 outline-none text-sm text-slate-600 font-medium"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">Caricamento storico...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                    <th className="p-5 border-b border-slate-100">Periodo</th>
                                    <th className="p-5 border-b border-slate-100">Lettura (m³)</th>
                                    <th className="p-5 border-b border-slate-100">Consumo</th>
                                    <th className="p-5 border-b border-slate-100">Costo Stimato</th>
                                    <th className="p-5 border-b border-slate-100">Stato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {readings.map((reading) => (
                                    <tr key={reading._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">
                                                        {new Date(reading.weekEndDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-slate-400">Settimana {reading.readingId.split('-').pop()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-medium text-slate-600">
                                            {reading.currentReading.toFixed(2)}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <Droplets size={16} className="text-sky-500" />
                                                <span className="font-bold text-slate-700">{reading.volumeConsumed} L</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                                                <span>€ {reading.cost.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Reale
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="p-5 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pagina {page} di {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingsHistory;
