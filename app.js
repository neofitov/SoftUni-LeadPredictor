// app.js — LeadPredictor calculator

/* ── Constants ──────────────────────────────────────── */
const COLORS = {
  prospects: '#4a9eff',
  leads:     '#a78bfa',
  customers: '#34d399',
  grid:      '#2a3a52',
  text:      '#8899aa',
  tooltip_bg:'#1a2235',
  tooltip_bd:'#2a3a52',
};

/* ── State ──────────────────────────────────────────── */
let chartData = [];  // filled by calculations module

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

/* ── Chart ──────────────────────────────────────────── */
function initChart() {
  const canvas  = document.getElementById('chart');
  const tooltip = document.getElementById('tooltip');
  const ctx     = canvas.getContext('2d');
  let hoveredMonth = -1;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }

  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const rows      = chartData.length;
    const padLeft   = 80;
    const padRight  = 24;
    const padTop    = 16;
    const padBottom = 32;
    const chartW    = W - padLeft - padRight;
    const chartH    = H - padTop - padBottom;
    const rowH      = chartH / rows;
    const barH      = Math.max(6, rowH * 0.22);
    const gap       = barH * 0.5;

    // Max value for x-axis scale
    const maxVal = Math.max(...chartData.map(d => d.prospects), 1);
    const scale  = chartW / (maxVal * 1.1);

    // Grid lines
    const gridSteps = 5;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth   = 1;
    ctx.fillStyle   = COLORS.text;
    ctx.font        = '11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign   = 'center';
    for (let i = 0; i <= gridSteps; i++) {
      const val = Math.round(maxVal * 1.1 * i / gridSteps);
      const x   = padLeft + val * scale;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + chartH);
      ctx.stroke();
      ctx.fillText(`${val} people`, x, padTop + chartH + 18);
    }

    // Rows
    chartData.forEach((d, idx) => {
      const cy       = padTop + idx * rowH + rowH / 2;
      const isHover  = idx === hoveredMonth;
      const barAlpha = isHover ? 1 : 0.75;

      // Row highlight on hover
      if (isHover) {
        ctx.fillStyle = 'rgba(74,158,255,0.06)';
        ctx.fillRect(0, padTop + idx * rowH, W, rowH);
      }

      // Month label
      ctx.fillStyle = isHover ? '#e0e8f0' : COLORS.text;
      ctx.font      = isHover ? 'bold 12px Segoe UI, system-ui, sans-serif'
                               : '11px Segoe UI, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(d.label, padLeft - 8, cy + 4);

      // Bars (prospects, leads, customers)
      const bars = [
        { val: d.prospects, color: COLORS.prospects },
        { val: d.leads,     color: COLORS.leads     },
        { val: d.customers, color: COLORS.customers  },
      ];
      bars.forEach((b, bi) => {
        const barW = Math.max(2, b.val * scale);
        const by   = cy - (barH + gap) + bi * (barH + gap);
        ctx.globalAlpha = barAlpha;
        ctx.fillStyle   = b.color;
        ctx.beginPath();
        ctx.roundRect(padLeft, by, barW, barH, 3);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    });
  }

  // Tooltip on mouse move
  canvas.addEventListener('mousemove', (e) => {
    const rect   = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const padTop = 16;
    const rows   = chartData.length;
    const rowH   = (canvas.height - padTop - 32) / rows;
    const idx    = Math.floor((mouseY - padTop) / rowH);

    if (idx >= 0 && idx < rows) {
      hoveredMonth = idx;
      const d = chartData[idx];
      tooltip.innerHTML =
        `<strong>${d.label}</strong><br>
         Prospects: ${d.prospects}<br>
         Leads: ${d.leads}<br>
         Customers: ${d.customers}`;
      tooltip.classList.remove('hidden');
      tooltip.style.left = `${e.clientX - rect.left + 14}px`;
      tooltip.style.top  = `${e.clientY - rect.top  - 10}px`;
    } else {
      hoveredMonth = -1;
      tooltip.classList.add('hidden');
    }
    draw();
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredMonth = -1;
    tooltip.classList.add('hidden');
    draw();
  });

  // Redraw on resize
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();
}

/* ── Public: called by calculations module ──────────── */
function updateChart(data) {
  chartData = data;
  initChart();
}
