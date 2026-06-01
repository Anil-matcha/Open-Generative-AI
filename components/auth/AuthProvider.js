'use client';
// Auth + balance context. Wraps the app, exposes the Supabase session and the
// user's ruble balance, and — crucially — publishes the access token to the
// generation backend so it can deduct the balance:
//   • sets the `sb_access_token` cookie (read server-side in app/api/_lib/balance.js)
//   • sets the axios default `x-sb-token` header
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function setTokenEverywhere(token) {
    if (token) {
        // 7-day cookie; backend reads it on each generation request
        document.cookie = `sb_access_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
        axios.defaults.headers.common['x-sb-token'] = token;
    } else {
        document.cookie = 'sb_access_token=; path=/; max-age=0; SameSite=Lax';
        delete axios.defaults.headers.common['x-sb-token'];
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginOpen, setLoginOpen] = useState(false);
    const [cabinetOpen, setCabinetOpen] = useState(false);
    const [needFunds, setNeedFunds] = useState(null); // { required, balance } | null

    const loadProfile = useCallback(async (u) => {
        if (!u) { setProfile(null); return; }
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        if (data) setProfile(data);
        else {
            // First login — create the profile row
            const row = { id: u.id, email: u.email, full_name: u.user_metadata?.full_name || null, balance: 0 };
            await supabase.from('profiles').insert(row);
            setProfile(row);
        }
    }, []);

    const refreshBalance = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
    }, [user]);

    // Bootstrap session + subscribe to auth changes
    useEffect(() => {
        let sub;
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setTokenEverywhere(session?.access_token || null);
            setUser(session?.user || null);
            await loadProfile(session?.user || null);
            setLoading(false);

            sub = supabase.auth.onAuthStateChange((_evt, session) => {
                setTokenEverywhere(session?.access_token || null);
                setUser(session?.user || null);
                loadProfile(session?.user || null);
            }).data.subscription;
        })();
        return () => { sub?.unsubscribe?.(); };
    }, [loadProfile]);

    // Global 402 handler → prompt top-up
    useEffect(() => {
        const id = axios.interceptors.response.use(
            (r) => r,
            (err) => {
                if (err?.response?.status === 402) {
                    const d = err.response.data || {};
                    setNeedFunds({ required: d.required || 0, balance: d.balance || profile?.balance || 0 });
                }
                return Promise.reject(err);
            }
        );
        return () => axios.interceptors.response.eject(id);
    }, [profile]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return error.message;
        setUser(data.user);
        await loadProfile(data.user);
        setLoginOpen(false);
        return null;
    };

    const register = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/?confirmed=1` },
        });
        if (error) return error.message;
        if (data.user) {
            const needsConfirmation = !data.session || !data.user.email_confirmed_at;
            if (needsConfirmation) return '__CHECK_EMAIL__';
            await supabase.from('profiles').insert({ id: data.user.id, email, full_name: name, balance: 0 });
            setUser(data.user);
            await loadProfile(data.user);
            setLoginOpen(false);
        }
        return null;
    };

    const loginWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setTokenEverywhere(null);
        setUser(null);
        setProfile(null);
    };

    const value = {
        user, profile, loading,
        balance: Number(profile?.balance || 0),
        login, register, loginWithGoogle, logout, refreshBalance,
        loginOpen, setLoginOpen,
        cabinetOpen, setCabinetOpen,
        needFunds, setNeedFunds,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
