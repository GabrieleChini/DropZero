import React, { useState } from 'react';
import { X, Save, Loader, Droplets } from 'lucide-react';

const NewReadingModal = ({ isOpen, onClose, onSubmit }) => {
    const [reading, setReading] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onSubmit(parseFloat(reading), date);
            onClose(); // Close on success
            setReading(''); // Reset
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Droplets className="text-sky-500" />
                        Nuova Lettura
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 mb-4">
                        <p className="text-xs text-sky-700 font-medium">Inserisci i numeri neri del tuo contatore (metri cubi).</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">Lettura Attuale (m³)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={reading}
                            onChange={(e) => setReading(e.target.value)}
                            placeholder="Es. 1250.45"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none font-bold text-slate-800 text-lg transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">Data Lettura</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl border border-rose-100">
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-sky-600 text-white hover:bg-sky-500 py-3 rounded-xl font-bold transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                            Salva Lettura
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewReadingModal;
