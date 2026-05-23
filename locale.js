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
  const appliedLang = TRANSLATIONS[lang] ? lang : 'en';

  // Update all elements marked with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.documentElement.lang = appliedLang;
}

document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('language');
  applyLocale(langSelect.value);
  langSelect.addEventListener('change', e => applyLocale(e.target.value));
});
