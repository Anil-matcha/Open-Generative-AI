'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';

export default function LoginModal() {
    const { loginOpen, setLoginOpen, login, register, loginWithGoogle } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);

    if (!loginOpen) return null;

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        const err = mode === 'login'
            ? await login(email, password)
            : await register(email, password, name);
        setBusy(false);
        if (err === '__CHECK_EMAIL__') {
            toast.success('Проверьте почту — отправлено письмо для подтверждения');
            setMode('login');
            return;
        }
        if (err) { toast.error(err); return; }
        toast.success(mode === 'login' ? 'Вход выполнен' : 'Аккаунт создан');
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setLoginOpen(false)}>
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
                 onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                        {mode === 'login' ? 'Вход' : 'Регистрация'}
                    </h3>
                    <button onClick={() => setLoginOpen(false)} className="text-white/40 hover:text-white">✕</button>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {mode === 'register' && (
                        <input className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                               placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required />
                    )}
                    <input type="email" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                           placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                           placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    <button type="submit" disabled={busy}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
                        {busy ? '...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
                    </button>
                </form>

                <button onClick={loginWithGoogle}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm rounded-lg transition-colors">
                    Войти через Google
                </button>

                <div className="text-center text-sm text-white/50">
                    {mode === 'login' ? (
                        <>Нет аккаунта?{' '}
                            <button onClick={() => setMode('register')} className="text-purple-400 hover:underline">Регистрация</button>
                        </>
                    ) : (
                        <>Уже есть аккаунт?{' '}
                            <button onClick={() => setMode('login')} className="text-purple-400 hover:underline">Войти</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
