import React, { useState, useEffect, useCallback } from 'react';
import { TEAM, Loader, PeriodToggle } from './components.jsx';
import TeamView from './TeamView.jsx';
import IndividualView from './IndividualView.jsx';
import { TeamPipelineView, IndividualPipelineView } from './PipelineView.jsx';

const NAV = [
  { key: 'team',       label: '👥 Équipe'     },
  { key: 'individual', label: '👤 Individuel'  },
  { key: 'pipeline',   label: '🔄 Pipeline'    },
];

export default function App() {
  const [view,    setView]    = useState('team');
  const [period,  setPeriod]  = useState('lastWeek');
  const [state,   setState]   = useState({ loading: true, error: null, data: null, generatedAt: null });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(`/data.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`data.json introuvable — lance le workflow GitHub Actions`);
      const json = await res.json();
      setState({ loading: false, error: null, data: json, generatedAt: new Date(json.generatedAt) });
    } catch (e) {
      setState({ loading: false, error: e.message, data: null, generatedAt: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats    = state.data?.[period];
  const pipeline = state.data?.pipeline;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 'auto' }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #4f8ef7, #a78bfa)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎯</div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14 }}>Customer Care · Success On</span>
        </div>

        {/* Period toggle — hidden on pipeline */}
        {view !== 'pipeline' && <PeriodToggle value={period} onChange={setPeriod} />}

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 8, padding: 3 }}>
          {NAV.map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)} style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
              background: view === key ? 'var(--surface)' : 'transparent',
              color: view === key ? 'var(--text)' : 'var(--text3)',
              fontWeight: view === key ? 600 : 400,
              boxShadow: view === key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {state.generatedAt && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {state.generatedAt.toLocaleDateString('fr-FR')} {state.generatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={load} disabled={state.loading} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, opacity: state.loading ? 0.5 : 1 }}>
            ↻ Actualiser
          </button>
        </div>
      </header>

      {/* Sub-header: date + team legend */}
      <div style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          {TEAM.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {state.loading ? (
          <Loader />
        ) : state.error ? (
          <div style={{ maxWidth: 540, margin: '60px auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <p style={{ color: 'var(--red)', marginBottom: 20 }}>{state.error}</p>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
              GitHub → Actions → <strong>Sync HubSpot Stats</strong> → Run workflow<br />
              Puis reviens ici et clique Actualiser.
            </p>
          </div>
        ) : state.data ? (
          view === 'team'       ? <TeamView stats={stats} period={period} /> :
          view === 'individual' ? <IndividualView stats={stats} period={period} /> :
          <TeamPipelineView pipeline={pipeline} />
        ) : null}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
