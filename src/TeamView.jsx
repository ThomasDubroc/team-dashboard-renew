import React from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { TEAM, KpiCard, Card, MemberRow, SectionTitle } from './components.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const TOOLTIP = { backgroundColor: '#1e2333', titleColor: '#e8ecf4', bodyColor: '#8892aa', borderColor: '#2a3048', borderWidth: 1 };
const AXES = {
  x: { grid: { color: '#2a3048' }, ticks: { color: '#5a6480', font: { size: 11 } } },
  y: { grid: { color: '#2a3048' }, ticks: { color: '#5a6480', stepSize: 1 }, beginAtZero: true },
};

export default function TeamView({ stats, period }) {
  const { calls, meetings, tickets, churnReason, churnNoShow } = stats;

  const maxCalls    = Math.max(calls.lilian,    calls.mathieu,    calls.clara,    1);
  const maxMeetings = Math.max(meetings.lilian, meetings.mathieu, meetings.clara, 1);
  const maxTickets  = Math.max(tickets.lilian,  tickets.mathieu,  tickets.clara,  1);
  const maxChurn    = Math.max(churnReason.lilian, churnReason.mathieu, churnReason.clara, 1);
  const maxNoShow   = Math.max(churnNoShow.lilian, churnNoShow.mathieu, churnNoShow.clara, 1);

  // Calls by day chart
  const dayLabels = Object.keys(calls.byDay || {});
  const callLineData = {
    labels: dayLabels,
    datasets: TEAM.map(t => ({
      label: t.name.split(' ')[0],
      data: dayLabels.map(d => calls.byDay[d]?.[t.id] || 0),
      borderColor: t.color, backgroundColor: `${t.color}20`,
      borderWidth: 2, pointRadius: 3, tension: 0.3, fill: false,
    })),
  };

  // Churn doughnut
  const top5 = (churnReason.reasons || []).slice(0, 5);
  const churnColors = ['#f87171', '#fb923c', '#fbbf24', '#a78bfa', '#4f8ef7'];
  const churnDoughnut = {
    labels: top5.map(r => r.reason),
    datasets: [{ data: top5.map(r => r.count), backgroundColor: churnColors.map(c => `${c}cc`), borderColor: churnColors, borderWidth: 1 }],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <KpiCard label="Appels sortants"  value={calls.total}       color="var(--accent)"  sub={period === 'lastWeek' ? 'Semaine dernière' : 'Ce mois'} />
        <KpiCard label="RDV posés"        value={meetings.total}    color="var(--purple)"  sub={period === 'lastWeek' ? 'Semaine dernière' : 'Ce mois'} />
        <KpiCard label="Tickets clôturés" value={tickets.total}     color="var(--green)"   sub={period === 'lastWeek' ? 'Semaine dernière' : 'Ce mois'} />
        <KpiCard label="Churns"           value={churnReason.total} color="var(--orange)"  sub={period === 'lastWeek' ? 'Semaine dernière' : 'Ce mois'} />
        <KpiCard label="No Show"          value={churnNoShow.total} color="var(--red)"     sub="HP – Injoignable" />
      </div>

      {/* Appels + RDV */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Appels sortants par membre">📞 Appels</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {TEAM.map(t => <MemberRow key={t.id} member={t} value={calls[t.id] || 0} max={maxCalls} />)}
          </div>
          <div style={{ height: 120 }}>
            <Line data={callLineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: '#8892aa', boxWidth: 10, font: { size: 10 } } }, tooltip: TOOLTIP }, scales: AXES }} />
          </div>
        </Card>

        <Card>
          <SectionTitle sub="RDV posés par membre">📅 Rendez-vous</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TEAM.map(t => <MemberRow key={t.id} member={t} value={meetings[t.id] || 0} max={maxMeetings} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
            {TEAM.map(t => (
              <div key={t.id} style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', color: t.color }}>{meetings[t.id] || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{t.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tickets + Churn */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle sub="Tickets clôturés par membre">✓ Tickets clôturés</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TEAM.map(t => <MemberRow key={t.id} member={t} value={tickets[t.id] || 0} max={maxTickets} />)}
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Raisons de churn">⚠ Churn Reasons</SectionTitle>
          {top5.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucun churn sur cette période</p>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                <Doughnut data={churnDoughnut} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TOOLTIP } }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {top5.map(({ reason, count }, i) => (
                  <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: churnColors[i], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{reason}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: churnColors[i] }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>No Show (HP – Injoignable)</div>
            {TEAM.map(t => <MemberRow key={t.id} member={t} value={churnNoShow[t.id] || 0} max={maxNoShow} />)}
          </div>
        </Card>
      </div>

    </div>
  );
}
