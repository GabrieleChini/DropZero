import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchUserProfile, updateUserProfile } from '../services/api';

const Profile = () => {
    const userString = localStorage.getItem('user');
    const localUser = userString ? JSON.parse(userString) : { _id: 'mock_id' };

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    useEffect(() => {
        const loadProfile = async () => {
            if (!localUser.token) return;
            try {
                const data = await fetchUserProfile(localUser._id, localUser.token);
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    phoneNumber: data.phoneNumber || '',
                    address: data.address || ''
                });
            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [localUser._id, localUser.token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updatedUser = await updateUserProfile(localUser._id, localUser.token, formData);

            if (updatedUser._id) {
                setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });

                // Update local storage to reflect name changes immediately in UI
                const newLocalUser = { ...localUser, ...updatedUser, token: localUser.token };
                localStorage.setItem('user', JSON.stringify(newLocalUser));

                // Dispatch event to update header name if we were using context/listeners (simplified here)
                // In a real app we'd use Context API to auto-update the header name
            } else {
                setMessage({ type: 'error', text: 'Errore durante l\'aggiornamento.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Errore di connessione.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Caricamento profilo...</div>;

    return (
        <div className="max-w-4xl mx-auto animate-in pb-10">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-800">Il tuo Profilo</h2>
                <p className="text-slate-500 mt-1">Gestisci le tue informazioni personali e preferenze.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center h-fit">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-6 ring-4 ring-white">
                        {formData.firstName?.charAt(0) || 'U'}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{formData.firstName} {formData.lastName}</h3>
                    <p className="text-slate-500 text-sm mb-6">{formData.email}</p>

                    <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Stato Account</span>
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 rounded-md">Attivo</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tipo Utente</span>
                            <span className="font-bold text-slate-700">Privato</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Iscritto dal</span>
                            <span className="font-bold text-slate-700">Gen 2024</span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <User size={20} className="text-sky-600" />
                        Dati Personali
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">Nome</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-sky-100 outline-none font-medium text-slate-700 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">Cognome</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-sky-100 outline-none font-medium text-slate-700 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                <Mail size={16} /> Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-sky-100 outline-none font-medium text-slate-700 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                <Phone size={16} /> Telefono
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-sky-100 outline-none font-medium text-slate-700 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                <MapPin size={16} /> Indirizzo Fornitura
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-sky-100 outline-none font-medium text-slate-700 transition-all"
                            />
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            {message && (
                                <div className={`flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    {message.text}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="ml-auto bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
