// app.js — LeadPredictor calculator

/* ── Constants ──────────────────────────────────────── */
const COLORS = {
  prospects: '#4a9eff',
  leads:     '#a78bfa',
  customers: '#34d399',
  grid:      '#2a3a52',
  text:      '#8899aa',
};

/* ── State ──────────────────────────────────────────── */
let chartData    = [];  // filled by calculations module
let _canvas, _tooltip, _ctx;
let _hoveredMonth = -1;

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
    const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    el.textContent = `Campaign: ${fmt(start)} – ${fmt(end)}`;
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

  const padLeft   = 80;
  const padRight  = 24;
  const padTop    = 16;
  const padBottom = 32;
  const chartW    = W - padLeft - padRight;
  const chartH    = H - padTop - padBottom;
  const rowH      = chartH / rows;
  const barH      = Math.max(6, rowH * 0.22);
  const gap       = barH * 0.5;

  // Max value across all series for x-axis scale
  const maxVal = Math.max(...chartData.map(d => Math.max(d.prospects, d.leads, d.customers)), 1);
  const scale  = chartW / (maxVal * 1.1);

  // Grid lines
  const gridSteps = 5;
  _ctx.strokeStyle = COLORS.grid;
  _ctx.lineWidth   = 1;
  _ctx.fillStyle   = COLORS.text;
  _ctx.font        = '11px Segoe UI, system-ui, sans-serif';
  _ctx.textAlign   = 'center';
  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round(maxVal * 1.1 * i / gridSteps);
    const x   = padLeft + val * scale;
    _ctx.beginPath();
    _ctx.moveTo(x, padTop);
    _ctx.lineTo(x, padTop + chartH);
    _ctx.stroke();
    _ctx.fillText(`${val} people`, x, padTop + chartH + 18);
  }

  // Rows
  chartData.forEach((d, idx) => {
    const cy       = padTop + idx * rowH + rowH / 2;
    const isHover  = idx === _hoveredMonth;
    const barAlpha = isHover ? 1 : 0.75;

    // Row highlight on hover
    if (isHover) {
      _ctx.fillStyle = 'rgba(74,158,255,0.06)';
      _ctx.fillRect(0, padTop + idx * rowH, W, rowH);
    }

    // Month label
    _ctx.fillStyle = isHover ? '#e0e8f0' : COLORS.text;
    _ctx.font      = isHover ? 'bold 12px Segoe UI, system-ui, sans-serif'
                             : '11px Segoe UI, system-ui, sans-serif';
    _ctx.textAlign = 'right';
    _ctx.fillText(d.label, padLeft - 8, cy + 4);

    // Bars (prospects, leads, customers)
    const bars = [
      { val: d.prospects, color: COLORS.prospects },
      { val: d.leads,     color: COLORS.leads     },
      { val: d.customers, color: COLORS.customers  },
    ];
    bars.forEach((b, bi) => {
      const barW = Math.max(2, b.val * scale);
      const by   = cy - (barH + gap) + bi * (barH + gap);
      _ctx.globalAlpha = barAlpha;
      _ctx.fillStyle   = b.color;
      _ctx.beginPath();
      _roundRect(_ctx, padLeft, by, barW, barH, 3);
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
    const padTop = 16;
    const rows   = chartData.length;
    if (rows === 0) return;
    const rowH = (_canvas.height / dpr - padTop - 32) / rows;
    const idx  = Math.floor((mouseY - padTop) / rowH);

    if (idx >= 0 && idx < rows) {
      _hoveredMonth = idx;
      const d = chartData[idx];
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
      _tooltip.style.left = `${e.clientX - rect.left + 14}px`;
      _tooltip.style.top  = `${e.clientY - rect.top  - 10}px`;
    } else {
      _hoveredMonth = -1;
      _tooltip.classList.add('hidden');
    }
    _draw();
  });

  _canvas.addEventListener('mouseleave', () => {
    _hoveredMonth = -1;
    _tooltip.classList.add('hidden');
    _draw();
  });

  const ro = new ResizeObserver(_resize);
  ro.observe(_canvas.parentElement);
  _resize();
}

/* ── Public: called by calculations module ──────────── */
function updateChart(data) {
  chartData = data;
  _draw();
}
