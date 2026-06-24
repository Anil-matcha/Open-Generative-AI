'use client';

/**
 * app/admin/page.js
 * Full admin dashboard — user management, credit system, MuAPI key config.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: '#030303',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
  },
  header: {
    background: '#0a0a0a',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 24px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { fontSize: '15px', fontWeight: '700', color: '#22d3ee' },
  badge: {
    background: 'rgba(34,211,238,0.1)',
    border: '1px solid rgba(34,211,238,0.2)',
    color: '#22d3ee',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  statCard: {
    background: '#0f0f0f',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '20px',
  },
  statLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#fff' },
  card: {
    background: '#0f0f0f',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '10px 20px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  td: {
    padding: '13px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
  },
  btn: {
    background: '#22d3ee',
    color: '#000',
    border: 'none',
    borderRadius: '7px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSm: {
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  btnDanger: {
    border: '1px solid rgba(239,68,68,0.3)',
    background: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  modal: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modalBox: {
    background: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '28px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  tag: (active) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    color: active ? '#4ade80' : '#f87171',
    border: `1px solid ${active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
  }),
  tabs: { display: 'flex', gap: '4px', marginBottom: '28px' },
  tab: (active) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(34,211,238,0.12)' : 'transparent',
    color: active ? '#22d3ee' : 'rgba(255,255,255,0.4)',
  }),
};

// ─── Modal: Create / Edit User ────────────────────────────────────────────────

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
    credits: user?.credits ?? 0,
    credit_limit: user?.credit_limit ?? '',
    active: user?.active ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit() {
    setErr('');
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            active: form.active,
            credit_limit: form.credit_limit === '' ? null : parseFloat(form.credit_limit) || null,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
      } else {
        if (!form.password) { setErr('Senha obrigatória'); setSaving(false); return; }
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Erro'); return; }
      onSave();
    } catch {
      setErr('Falha na conexão');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px' }}>{isEdit ? 'Editar usuário' : 'Novo usuário'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={S.label}>Nome</label>
            <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div>
            <label style={S.label}>{isEdit ? 'Nova senha (deixe vazio para manter)' : 'Senha'}</label>
            <input style={S.input} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Função</label>
              <select style={{ ...S.input, appearance: 'none' }} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Status</label>
              <select style={{ ...S.input, appearance: 'none' }} value={form.active} onChange={e => set('active', parseInt(e.target.value))}>
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>
          {!isEdit && (
            <div>
              <label style={S.label}>Créditos iniciais</label>
              <input style={S.input} type="number" min="0" step="1" value={form.credits} onChange={e => set('credits', parseFloat(e.target.value) || 0)} />
            </div>
          )}
          <div>
            <label style={S.label}>Limite de créditos (deixe vazio para sem limite)</label>
            <input style={S.input} type="number" min="0" step="1" value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)} placeholder="Ex: 10" />
          </div>
          {err && <div style={{ color: '#f87171', fontSize: '12px' }}>{err}</div>}
          <button style={{ ...S.btn, marginTop: '4px' }} onClick={submit} disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Adjust Credits ────────────────────────────────────────────────────

function CreditModal({ user, onClose, onSave }) {
  const [delta, setDelta] = useState('');
  const [note, setNote] = useState('add');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    const amount = parseFloat(delta);
    if (!amount || amount <= 0) { setErr('Informe um valor válido'); return; }
    setSaving(true);
    setErr('');
    const creditDelta = note === 'deduct' ? -amount : amount;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditDelta }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Erro'); return; }
      onSave();
    } catch {
      setErr('Falha na conexão');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth: '360px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px' }}>Ajustar créditos</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
          {user.name} — saldo atual: <strong style={{ color: '#22d3ee' }}>{user.credits.toFixed(1)} créditos</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={S.label}>Operação</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['add', '+ Adicionar'], ['deduct', '− Deduzir']].map(([v, l]) => (
                <button key={v} onClick={() => setNote(v)} style={{
                  flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', cursor: 'pointer',
                  border: `1px solid ${note === v ? '#22d3ee' : 'rgba(255,255,255,0.1)'}`,
                  background: note === v ? 'rgba(34,211,238,0.1)' : 'transparent',
                  color: note === v ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                  fontWeight: note === v ? '600' : '400',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={S.label}>Quantidade</label>
            <input style={S.input} type="number" min="0.1" step="1" value={delta} onChange={e => setDelta(e.target.value)} placeholder="Ex: 50" autoFocus />
          </div>
          {err && <div style={{ color: '#f87171', fontSize: '12px' }}>{err}</div>}
          <button style={S.btn} onClick={submit} disabled={saving}>
            {saving ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ onLogout }) {
  const [masterKey, setMasterKey] = useState('');
  const [keyPreview, setKeyPreview] = useState('');
  const [keySet, setKeySet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      setKeySet(d.masterKeySet);
      setKeyPreview(d.masterKeyPreview);
    });
  }, []);

  async function saveKey() {
    if (!masterKey.trim()) return;
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ muapiMasterKey: masterKey }),
    });
    setSaving(false);
    setSaved(true);
    setKeySet(true);
    setKeyPreview(masterKey.slice(0, 6) + '••••••••••••');
    setMasterKey('');
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Configurações do sistema</span>
      </div>
      <div style={{ padding: '24px' }}>
        <div style={{ maxWidth: '480px' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>MuAPI Master Key</h4>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: 1.5 }}>
            Esta chave é usada pelo servidor para todas as gerações. Nunca é exposta ao cliente.
            Obtenha em <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" style={{ color: '#22d3ee' }}>muapi.ai/access-keys</a>.
          </p>
          {keySet && (
            <div style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              Chave ativa: <code style={{ color: '#22d3ee', fontFamily: 'monospace' }}>{keyPreview}</code>
            </div>
          )}
          <label style={S.label}>Nova chave</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              style={{ ...S.input, fontFamily: 'monospace' }}
              type="password"
              value={masterKey}
              onChange={e => setMasterKey(e.target.value)}
              placeholder="mua-xxxxxxxxxxxxxxxxxxxx"
            />
            <button style={{ ...S.btn, whiteSpace: 'nowrap', flexShrink: 0 }} onClick={saveKey} disabled={saving}>
              {saved ? '✓ Salvo' : saving ? '...' : 'Salvar'}
            </button>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>Conta do administrador</h4>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
              Para alterar a senha do admin, acesse o painel de usuários e edite sua conta.
            </p>
            <button style={S.btnDanger} onClick={onLogout}>Sair da sessão</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [modal, setModal] = useState(null); // { type: 'user'|'credit'|'delete', user? }
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersRes, settingsRes, meRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/settings'),
      fetch('/api/auth/me'),
    ]);
    if (usersRes.status === 401) { router.push('/login'); return; }
    const usersData = await usersRes.json();
    const settingsData = await settingsRes.json();
    const meData = await meRes.json();
    setUsers(Array.isArray(usersData) ? usersData : []);
    setStats(settingsData.stats || {});
    setAdminName(meData.name || 'Admin');
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function deleteUser(user) {
    if (!confirm(`Remover ${user.name}? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    loadData();
  }

  async function toggleActive(user) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: user.active ? 0 : 1 }),
    });
    loadData();
  }

  const nonAdmins = users.filter(u => u.role !== 'admin');

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.logo}>Criativos 1PRA1</span>
          <span style={S.badge}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Olá, {adminName}</span>
          <button onClick={logout} style={S.btnSm}>Sair</button>
        </div>
      </div>

      <div style={S.main}>
        {/* Stats */}
        <div style={S.statsGrid}>
          {[
            { label: 'Usuários ativos', value: stats.activeUsers ?? '—' },
            { label: 'Total de usuários', value: stats.totalUsers ?? '—' },
            { label: 'Créditos em circulação', value: stats.totalCredits != null ? stats.totalCredits.toFixed(1) : '—' },
            { label: 'Consumo hoje (créditos)', value: stats.totalUsageToday != null ? stats.totalUsageToday.toFixed(1) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={S.statCard}>
              <div style={S.statLabel}>{label}</div>
              <div style={S.statValue}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {[['users', 'Usuários'], ['settings', 'Configurações']].map(([id, label]) => (
            <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>Usuários ({nonAdmins.length})</span>
              <button style={S.btn} onClick={() => setModal({ type: 'user' })}>+ Novo usuário</button>
            </div>
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Carregando...</div>
            ) : (
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Nome', 'Email', 'Status', 'Créditos', 'Limite', 'Último acesso', 'Ações'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nonAdmins.length === 0 ? (
                    <tr><td colSpan="7" style={{ ...S.td, textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '32px' }}>
                      Nenhum usuário cadastrado ainda. Clique em "Novo usuário" para começar.
                    </td></tr>
                  ) : nonAdmins.map(user => (
                    <tr key={user.id} style={{ transition: 'background 0.15s' }}>
                      <td style={{ ...S.td, fontWeight: '500', color: '#fff' }}>{user.name}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '12px' }}>{user.email}</td>
                      <td style={S.td}>
                        <span style={S.tag(user.active)}>{user.active ? 'Ativo' : 'Inativo'}</span>
                      </td>
                      <td style={{ ...S.td, fontWeight: '600', color: '#22d3ee' }}>
                        {user.credits.toFixed(1)}
                      </td>
                      <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)' }}>
                        {user.credit_limit != null ? user.credit_limit : '—'}
                      </td>
                      <td style={{ ...S.td, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button style={S.btnSm} onClick={() => setModal({ type: 'user', user })}>Editar</button>
                          <button style={S.btnSm} onClick={() => setModal({ type: 'credit', user })}>Créditos</button>
                          <button style={S.btnSm} onClick={() => toggleActive(user)}>
                            {user.active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button style={S.btnDanger} onClick={() => deleteUser(user)}>Remover</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && <SettingsTab onLogout={logout} />}
      </div>

      {/* Modals */}
      {modal?.type === 'user' && (
        <UserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadData(); }}
        />
      )}
      {modal?.type === 'credit' && (
        <CreditModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadData(); }}
        />
      )}
    </div>
  );
}
