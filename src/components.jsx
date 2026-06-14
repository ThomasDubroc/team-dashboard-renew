import React from 'react';

export const TEAM = [
  { id: 'lilian',  name: 'Lilian Maudet',      initials: 'LM', color: 'var(--lilian)'  },
  { id: 'mathieu', name: "Mathieu d'Ornellas",  initials: 'MO', color: 'var(--mathieu)' },
  { id: 'clara',   name: 'Clara Baekelandt',    initials: 'CB', color: 'var(--clara)'   },
];

export const STAGES = [
  { key: '397654742', label: 'A renouveler',            color: '#8892aa' },
  { key: '397654743', label: 'Renouvellement en cours', color: '#4f8ef7' },
  { key: '399292111', label: 'Engagement à payer',      color: '#fbbf24' },
  { key: '399311590', label: 'Call Teamlead CS',        color: '#a78bfa' },
  { key: '397654744', label: 'Renouvelé',               color: '#34d399' },
  { key: '397777379', label: 'Churn',                   color: '#f87171' },
];

export function Avatar({ member, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: member.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{member.initials}</div>
  );
}

export function Card({ children, style = {} }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>{children}</div>;
}

export function KpiCard({ label, value, color, sub }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Space Grotesk', color, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function MemberRow({ member, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar member={member} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 13 }}>{member.name}</span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk', color: member.color }}>{value}</span>
        </div>
        <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: member.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Space Grotesk' }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

export function Loader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function PeriodToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
      {[
        { key: 'lastWeek',  label: 'Semaine dernière' },
        { key: 'thisMonth', label: 'Ce mois' },
      ].map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)} style={{
          padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
          background: value === key ? 'var(--surface)' : 'transparent',
          color: value === key ? 'var(--text)' : 'var(--text3)',
          fontWeight: value === key ? 600 : 400,
          boxShadow: value === key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
          transition: 'all 0.15s',
        }}>{label}</button>
      ))}
    </div>
  );
}
