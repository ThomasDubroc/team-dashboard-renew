import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { TEAM, STAGES, Card, SectionTitle, Avatar } from './components.jsx';

const TOOLTIP = { backgroundColor: '#1e2333', titleColor: '#e8ecf4', bodyColor: '#8892aa', borderColor: '#2a3048', borderWidth: 1 };

function StageBar({ stage, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{stage.label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk', color: stage.color }}>{count}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: stage.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function DealRow({ deal }) {
  const stage = STAGES.find(s => s.key === deal.stage);
  const member = TEAM.find(t => t.id === deal.member);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--surface2)', borderRadius: 8, borderLeft: `3px solid ${stage?.color || 'var(--border)'}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.name}</div>
        {deal.amount && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{deal.amount.toLocaleString('fr-FR')} €{deal.closedate ? ` · ${new Date(deal.closedate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}</div>}
      </div>
      {member && <Avatar member={member} size={24} />}
      {stage && <span style={{ fontSize: 11, fontWeight: 600, color: stage.color, background: `${stage.color}18`, border: `1px solid ${stage.color}30`, borderRadius: 12, padding: '2px 8px', whiteSpace: 'nowrap' }}>{stage.label}</span>}
    </div>
  );
}

export function TeamPipelineView({ pipeline }) {
  const [activeStage, setActiveStage] = useState(null);

  const stageCounts = {};
  for (const s of STAGES) {
    stageCounts[s.key] = pipeline.deals.filter(d => d.stage === s.key).length;
  }

  const displayDeals = activeStage
    ? pipeline.deals.filter(d => d.stage === activeStage)
    : pipeline.deals;

  const barData = {
    labels: TEAM.map(t => t.name.split(' ')[0]),
    datasets: [{
      data: TEAM.map(t => pipeline.byMember[t.id] || 0),
      backgroundColor: TEAM.map(t => `${t.color}cc`),
      borderColor: TEAM.map(t => t.color),
      borderWidth: 1, borderRadius: 6,
    }],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Funnel */}
        <Card>
          <SectionTitle sub={`${pipeline.total} transactions au total`}>Entonnoir OPS_Renew_V3</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={() => setActiveStage(null)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${!activeStage ? 'var(--accent)' : 'var(--border)'}`, background: !activeStage ? 'var(--accent)20' : 'transparent', color: !activeStage ? 'var(--accent)' : 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>Tous</button>
            {STAGES.map(s => (
              <button key={s.key} onClick={() => setActiveStage(s.key === activeStage ? null : s.key)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${activeStage === s.key ? s.color : 'var(--border)'}`, background: activeStage === s.key ? `${s.color}20` : 'transparent', color: activeStage === s.key ? s.color : 'var(--text3)', fontSize: 11, cursor: 'pointer' }}>
                {s.label} ({stageCounts[s.key] || 0})
              </button>
            ))}
          </div>
          {STAGES.map(s => <StageBar key={s.key} stage={s} count={stageCounts[s.key] || 0} total={pipeline.total} />)}
        </Card>

        {/* Bar par membre */}
        <Card>
          <SectionTitle sub="Transactions par membre">Répartition équipe</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {TEAM.map(t => (
              <div key={t.id} style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Grotesk', color: t.color }}>{pipeline.byMember[t.id] || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{t.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 120 }}>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOOLTIP }, scales: { x: { grid: { display: false }, ticks: { color: '#5a6480' } }, y: { grid: { color: '#2a3048' }, ticks: { color: '#5a6480', stepSize: 10 }, beginAtZero: true } } }} />
          </div>
        </Card>
      </div>

      {/* Deal list */}
      <Card>
        <SectionTitle sub={activeStage ? `Filtré : ${STAGES.find(s => s.key === activeStage)?.label}` : 'Toutes les transactions'}>
          Transactions ({displayDeals.length})
        </SectionTitle>
        {displayDeals.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucune transaction</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
            {displayDeals.map(d => <DealRow key={d.id} deal={d} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

export function IndividualPipelineView({ member, pipeline }) {
  const [activeStage, setActiveStage] = useState(null);
  const myDeals = pipeline.deals.filter(d => d.member === member.id);

  const stageCounts = {};
  for (const s of STAGES) stageCounts[s.key] = myDeals.filter(d => d.stage === s.key).length;
  const maxCount = Math.max(...Object.values(stageCounts), 1);

  const displayDeals = activeStage ? myDeals.filter(d => d.stage === activeStage) : myDeals;

  const renewCount = stageCounts['397654744'] || 0;
  const churnCount = stageCounts['397777379'] || 0;
  const renewRate = (renewCount + churnCount) > 0 ? Math.round(renewCount / (renewCount + churnCount) * 100) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stage KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {STAGES.map(s => (
          <button key={s.key} onClick={() => setActiveStage(s.key === activeStage ? null : s.key)} style={{
            padding: '10px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
            border: `1px solid ${activeStage === s.key ? s.color : 'var(--border)'}`,
            background: activeStage === s.key ? `${s.color}18` : 'var(--surface2)',
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk', color: s.color }}>{stageCounts[s.key] || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {renewRate !== null && (
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Taux de renouvellement</div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${renewRate}%`, background: 'var(--green)', transition: 'width 0.7s ease' }} />
              <div style={{ width: `${100 - renewRate}%`, background: 'var(--red)', transition: 'width 0.7s ease' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--green)' }}>{renewRate}%</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{renewCount} renew / {churnCount} churn</div>
          </div>
        </div>
      )}

      <Card>
        <SectionTitle sub={activeStage ? STAGES.find(s => s.key === activeStage)?.label : 'Toutes mes transactions'}>
          Mes transactions ({displayDeals.length})
        </SectionTitle>
        {displayDeals.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucune transaction</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 350, overflowY: 'auto' }}>
            {displayDeals.map(d => <DealRow key={d.id} deal={d} />)}
          </div>
        )}
      </Card>
    </div>
  );
}
