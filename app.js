// app.js — LeadPredictor calculator
// Calculations and chart rendering will be added in subsequent branches

document.addEventListener('DOMContentLoaded', () => {
  console.log('LeadPredictor initialised');
  updateCampaignMeta();

  document.getElementById('campaignStart').addEventListener('change', updateCampaignMeta);
  document.getElementById('campaignEnd').addEventListener('change', updateCampaignMeta);
});

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
