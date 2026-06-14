import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { TEAM, Avatar, Card, KpiCard, SectionTitle } from './components.jsx';

const TOOLTIP = { backgroundColor: '#1e2333', titleColor: '#e8ecf4', bodyColor: '#8892aa', borderColor: '#2a3048', borderWidth: 1 };
const AXES = {
  x: { grid: { color: '#2a3048' }, ticks: { color: '#5a6480', font: { size: 10 } } },
  y: { grid: { color: '#2a3048' }, ticks: { color: '#5a6480', stepSize: 1 }, beginAtZero: true },
};

function MemberStats({ member, stats, period }) {
  const { calls, meetings, tickets, churnReason, churnNoShow } = stats;
  const [section, setSection] = useState('stats');

  const dayLabels = Object.keys(calls.byDay || {});
  const callLineData = {
    labels: dayLabels,
    datasets: [{
      data: dayLabels.map(d => calls.byDay[d]?.[member.id] || 0),
      borderColor: member.color, backgroundColor: `${member.color}20`,
      borderWidth: 2, pointRadius: 3, tension: 0.3, fill: true,
    }],
  };

  const reasons = (churnReason.reasons || []).filter(r => r.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, borderLeft: `4px solid ${member.color}` }}>
        <Avatar member={member} size={48} />
        <div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600 }}>{member.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Customer Care · Success On</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[
            { label: 'appels',   value: calls[member.id] || 0,       color: 'var(--accent)'  },
            { label: 'rdv',      value: meetings[member.id] || 0,     color: 'var(--purple)'  },
            { label: 'tickets',  value: tickets[member.id] || 0,      color: 'var(--green)'   },
            { label: 'churns',   value: churnReason[member.id] || 0,  color: 'var(--orange)'  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', color }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        <KpiCard label="Appels sortants"  value={calls[member.id] || 0}       color="var(--accent)"  sub={period === 'lastWeek' ? 'S-1' : 'Ce mois'} />
        <KpiCard label="RDV posés"        value={meetings[member.id] || 0}     color="var(--purple)"  sub={period === 'lastWeek' ? 'S-1' : 'Ce mois'} />
        <KpiCard label="Tickets clôturés" value={tickets[member.id] || 0}      color="var(--green)"   sub={period === 'lastWeek' ? 'S-1' : 'Ce mois'} />
        <KpiCard label="Churns"           value={churnReason[member.id] || 0}  color="var(--orange)"  sub={period === 'lastWeek' ? 'S-1' : 'Ce mois'} />
        <KpiCard label="No Show"          value={churnNoShow[member.id] || 0}  color="var(--red)"     sub="HP – Injoignable" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Call trend */}
        <Card>
          <SectionTitle sub="Appels sortants par jour">Activité téléphonique</SectionTitle>
          <div style={{ height: 150 }}>
            <Line data={callLineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOOLTIP }, scales: AXES }} />
          </div>
        </Card>

        {/* Churn reasons */}
        <Card>
          <SectionTitle sub={period === 'lastWeek' ? 'Semaine dernière' : 'Ce mois'}>Raisons de churn</SectionTitle>
          {reasons.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: 'var(--text3)', fontSize: 13 }}>Aucun churn</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reasons.map(({ reason, count }) => (
                <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{reason}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: member.color }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function IndividualView({ stats, period }) {
  const [active, setActive] = useState('lilian');
  const member = TEAM.find(t => t.id === active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Member selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {TEAM.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${active === t.id ? t.color : 'var(--border)'}`,
            background: active === t.id ? `${t.color}18` : 'var(--surface)',
            color: active === t.id ? t.color : 'var(--text2)',
            fontWeight: active === t.id ? 600 : 400,
            fontSize: 14, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
          }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: t.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{t.initials}</span>
            {t.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <MemberStats member={member} stats={stats} period={period} />
    </div>
  );
}
