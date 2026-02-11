import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ setUser }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            const response = await fetch('http://localhost:5001/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
                if (data.userType === 'ADMIN' || data.email === 'admin@dropzero.com') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                setError(data.message || 'Errore autenticazione Google');
            }
        } catch (err) {
            setError('Impossibile connettersi al server');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
                if (data.userType === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                setError(data.message || 'Credenziali non valide');
            }
        } catch (err) {
            setError('Errore di connessione al server');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-1 mb-2">
                        <img src="/logo.jpeg" alt="DropZero Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Accedi a DropZero</h2>
                    <p className="text-slate-400 mt-2 text-center text-sm">Monitora i tuoi consumi idrici in tempo reale</p>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-6 border border-rose-100 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                            placeholder="mario@esempio.it"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-500/25 mt-2 transition-colors uppercase tracking-wide text-xs h-12"
                    >
                        Accedi con Account
                    </button>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Oppure Google</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Accesso Google fallito')}
                            useOneTap
                            theme="outline"
                            size="large"
                            width="280"
                        />
                    </div>
                </form>

                <p className="mt-8 text-center text-slate-400 text-sm">
                    Non hai un account? <a href="/register" className="text-primary font-bold hover:underline">Registrati</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
