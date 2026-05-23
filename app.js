// app.js — LeadPredictor calculator

/* ── Constants ──────────────────────────────────────── */
const COLORS = {
  prospects: '#4a9eff',
  leads:     '#a78bfa',
  customers: '#34d399',
  grid:      '#2a3a52',
  text:      '#8899aa',
};

/* ── Shared layout constants (used by _draw and hit-testing) */
const PAD_LEFT   = 80;
const PAD_RIGHT  = 44;
const PAD_TOP    = 16;
const PAD_BOTTOM = 32;

/* ── State ──────────────────────────────────────────── */
let chartData     = [];   // filled by calculations module
let _canvas, _tooltip, _ctx;
let _hoveredMonth = -1;
let _chartReady   = false; // true after initChart() runs
let _rafPending   = false; // requestAnimationFrame throttle

/* ── DOM ready ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateCampaignMeta();
  document.getElementById('campaignStart').addEventListener('change', updateCampaignMeta);
  document.getElementById('campaignEnd').addEventListener('change', updateCampaignMeta);

  // Placeholder data so the chart is visible on load
  chartData = buildPlaceholderData();
  initChart();
});

/* ── Campaign meta header ───────────────────────────── */
function updateCampaignMeta() {
  const start = document.getElementById('campaignStart').value;
  const end   = document.getElementById('campaignEnd').value;
  const el    = document.getElementById('campaignMeta');
  if (start && end) {
    const dateLocale = document.documentElement.lang === 'bg' ? 'bg-BG' : 'en-GB';
    const fmt = d => new Date(d).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' });
    const label = el.dataset.i18nCampaign || 'Campaign';
    el.textContent = `${label}: ${fmt(start)} – ${fmt(end)}`;
  } else {
    el.textContent = '';
  }
}

/* ── Placeholder data (6 months, cumulative) ────────── */
function buildPlaceholderData() {
  const totalProspects = 125;
  const totalLeads     = 25;
  const totalCustomers = 10;
  const months         = 6;
  const data = [];
  for (let i = 1; i <= months; i++) {
    data.push({
      label:     `Month #${i}`,
      prospects: Math.round(totalProspects * i / months),
      leads:     Math.round(totalLeads     * i / months),
      customers: Math.round(totalCustomers * i / months),
    });
  }
  return data;
}

/* ── Chart helpers ───────────────────────────────────── */
function _roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
  }
}

function _draw() {
  const dpr = window.devicePixelRatio || 1;
  const W   = _canvas.width  / dpr;
  const H   = _canvas.height / dpr;
  _ctx.clearRect(0, 0, W, H);

  const rows = chartData.length;
  if (rows === 0) return;

  const chartW    = W - PAD_LEFT - PAD_RIGHT;
  const chartH    = H - PAD_TOP  - PAD_BOTTOM;
  const rowH      = chartH / rows;
  // Derive barH so all 3 bars + 2 gaps always fit within rowH (with 20% padding)
  const gap       = rowH * 0.04;
  const barH      = Math.max(2, (rowH * 0.8 - gap * 2) / 3);

  // Max value across all series for x-axis scale
  const maxVal = Math.max(...chartData.map(d => Math.max(d.prospects, d.leads, d.customers)), 1);
  const scale  = chartW / (maxVal * 1.1);

  // Grid lines — limit steps so labels don't overlap (min 70px per label)
  const gridSteps = Math.min(6, Math.max(1, Math.floor(chartW / 70)));
  _ctx.strokeStyle = COLORS.grid;
  _ctx.lineWidth   = 1;
  _ctx.fillStyle   = COLORS.text;
  _ctx.font        = '11px Segoe UI, system-ui, sans-serif';
  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round(maxVal * 1.1 * i / gridSteps);
    const x   = PAD_LEFT + val * scale;
    _ctx.beginPath();
    _ctx.moveTo(x, PAD_TOP);
    _ctx.lineTo(x, PAD_TOP + chartH);
    _ctx.stroke();
    // Align first label left, last label right, rest centered — keeps text in-bounds
    _ctx.textAlign = i === 0 ? 'left' : i === gridSteps ? 'right' : 'center';
    const peopleLabel = _canvas.dataset.i18nPeople || 'people';
    _ctx.fillText(`${val} ${peopleLabel}`, x, PAD_TOP + chartH + 18);
  }

  // Rows
  chartData.forEach((d, idx) => {
    const cy       = PAD_TOP + idx * rowH + rowH / 2;
    const isHover  = idx === _hoveredMonth;
    const barAlpha = isHover ? 1 : 0.75;

    // Row highlight on hover
    if (isHover) {
      _ctx.fillStyle = 'rgba(74,158,255,0.06)';
      _ctx.fillRect(0, PAD_TOP + idx * rowH, W, rowH);
    }

    // Month label
    _ctx.fillStyle = isHover ? '#e0e8f0' : COLORS.text;
    _ctx.font      = isHover ? 'bold 12px Segoe UI, system-ui, sans-serif'
                             : '11px Segoe UI, system-ui, sans-serif';
    _ctx.textAlign = 'right';
    _ctx.fillText(d.label, PAD_LEFT - 8, cy + 4);

    // Bars (prospects, leads, customers) — skip bars with zero value
    const bars = [
      { val: d.prospects, color: COLORS.prospects },
      { val: d.leads,     color: COLORS.leads     },
      { val: d.customers, color: COLORS.customers  },
    ];
    bars.forEach((b, bi) => {
      if (b.val === 0) return;
      const barW = b.val * scale;
      const by   = cy - (barH + gap) + bi * (barH + gap);
      _ctx.globalAlpha = barAlpha;
      _ctx.fillStyle   = b.color;
      _ctx.beginPath();
      _roundRect(_ctx, PAD_LEFT, by, barW, barH, 3);
      _ctx.fill();
    });
    _ctx.globalAlpha = 1;
  });
}

