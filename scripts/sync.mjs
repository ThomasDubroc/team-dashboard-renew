import fs from 'fs';

const TOKEN = process.env.HUBSPOT_TOKEN;
const BASE  = 'https://api.hubapi.com';
if (!TOKEN) { console.error('❌ HUBSPOT_TOKEN manquant'); process.exit(1); }

const HEADERS = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// Team owner IDs (confirmed)
const OWNERS = {
  '75453551':   'lilian',
  '650299108':  'mathieu',
  '1722214870': 'clara',
};
const OWNER_IDS = Object.keys(OWNERS);

// Pipeline OPS_RENEW_V3
const PIPELINE_ID = '3795270843';

// ─── Date helpers ─────────────────────────────────────────────────
function getLastWeek() {
  const now = new Date();
  const day = now.getDay(); // 0=sun
  const diffToLastSun = day === 0 ? 7 : day;
  const lastSun = new Date(now); lastSun.setDate(now.getDate() - diffToLastSun); lastSun.setHours(23,59,59,999);
  const lastMon = new Date(lastSun); lastMon.setDate(lastSun.getDate() - 6); lastMon.setHours(0,0,0,0);
  return { start: lastMon.getTime(), end: lastSun.getTime(), startISO: lastMon.toISOString().split('T')[0], endISO: lastSun.toISOString().split('T')[0] };
}

function getThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: start.getTime(), end: now.getTime(), startISO: start.toISOString().split('T')[0], endISO: now.toISOString().split('T')[0] };
}

// ─── API helpers ──────────────────────────────────────────────────
async function search(objectType, filters, properties, limit = 200) {
  const res = await fetch(`${BASE}/crm/v3/objects/${objectType}/search`, {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ filterGroups: [{ filters }], properties, limit }),
  });
  if (!res.ok) { console.warn(`⚠ ${objectType} (${res.status})`); return []; }
  return (await res.json()).results || [];
}

// ─── Fetchers ─────────────────────────────────────────────────────

// CALLS — outbound, semaine ou mois
async function fetchCalls(start, end) {
  return search('calls', [
    { propertyName: 'hs_createdate',    operator: 'GTE', value: String(start) },
    { propertyName: 'hs_createdate',    operator: 'LTE', value: String(end) },
    { propertyName: 'hs_call_direction',operator: 'EQ',  value: 'OUTBOUND' },
    { propertyName: 'hubspot_owner_id', operator: 'IN',  values: OWNER_IDS },
  ], ['hubspot_owner_id', 'hs_createdate']);
}

// MEETINGS — posés par l'équipe renew
async function fetchMeetings(startISO, endISO) {
  return search('meetings', [
    { propertyName: 'hs_createdate',    operator: 'GTE', value: startISO },
    { propertyName: 'hs_createdate',    operator: 'LTE', value: endISO },
    { propertyName: 'hubspot_owner_id', operator: 'IN',  values: OWNER_IDS },
  ], ['hubspot_owner_id', 'hs_createdate', 'hs_meeting_title']);
}

// TICKETS — clôturés par l'équipe
async function fetchTickets(startISO, endISO) {
  return search('tickets', [
    { propertyName: 'closed_date',      operator: 'GTE', value: startISO },
    { propertyName: 'closed_date',      operator: 'LTE', value: endISO },
    { propertyName: 'hubspot_owner_id', operator: 'IN',  values: OWNER_IDS },
  ], ['hubspot_owner_id', 'subject', 'closed_date']);
}

// CHURN REASON — contacts avec churn_date dans la période
async function fetchChurnReason(startISO, endISO) {
  return search('contacts', [
    { propertyName: 'churn_date',   operator: 'GTE', value: startISO },
    { propertyName: 'churn_date',   operator: 'LTE', value: endISO },
    { propertyName: 'churn_reason', operator: 'HAS_PROPERTY' },
  ], ['hubspot_owner_id', 'churn_date', 'churn_reason', 'firstname', 'lastname']).catch(() => []);
}

// CHURN NO SHOW
async function fetchChurnNoShow(startISO, endISO) {
  return search('contacts', [
    { propertyName: 'churn_date',   operator: 'GTE', value: startISO },
    { propertyName: 'churn_date',   operator: 'LTE', value: endISO },
    { propertyName: 'churn_reason', operator: 'EQ',  value: 'HP - Injoignable' },
  ], ['hubspot_owner_id', 'churn_reason', 'firstname', 'lastname']).catch(() => []);
}

// PIPELINE DEALS — état actuel
async function fetchDeals() {
  return search('deals', [
    { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
  ], ['dealname', 'dealstage', 'hubspot_owner_id', 'amount', 'closedate']).catch(() => []);
}

// ─── Aggregation helpers ──────────────────────────────────────────
function byMember(items, prop = 'hubspot_owner_id') {
  const r = { lilian: 0, mathieu: 0, clara: 0, total: 0 };
  for (const item of items) {
    const m = OWNERS[item.properties?.[prop]];
    if (m) { r[m]++; r.total++; }
  }
  return r;
}

function churnReasons(items) {
  const counts = {};
  for (const c of items) {
    const reason = c.properties?.churn_reason || 'Inconnu';
    counts[reason] = (counts[reason] || 0) + 1;
  }
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([reason, count]) => ({ reason, count }));
}

