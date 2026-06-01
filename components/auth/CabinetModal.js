'use client';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const PRESETS = [500, 1000, 2000, 5000];
const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];

export default function CabinetModal() {
    const { cabinetOpen, setCabinetOpen, profile, balance, logout, refreshBalance, user } = useAuth();
    const [amount, setAmount] = useState('1000');
    const [busy, setBusy] = useState(false);

    // After returning from Точка (?payment=success&order=...), verify & credit.
    const verifyReturn = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('payment') !== 'success') return;
        const order = url.searchParams.get('order');
        if (!order) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            // Poll verify a few times (Точка may confirm with a slight delay)
            for (let i = 0; i < 10; i++) {
                const r = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                    body: JSON.stringify({ orderId: order }),
                });
                const j = await r.json();
                if (j.status === 'paid') {
                    await refreshBalance();
                    if (j.credited) toast.success('Баланс пополнен');
                    break;
                }
                await new Promise(res => setTimeout(res, 2000));
            }
        } finally {
            url.searchParams.delete('payment');
            url.searchParams.delete('order');
            window.history.replaceState({}, '', url.toString());
        }
    }, [refreshBalance]);

    useEffect(() => { verifyReturn(); }, [verifyReturn]);

    if (!cabinetOpen) return null;

    const topup = async () => {
        const value = Number(amount);
        if (!Number.isFinite(value) || value < 100) { toast.error('Минимум 100 руб'); return; }
        setBusy(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { toast.error('Сессия истекла, войдите снова'); return; }
            const r = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ amount: value }),
            });
            const j = await r.json();
            if (!r.ok || !j.paymentUrl) { toast.error(j.error || 'Не удалось создать платёж'); return; }
            window.location.href = j.paymentUrl;
        } catch (e) {
            toast.error(e?.message || 'Ошибка сети');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setCabinetOpen(false)}>
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5"
                 onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Личный кабинет</h3>
                    <button onClick={() => setCabinetOpen(false)} className="text-white/40 hover:text-white">✕</button>
                </div>

                <div className="text-sm text-white/50">{profile?.email}</div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="text-xs text-white/50">Ваш баланс</div>
                    <div className="text-2xl font-bold text-white">{balance.toFixed(2)} ₽</div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm text-white/70">Пополнить баланс</div>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESETS.map(p => (
                            <button key={p} onClick={() => setAmount(String(p))}
                                    className={`py-2 rounded-lg text-sm border transition-colors ${
                                        amount === String(p)
                                            ? 'bg-purple-600 border-purple-500 text-white'
                                            : 'bg-black/40 border-white/10 text-white/70 hover:border-white/30'}`}>
                                {p}₽
                            </button>
                        ))}
                    </div>
                    <input type="number" min={100} max={100000} value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                           placeholder="Сумма, ₽" />
                    <button onClick={topup} disabled={busy}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                        {busy ? '...' : 'Пополнить через Точку'}
                    </button>
                    <div className="text-xs text-white/30 text-center">Карта или СБП · от 100 ₽</div>
                </div>

                {ADMIN_EMAILS.some(e => e.toLowerCase() === (user?.email || '').toLowerCase()) && (
                    <a href="/admin"
                       className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors text-center block">
                        ⚙ Админ-панель
                    </a>
                )}

                <button onClick={logout}
                        className="w-full py-2 text-sm text-white/50 hover:text-red-400 transition-colors">
                    Выйти из аккаунта
                </button>
            </div>
        </div>
    );
}
