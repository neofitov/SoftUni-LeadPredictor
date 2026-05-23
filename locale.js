// locale.js — UI language switching for LeadPredictor

const TRANSLATIONS = {
  en: {
    language:       'Language',
    currency:       'Currency',
    campaignStart:  'Campaign Start',
    campaignEnd:    'Campaign End',
    totalRevenue:   'Total Revenue',
    avgOrderValue:  'Avg. Order Value',
    leadRate:       'Lead Response Rate',
    prospectRate:   'Prospect Response Rate',
    prospects:      'Prospects',
    leads:          'Leads',
    customers:      'Customers',
    ofCampaign:     'of campaign total',
    ofProspects:    'of prospects',
  },
  bg: {
    language:       'Език',
    currency:       'Валута',
    campaignStart:  'Начало на кампанията',
    campaignEnd:    'Край на кампанията',
    totalRevenue:   'Общ приход',
    avgOrderValue:  'Средна стойност на поръчка',
    leadRate:       'Процент отговор на лийдове',
    prospectRate:   'Процент отговор на потенциални',
    prospects:      'Потенциални',
    leads:          'Лийдове',
    customers:      'Клиенти',
    ofCampaign:     'от общото на кампанията',
    ofProspects:    'от потенциалните',
  },
};

function applyLocale(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Update sidebar labels
  document.querySelectorAll('.field label').forEach(el => {
    const forId = el.nextElementSibling?.id || el.nextElementSibling?.querySelector('input,select')?.id;
    if (forId && t[forId]) el.textContent = t[forId];
  });

  // Update slider labels
  const sliderLabels = document.querySelectorAll('.slider-field label');
  if (sliderLabels[0]) sliderLabels[0].textContent = t.leadRate;
  if (sliderLabels[1]) sliderLabels[1].textContent = t.prospectRate;

  // Update stat card labels
  document.querySelector('#cardProspects .stat-label').textContent = t.prospects;
  document.querySelector('#cardLeads .stat-label').textContent     = t.leads;
  document.querySelector('#cardCustomers .stat-label').textContent = t.customers;

  document.getElementById('subProspects').textContent  = t.ofCampaign;
  document.getElementById('subLeads').textContent      = t.ofProspects;
  document.getElementById('subCustomers').textContent  = t.ofProspects;

  document.documentElement.lang = lang;
}

document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('language');
  applyLocale(langSelect.value);
  langSelect.addEventListener('change', e => applyLocale(e.target.value));
});