function _resize() {
  const dpr = window.devicePixelRatio || 1;
  _canvas.width  = _canvas.offsetWidth  * dpr;
  _canvas.height = _canvas.offsetHeight * dpr;
  _ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  _draw();
}

/* ── Chart (initialized once on DOMContentLoaded) ───── */
function initChart() {
  _canvas  = document.getElementById('chart');
  _tooltip = document.getElementById('tooltip');
  _ctx     = _canvas.getContext('2d');

  _canvas.addEventListener('mousemove', (e) => {
    const dpr    = window.devicePixelRatio || 1;
    const rect   = _canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const rows   = chartData.length;
    if (rows === 0) return;
    // Use shared constants so hit-testing always matches _draw() layout
    const rowH = (_canvas.height / dpr - PAD_TOP - PAD_BOTTOM) / rows;
    const idx  = Math.floor((mouseY - PAD_TOP) / rowH);
    const newHover = (idx >= 0 && idx < rows) ? idx : -1;

    // Always update tooltip position (cheap)
    if (newHover >= 0) {
      _tooltip.style.left = `${e.clientX - rect.left + 14}px`;
      _tooltip.style.top  = `${e.clientY - rect.top  - 10}px`;
    }

    // Only rebuild tooltip content and schedule redraw when hovered row changes
    if (newHover !== _hoveredMonth) {
      _hoveredMonth = newHover;
      if (newHover >= 0) {
        const d = chartData[newHover];
        // Build tooltip via DOM nodes — safe against XSS
        _tooltip.replaceChildren();
        const header = document.createElement('strong');
        header.textContent = d.label;
        _tooltip.appendChild(header);
        [['Prospects', d.prospects], ['Leads', d.leads], ['Customers', d.customers]]
          .forEach(([key, val]) => {
            _tooltip.appendChild(document.createElement('br'));
            _tooltip.appendChild(document.createTextNode(`${key}: ${val}`));
          });
        _tooltip.classList.remove('hidden');
      } else {
        _tooltip.classList.add('hidden');
      }
      // Throttle canvas redraws with requestAnimationFrame
      if (!_rafPending) {
        _rafPending = true;
        requestAnimationFrame(() => { _rafPending = false; _draw(); });
      }
    }
  });

  _canvas.addEventListener('mouseleave', () => {
    _hoveredMonth = -1;
    _tooltip.classList.add('hidden');
    _draw();
  });

  const ro = new ResizeObserver(_resize);
  ro.observe(_canvas.parentElement);
  _chartReady = true;
  _resize();
}

/* ── Public: called by calculations module ──────────── */
function updateChart(data) {
  if (!_chartReady) return;          // no-op until initChart() has run
  if (!Array.isArray(data)) return;  // defensive: reject non-array input
  // Sanitize entries: coerce prospects/leads/customers to non-negative numbers
  chartData = data.map(d => ({
    label:     String(d.label ?? ''),
    prospects: Math.max(0, Number(d.prospects) || 0),
    leads:     Math.max(0, Number(d.leads)     || 0),
    customers: Math.max(0, Number(d.customers) || 0),
  }));
  _hoveredMonth = -1;
  _tooltip.classList.add('hidden');
  _draw();
}