function callsByDay(calls, start, end) {
  const days = {};
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    const key = cur.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    days[key] = { total: 0, lilian: 0, mathieu: 0, clara: 0 };
    cur.setDate(cur.getDate() + 1);
  }
  for (const call of calls) {
    const ts = call.properties?.hs_createdate;
    if (!ts) continue;
    const key = new Date(Number(ts)).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    if (days[key]) {
      days[key].total++;
      const m = OWNERS[call.properties?.hubspot_owner_id];
      if (m) days[key][m]++;
    }
  }
  return days;
}

function buildPeriodStats(calls, meetings, tickets, churnReason, churnNoShow, periodStart, periodEnd) {
  return {
    calls:       { ...byMember(calls),       byDay: callsByDay(calls, periodStart, periodEnd) },
    meetings:    byMember(meetings),
    tickets:     byMember(tickets),
    churnReason: { ...byMember(churnReason), reasons: churnReasons(churnReason) },
    churnNoShow: byMember(churnNoShow),
  };
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Sync HubSpot Dashboard Renew...');

  const lw = getLastWeek();
  const tm = getThisMonth();

  console.log(`📅 S-1 : ${lw.startISO} → ${lw.endISO}`);
  console.log(`📅 Mois: ${tm.startISO} → ${tm.endISO}`);

  // Fetch all in parallel
  const [
    callsLW, callsTM,
    meetingsLW, meetingsTM,
    ticketsLW, ticketsTM,
    churnLW, churnTM,
    noShowLW, noShowTM,
    deals,
  ] = await Promise.all([
    fetchCalls(lw.start, lw.end),
    fetchCalls(tm.start, tm.end),
    fetchMeetings(lw.startISO, lw.endISO),
    fetchMeetings(tm.startISO, tm.endISO),
    fetchTickets(lw.startISO, lw.endISO),
    fetchTickets(tm.startISO, tm.endISO),
    fetchChurnReason(lw.startISO, lw.endISO),
    fetchChurnReason(tm.startISO, tm.endISO),
    fetchChurnNoShow(lw.startISO, lw.endISO),
    fetchChurnNoShow(tm.startISO, tm.endISO),
    fetchDeals(),
  ]);

  console.log(`S-1  → calls:${callsLW.length} rdv:${meetingsLW.length} tickets:${ticketsLW.length} churn:${churnLW.length} noshow:${noShowLW.length}`);
  console.log(`Mois → calls:${callsTM.length} rdv:${meetingsTM.length} tickets:${ticketsTM.length} churn:${churnTM.length} noshow:${noShowTM.length}`);
  console.log(`Deals pipeline: ${deals.length}`);

  // Pipeline deals by stage and member
  const STAGES = {
    '397654742': 'A renouveler',
    '397654743': 'Renouvellement en cours',
    '399292111': 'Engagement à payer',
    '399311590': 'Call Teamlead CS',
    '397654744': 'Renouvelé',
    '397777379': 'Churn',
  };

  const pipeline = {
    total: deals.length,
    byMember: { lilian: 0, mathieu: 0, clara: 0 },
    byStage: {},
    deals: deals.map(d => ({
      id: d.id,
      name: d.properties?.dealname || `Deal #${d.id}`,
      stage: d.properties?.dealstage || null,
      stageLabel: STAGES[d.properties?.dealstage] || d.properties?.dealstage || '—',
      amount: d.properties?.amount ? Number(d.properties.amount) : null,
      closedate: d.properties?.closedate || null,
      member: OWNERS[d.properties?.hubspot_owner_id] || null,
    })),
  };

  for (const deal of pipeline.deals) {
    if (deal.member) pipeline.byMember[deal.member]++;
    const s = deal.stageLabel;
    pipeline.byStage[s] = (pipeline.byStage[s] || 0) + 1;
  }

  const output = {
    generatedAt: new Date().toISOString(),
    periods: {
      lastWeek:  { label: 'Semaine dernière', start: lw.startISO, end: lw.endISO },
      thisMonth: { label: 'Ce mois',          start: tm.startISO, end: tm.endISO },
    },
    lastWeek:  buildPeriodStats(callsLW,  meetingsLW,  ticketsLW,  churnLW,  noShowLW,  lw.start, lw.end),
    thisMonth: buildPeriodStats(callsTM,  meetingsTM,  ticketsTM,  churnTM,  noShowTM,  tm.start, tm.end),
    pipeline,
  };

  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync('public/data.json', JSON.stringify(output, null, 2));
  console.log('✅ public/data.json généré !');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
