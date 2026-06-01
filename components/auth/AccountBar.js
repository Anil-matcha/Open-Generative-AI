'use client';
import { useAuth } from './AuthProvider';
import LoginModal from './LoginModal';
import CabinetModal from './CabinetModal';

function InsufficientFundsDialog() {
    const { needFunds, setNeedFunds, setCabinetOpen, balance } = useAuth();
    if (!needFunds) return null;
    const required = needFunds.required || 0;
    const bal = needFunds.balance ?? balance;
    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setNeedFunds(null)}>
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
                 onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Недостаточно средств</h3>
                    <button onClick={() => setNeedFunds(null)} className="text-white/40 hover:text-white">✕</button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex-1">
                        <div className="text-xs text-white/50">Ваш баланс</div>
                        <div className="text-lg font-semibold text-white">{Number(bal).toFixed(2)} ₽</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-white/50">Нужно</div>
                        <div className="text-lg font-semibold text-red-400">{Number(required).toFixed(2)} ₽</div>
                    </div>
                </div>
                <button onClick={() => { setNeedFunds(null); setCabinetOpen(true); }}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors">
                    Пополнить баланс
                </button>
            </div>
        </div>
    );
}

export default function AccountBar() {
    const { user, balance, loading, setLoginOpen, setCabinetOpen } = useAuth();

    return (
        <>
            <div className="fixed top-3 right-3 z-[60] flex items-center gap-2">
                {!loading && (user ? (
                    <button onClick={() => setCabinetOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-white/10 text-white text-sm hover:border-purple-500 transition-colors backdrop-blur">
                        <span className="text-purple-400">●</span>
                        <span className="font-medium">{balance.toFixed(0)} ₽</span>
                    </button>
                ) : (
                    <button onClick={() => setLoginOpen(true)}
                            className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
                        Войти
                    </button>
                ))}
            </div>
            <LoginModal />
            <CabinetModal />
            <InsufficientFundsDialog />
        </>
    );
}
