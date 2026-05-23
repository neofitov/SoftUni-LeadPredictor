// calculations.js — reactive funnel formulas for LeadPredictor

/* ── Currency symbols ───────────────────────────────── */
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', BGN: 'лв' };

/* ── Main calculate function ────────────────────────── */
function calculate() {
  // Read inputs
  const revenue      = Math.max(0, parseFloat(document.getElementById('totalRevenue').value)   || 0);
  const avgOrder     = Math.max(1, parseFloat(document.getElementById('avgOrderValue').value)   || 1);
  const leadRate     = Math.max(1, parseFloat(document.getElementById('leadRate').value)        || 1);
  const prospectRate = Math.max(1, parseFloat(document.getElementById('prospectRate').value)    || 1);
  const startVal     = document.getElementById('campaignStart').value;
  const endVal       = document.getElementById('campaignEnd').value;

  // Core funnel formulas
  const customers  = revenue / avgOrder;
  const leads      = customers * 100 / leadRate;
  const prospects  = leads    * 100 / prospectRate;

  // Campaign months (at least 1)
  const months = calcMonths(startVal, endVal);

  // Update stat cards
  updateStatCards(prospects, leads, customers);

  // Build monthly cumulative data and push to chart
  const data = buildMonthlyData(prospects, leads, customers, months, startVal);
  updateChart(data);

  // Update currency symbols
  updateCurrencySymbols();
}

/* ── Stat cards ─────────────────────────────────────── */
function updateStatCards(prospects, leads, customers) {
  const leadsOfProspects     = prospects > 0 ? leads     / prospects * 100 : 0;
  const customersOfProspects = prospects > 0 ? customers / prospects * 100 : 0;

  document.getElementById('valProspects').textContent  = fmt(prospects);
  document.getElementById('valLeads').textContent      = fmt(leads);
  document.getElementById('valCustomers').textContent  = fmt(customers);

  document.getElementById('pctProspects').textContent  = '100%';
  document.getElementById('pctLeads').textContent      = fmtPct(leadsOfProspects);
  document.getElementById('pctCustomers').textContent  = fmtPct(customersOfProspects);

  document.getElementById('barProspects').style.width  = '100%';
  document.getElementById('barLeads').style.width      = `${Math.min(100, leadsOfProspects).toFixed(1)}%`;
  document.getElementById('barCustomers').style.width  = `${Math.min(100, customersOfProspects).toFixed(1)}%`;
}

/* ── Monthly cumulative data for chart ──────────────── */
function buildMonthlyData(prospects, leads, customers, months, startVal) {
  const data = [];
  for (let i = 1; i <= months; i++) {
    const label = monthLabel(startVal, i);
    data.push({
      label,
      prospects: Math.round(prospects * i / months),
      leads:     Math.round(leads     * i / months),
      customers: Math.round(customers * i / months),
    });
  }
  return data;
}

/* ── Campaign month count ───────────────────────────── */
function calcMonths(startVal, endVal) {
  if (!startVal || !endVal) return 6;
  const start = new Date(startVal);
  const end   = new Date(endVal);
  if (isNaN(start) || isNaN(end) || end <= start) return 1;
  const months = (end.getFullYear() - start.getFullYear()) * 12
               + (end.getMonth()    - start.getMonth());
  return Math.max(1, months);
}

/* ── Month label (e.g. "Jun 2026") ─────────────────── */
function monthLabel(startVal, offset) {
  if (!startVal) return `Month #${offset}`;
  const d = new Date(startVal);
  d.setMonth(d.getMonth() + offset - 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/* ── Currency symbol sync ───────────────────────────── */
function updateCurrencySymbols() {
  const code   = document.getElementById('currency').value;
  const symbol = CURRENCY_SYMBOLS[code] ?? code;
  document.getElementById('currencySymbol').textContent  = symbol;
  document.getElementById('currencySymbol2').textContent = symbol;
}

/* ── Formatters ─────────────────────────────────────── */
function fmt(n)    { return Number.isFinite(n) ? Math.round(n).toLocaleString() : '0'; }
function fmtPct(n) { return Number.isFinite(n) ? `${n.toFixed(1)}%` : '0%'; }

/* ── Wire up all inputs on DOMContentLoaded ─────────── */
document.addEventListener('DOMContentLoaded', () => {
  const ids = [
    'totalRevenue', 'avgOrderValue',
    'leadRate', 'prospectRate',
    'campaignStart', 'campaignEnd',
    'currency',
  ];
  ids.forEach(id => document.getElementById(id).addEventListener('input', calculate));

  // Slider live % labels
  document.getElementById('leadRate').addEventListener('input', e => {
    document.getElementById('leadRateVal').textContent = `${parseFloat(e.target.value).toFixed(2)}%`;
  });
  document.getElementById('prospectRate').addEventListener('input', e => {
    document.getElementById('prospectRateVal').textContent = `${parseFloat(e.target.value).toFixed(2)}%`;
  });

  // Initial calculation
  calculate();
});
