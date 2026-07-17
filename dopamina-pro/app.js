const STORAGE_KEY = 'dopamina-pro-app-state-v1';
const DEFAULT_SETTINGS = {
  companyName: 'DOPAMINA PRO',
  dailyTarget: 1000,
  monthlyTarget: 30000,
  logoUrl: '',
  primaryColor: '#8b5cf6',
  secondaryColor: '#22c55e',
};

const state = { records: [], settings: { ...DEFAULT_SETTINGS }, darkMode: true };
const els = {};

function init() {
  cacheElements();
  bindEvents();
  loadState();
  populateDateControls();
  applyTheme();
  render();
}

function cacheElements() {
  els.dashboardDate = document.getElementById('dashboardDate');
  els.dashboardDay = document.getElementById('dashboardDay');
  els.dashboardNight = document.getElementById('dashboardNight');
  els.dashboardObservations = document.getElementById('dashboardObservations');
  els.dashboardTotal = document.getElementById('dashboardTotal');
  els.dashboardMonthTotal = document.getElementById('dashboardMonthTotal');
  els.saveRecordBtn = document.getElementById('saveRecordBtn');
  els.cancelEditBtn = document.getElementById('cancelEditBtn');
  els.editingRecordId = document.getElementById('editingRecordId');
  els.summaryCards = document.getElementById('summaryCards');
  els.historySearch = document.getElementById('historySearch');
  els.historyMonth = document.getElementById('historyMonth');
  els.historyYear = document.getElementById('historyYear');
  els.historySort = document.getElementById('historySort');
  els.historyTableBody = document.getElementById('historyTableBody');
  els.statsGrid = document.getElementById('statsGrid');
  els.chartsGrid = document.getElementById('chartsGrid');
  els.statusText = document.getElementById('statusText');
  els.pageTitle = document.getElementById('pageTitle');
  els.currentDateLabel = document.getElementById('currentDateLabel');
  els.themeToggle = document.getElementById('themeToggle');
  els.companyName = document.getElementById('companyName');
  els.dailyTarget = document.getElementById('dailyTarget');
  els.monthlyTarget = document.getElementById('monthlyTarget');
  els.primaryColor = document.getElementById('primaryColor');
  els.secondaryColor = document.getElementById('secondaryColor');
  els.saveSettingsBtn = document.getElementById('saveSettingsBtn');
  els.logoUpload = document.getElementById('logoUpload');
  els.logoPreview = document.getElementById('logoPreview');
  els.backupBtn = document.getElementById('backupBtn');
  els.restoreInput = document.getElementById('restoreInput');
  els.restoreBtn = document.getElementById('restoreBtn');
  els.exportDayDate = document.getElementById('exportDayDate');
  els.exportMonth = document.getElementById('exportMonth');
  els.exportYear = document.getElementById('exportYear');
  els.exportYearOnly = document.getElementById('exportYearOnly');
  els.exportStartDate = document.getElementById('exportStartDate');
  els.exportEndDate = document.getElementById('exportEndDate');
  els.exportDayBtn = document.getElementById('exportDayBtn');
  els.exportDayCsvBtn = document.getElementById('exportDayCsvBtn');
  els.exportMonthBtn = document.getElementById('exportMonthBtn');
  els.exportMonthCsvBtn = document.getElementById('exportMonthCsvBtn');
  els.exportYearBtn = document.getElementById('exportYearBtn');
  els.exportYearCsvBtn = document.getElementById('exportYearCsvBtn');
  els.exportRangeBtn = document.getElementById('exportRangeBtn');
  els.exportRangeCsvBtn = document.getElementById('exportRangeCsvBtn');
  els.exportPdfBtn = document.getElementById('exportPdfBtn');
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => activateSection(btn.dataset.section)));
  els.saveRecordBtn.addEventListener('click', saveRecord);
  els.cancelEditBtn.addEventListener('click', resetForm);
  [els.dashboardDate, els.dashboardDay, els.dashboardNight, els.dashboardObservations].forEach((input) => input.addEventListener('input', updateDashboardTotals));
  els.historySearch.addEventListener('input', renderHistory);
  els.historyMonth.addEventListener('change', renderHistory);
  els.historyYear.addEventListener('change', renderHistory);
  els.historySort.addEventListener('change', renderHistory);
  els.saveSettingsBtn.addEventListener('click', saveSettings);
  els.logoUpload.addEventListener('change', handleLogoUpload);
  els.backupBtn.addEventListener('click', backupDatabase);
  els.restoreBtn.addEventListener('click', () => els.restoreInput.click());
  els.restoreInput.addEventListener('change', restoreDatabase);
  els.themeToggle.addEventListener('change', () => { state.darkMode = els.themeToggle.checked; applyTheme(); saveState(); });
  els.exportDayBtn.addEventListener('click', () => exportData('day', 'excel'));
  els.exportDayCsvBtn.addEventListener('click', () => exportData('day', 'csv'));
  els.exportMonthBtn.addEventListener('click', () => exportData('month', 'excel'));
  els.exportMonthCsvBtn.addEventListener('click', () => exportData('month', 'csv'));
  els.exportYearBtn.addEventListener('click', () => exportData('year', 'excel'));
  els.exportYearCsvBtn.addEventListener('click', () => exportData('year', 'csv'));
  els.exportRangeBtn.addEventListener('click', () => exportData('range', 'excel'));
  els.exportRangeCsvBtn.addEventListener('click', () => exportData('range', 'csv'));
  els.exportPdfBtn.addEventListener('click', () => exportData('range', 'pdf'));
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    state.records = parsed.records || [];
    state.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
    state.darkMode = parsed.darkMode ?? true;
  }
  state.records.sort((a, b) => a.date.localeCompare(b.date));
  els.themeToggle.checked = state.darkMode;
  populateSettings();
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function render() { renderDashboard(); renderHistory(); renderStats(); renderCharts(); renderSettings(); populateDateControls(); applyTheme(); }
function renderDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  els.currentDateLabel.textContent = formatLongDate(today);
  if (!els.dashboardDate.value) els.dashboardDate.value = today;
  updateDashboardTotals();
  const cards = [
    { title: 'Producción del día', value: formatNumber(getTodayTotal()) },
    { title: 'Producción del mes', value: formatNumber(getMonthTotal(today.slice(0, 7))) },
    { title: 'Promedio diario', value: formatNumber(getAverageDaily()) },
    { title: 'Mejor día', value: formatNumber(getBestDay().totalDaily || 0) },
    { title: 'Peor día', value: formatNumber(getWorstDay().totalDaily || 0) },
    { title: 'Días registrados', value: state.records.length },
  ];
  els.summaryCards.innerHTML = cards.map((card) => `<div class="stat-card"><span class="muted">${card.title}</span><strong>${card.value}</strong></div>`).join('');
}

function renderHistory() {
  const filters = { search: els.historySearch.value.trim().toLowerCase(), month: els.historyMonth.value, year: els.historyYear.value, sort: els.historySort.value };
  let list = state.records.filter((record) => {
    const matchSearch = !filters.search || record.date.includes(filters.search) || (record.observations || '').toLowerCase().includes(filters.search);
    const matchMonth = !filters.month || record.date.slice(0, 7) === filters.month;
    const matchYear = !filters.year || record.date.slice(0, 4) === filters.year;
    return matchSearch && matchMonth && matchYear;
  });
  list = list.sort((a, b) => {
    if (filters.sort === 'date-desc') return b.date.localeCompare(a.date);
    if (filters.sort === 'date-asc') return a.date.localeCompare(b.date);
    if (filters.sort === 'total-desc') return b.totalDaily - a.totalDaily;
    return a.totalDaily - b.totalDaily;
  });
  if (!list.length) { els.historyTableBody.innerHTML = '<tr><td colspan="6">No hay registros para mostrar.</td></tr>'; return; }
  els.historyTableBody.innerHTML = list.map((record) => `
    <tr>
      <td>${formatLongDate(record.date)}</td>
      <td>${formatNumber(record.dayProduction)}</td>
      <td>${formatNumber(record.nightProduction)}</td>
      <td>${formatNumber(record.totalDaily)}</td>
      <td>${escapeHtml(record.observations || 'Sin observaciones')}</td>
      <td><button class="action-btn edit-btn" data-edit="${record.id}">Editar</button><button class="action-btn delete-btn" data-delete="${record.id}">Eliminar</button></td>
    </tr>`).join('');
  document.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editRecord(btn.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteRecord(btn.dataset.delete)));
}

function renderStats() {
  const total = state.records.reduce((sum, record) => sum + record.totalDaily, 0);
  const dayTotal = state.records.reduce((sum, record) => sum + record.dayProduction, 0);
  const nightTotal = state.records.reduce((sum, record) => sum + record.nightProduction, 0);
  const avgDaily = state.records.length ? total / state.records.length : 0;
  const avgDay = state.records.length ? dayTotal / state.records.length : 0;
  const avgNight = state.records.length ? nightTotal / state.records.length : 0;
  const best = getBestDay();
  const worst = getWorstDay();
  const monthStats = getMonthSummary();
  const items = [
    { title: 'Producción total del mes', value: formatNumber(monthStats.currentMonthTotal) },
    { title: 'Producción promedio diaria', value: formatNumber(avgDaily) },
    { title: 'Promedio turno Día', value: formatNumber(avgDay) },
    { title: 'Promedio turno Noche', value: formatNumber(avgNight) },
    { title: 'Mejor día registrado', value: `${best.date ? formatLongDate(best.date) : 'N/D'} • ${formatNumber(best.totalDaily || 0)}` },
    { title: 'Peor día registrado', value: `${worst.date ? formatLongDate(worst.date) : 'N/D'} • ${formatNumber(worst.totalDaily || 0)}` },
    { title: 'Mes con mayor producción', value: monthStats.bestMonth.label ? `${monthStats.bestMonth.label} • ${formatNumber(monthStats.bestMonth.value)}` : 'N/D' },
    { title: 'Mes con menor producción', value: monthStats.worstMonth.label ? `${monthStats.worstMonth.label} • ${formatNumber(monthStats.worstMonth.value)}` : 'N/D' },
    { title: 'Total histórico', value: formatNumber(total) },
  ];
  els.statsGrid.innerHTML = items.map((item) => `<div class="stat-card"><span class="muted">${item.title}</span><strong>${item.value}</strong></div>`).join('');
}

function renderCharts() {
  const dailyData = buildDailySeries();
  const weeklyData = buildWeeklySeries();
  const monthlyData = buildMonthlySeries();
  const yearlyData = buildYearlySeries();
  const shiftComparison = [
    { label: 'Día', value: state.records.reduce((sum, record) => sum + record.dayProduction, 0) },
    { label: 'Noche', value: state.records.reduce((sum, record) => sum + record.nightProduction, 0) },
  ];
  const monthComparison = buildMonthlySeries().slice(-6);
  els.chartsGrid.innerHTML = [renderBarChart('Producción por día', dailyData, 'date', 'value'), renderBarChart('Producción por semana', weeklyData, 'label', 'value'), renderBarChart('Producción por mes', monthlyData, 'label', 'value'), renderBarChart('Producción por año', yearlyData, 'label', 'value'), renderBarChart('Comparación entre turnos', shiftComparison, 'label', 'value'), renderBarChart('Comparación entre meses', monthComparison, 'label', 'value')].join('');
}

function renderBarChart(title, data, labelKey, valueKey) {
  if (!data.length) return `<div class="chart-card"><h4>${title}</h4><p class="muted">Sin datos aún.</p></div>`;
  const maxValue = Math.max(...data.map((item) => item[valueKey]), 1);
  const bars = data.map((item) => { const height = Math.max((item[valueKey] / maxValue) * 100, 6); return `<div class="chart-bar-wrap"><div class="chart-bar" style="height:${height}%"></div><small>${item[labelKey]}</small><strong>${formatNumber(item[valueKey])}</strong></div>`; }).join('');
  return `<div class="chart-card"><h4>${title}</h4><div class="chart-bars">${bars}</div></div>`;
}

function renderSettings() {
  els.companyName.value = state.settings.companyName;
  els.dailyTarget.value = state.settings.dailyTarget;
  els.monthlyTarget.value = state.settings.monthlyTarget;
  els.primaryColor.value = state.settings.primaryColor;
  els.secondaryColor.value = state.settings.secondaryColor;
  if (state.settings.logoUrl) els.logoPreview.innerHTML = `<img src="${state.settings.logoUrl}" alt="Logo" />`; else els.logoPreview.innerHTML = '<span class="muted">Sube un logo para la empresa.</span>';
}

function populateDateControls() {
  const months = Array.from(new Set(state.records.map((record) => record.date.slice(0, 7)))).sort();
  const years = Array.from(new Set(state.records.map((record) => record.date.slice(0, 4)))).sort();
  const fillSelect = (select, values, selectedValue = '') => {
    const currentValue = select.value || selectedValue;
    select.innerHTML = '<option value="">Todos</option>' + values.map((value) => `<option value="${value}" ${value === currentValue ? 'selected' : ''}>${value}</option>`).join('');
  };
  fillSelect(els.historyMonth, months); fillSelect(els.historyYear, years); fillSelect(els.exportMonth, months); fillSelect(els.exportYear, years); fillSelect(els.exportYearOnly, years);
  const today = new Date().toISOString().slice(0, 10);
  els.exportDayDate.value = today; els.exportStartDate.value = today; els.exportEndDate.value = today;
}

function saveRecord() {
  const date = els.dashboardDate.value; const dayProduction = parseFloat(els.dashboardDay.value) || 0; const nightProduction = parseFloat(els.dashboardNight.value) || 0; const totalDaily = dayProduction + nightProduction; const observations = els.dashboardObservations.value.trim(); const now = new Date().toISOString();
  if (!date) { setStatus('Selecciona una fecha válida.'); return; }
  const existingIndex = state.records.findIndex((record) => record.id === els.editingRecordId.value);
  const duplicateIndex = state.records.findIndex((record) => record.date === date && record.id !== els.editingRecordId.value);
  const record = { id: els.editingRecordId.value || createId(), date, dayProduction, nightProduction, totalDaily, month: date.slice(0, 7), observations, createdAt: existingIndex >= 0 ? state.records[existingIndex].createdAt : now, updatedAt: now };
  if (existingIndex >= 0) state.records[existingIndex] = record; else if (duplicateIndex >= 0) state.records[duplicateIndex] = record; else state.records.push(record);
  state.records.sort((a, b) => a.date.localeCompare(b.date)); saveState(); resetForm(); render(); setStatus('Registro guardado correctamente.');
}

function editRecord(id) { const record = state.records.find((entry) => entry.id === id); if (!record) return; els.editingRecordId.value = record.id; els.dashboardDate.value = record.date; els.dashboardDay.value = record.dayProduction; els.dashboardNight.value = record.nightProduction; els.dashboardObservations.value = record.observations || ''; updateDashboardTotals(); els.saveRecordBtn.textContent = 'Actualizar registro'; activateSection('dashboard'); }
function deleteRecord(id) { state.records = state.records.filter((record) => record.id !== id); saveState(); render(); setStatus('Registro eliminado.'); }
function resetForm() { els.editingRecordId.value = ''; els.dashboardDate.value = new Date().toISOString().slice(0, 10); els.dashboardDay.value = ''; els.dashboardNight.value = ''; els.dashboardObservations.value = ''; els.saveRecordBtn.textContent = 'Guardar registro'; updateDashboardTotals(); }
function updateDashboardTotals() { const day = parseFloat(els.dashboardDay.value) || 0; const night = parseFloat(els.dashboardNight.value) || 0; const total = day + night; els.dashboardTotal.textContent = formatNumber(total); const monthKey = els.dashboardDate.value.slice(0, 7); els.dashboardMonthTotal.textContent = formatNumber(getMonthTotal(monthKey)); }
function saveSettings() { state.settings.companyName = els.companyName.value.trim() || DEFAULT_SETTINGS.companyName; state.settings.dailyTarget = parseFloat(els.dailyTarget.value) || 0; state.settings.monthlyTarget = parseFloat(els.monthlyTarget.value) || 0; state.settings.primaryColor = els.primaryColor.value; state.settings.secondaryColor = els.secondaryColor.value; saveState(); applyTheme(); setStatus('Configuración guardada.'); }
function handleLogoUpload(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { state.settings.logoUrl = reader.result; saveState(); renderSettings(); setStatus('Logo actualizado.'); }; reader.readAsDataURL(file); }
function backupDatabase() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'dopamina-pro-backup.json'; link.click(); URL.revokeObjectURL(url); setStatus('Respaldo descargado.'); }
function restoreDatabase(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(reader.result); state.records = parsed.records || []; state.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }; state.darkMode = parsed.darkMode ?? true; saveState(); render(); setStatus('Respaldo restaurado.'); } catch (error) { setStatus('No se pudo restaurar el respaldo.'); } }; reader.readAsText(file); }
function exportData(type, format) { let records = []; if (type === 'day') { const date = els.exportDayDate.value; records = state.records.filter((record) => record.date === date); } else if (type === 'month') { const month = els.exportMonth.value; records = state.records.filter((record) => record.date.slice(0, 7) === month); } else if (type === 'year') { const year = els.exportYearOnly.value; records = state.records.filter((record) => record.date.slice(0, 4) === year); } else if (type === 'range') { const start = els.exportStartDate.value; const end = els.exportEndDate.value; records = state.records.filter((record) => record.date >= start && record.date <= end); }
  if (!records.length) { setStatus('No hay datos para exportar en este periodo.'); return; }
  if (format === 'csv') downloadCsv(records); else if (format === 'pdf') printPdf(records); else downloadExcel(records);
}
function downloadCsv(records) { const rows = records.map((record) => [record.date, record.dayProduction, record.nightProduction, record.totalDaily, (record.observations || '').replace(/\n/g, ' ')]); const csv = [['Fecha','Día','Noche','Total','Observaciones'], ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n'); downloadText(csv, 'dopamina-pro.csv'); }
function downloadExcel(records) { const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="DOPAMINA PRO"><Table><Row><Cell><Data ss:Type="String">Fecha</Data></Cell><Cell><Data ss:Type="String">Día</Data></Cell><Cell><Data ss:Type="String">Noche</Data></Cell><Cell><Data ss:Type="String">Total</Data></Cell><Cell><Data ss:Type="String">Observaciones</Data></Cell></Row>${records.map((record) => `<Row><Cell><Data ss:Type="String">${record.date}</Data></Cell><Cell><Data ss:Type="Number">${record.dayProduction}</Data></Cell><Cell><Data ss:Type="Number">${record.nightProduction}</Data></Cell><Cell><Data ss:Type="Number">${record.totalDaily}</Data></Cell><Cell><Data ss:Type="String">${escapeHtml(record.observations || '')}</Data></Cell></Row>`).join('')}</Table></Worksheet></Workbook>`; downloadText(xml, 'dopamina-pro.xls'); }
function printPdf(records) { const content = `<html><body style="font-family: Arial; padding: 24px;"><h1>DOPAMINA PRO</h1><p>Reporte exportado</p><table style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:left; border-bottom:1px solid #ccc;">Fecha</th><th style="text-align:left; border-bottom:1px solid #ccc;">Día</th><th style="text-align:left; border-bottom:1px solid #ccc;">Noche</th><th style="text-align:left; border-bottom:1px solid #ccc;">Total</th></tr></thead><tbody>${records.map((record) => `<tr><td>${record.date}</td><td>${record.dayProduction}</td><td>${record.nightProduction}</td><td>${record.totalDaily}</td></tr>`).join('')}</tbody></table></body></html>`; const win = window.open('', '', 'width=900,height=700'); win.document.write(content); win.document.close(); win.print(); }
function downloadText(content, filename) { const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
function activateSection(section) { document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.section === section)); document.querySelectorAll('.section').forEach((panel) => panel.classList.toggle('active-section', panel.id === `${section}Section`)); els.pageTitle.textContent = section === 'dashboard' ? 'Dashboard' : section === 'history' ? 'Historial' : section === 'stats' ? 'Estadísticas' : section === 'charts' ? 'Gráficos' : section === 'exports' ? 'Exportaciones' : 'Configuración'; }
function applyTheme() { const root = document.documentElement; root.style.setProperty('--accent', state.settings.primaryColor); root.style.setProperty('--accent-2', state.settings.secondaryColor); document.body.style.background = state.darkMode ? `linear-gradient(135deg, ${state.settings.primaryColor}11, ${state.settings.secondaryColor}11)` : '#ffffff'; document.body.style.color = state.darkMode ? 'var(--text)' : '#111827'; }
function createId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function setStatus(message) { els.statusText.textContent = message; }
function formatNumber(value) { return Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 }); }
function formatLongDate(value) { const date = new Date(`${value}T00:00:00`); return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
function getTodayTotal() { const date = new Date().toISOString().slice(0, 10); return state.records.filter((record) => record.date === date).reduce((sum, record) => sum + record.totalDaily, 0); }
function getMonthTotal(monthKey) { return state.records.filter((record) => record.date.slice(0, 7) === monthKey).reduce((sum, record) => sum + record.totalDaily, 0); }
function getAverageDaily() { if (!state.records.length) return 0; return state.records.reduce((sum, record) => sum + record.totalDaily, 0) / state.records.length; }
function getBestDay() { return state.records.reduce((best, record) => (record.totalDaily > (best.totalDaily || -Infinity) ? record : best), {}); }
function getWorstDay() { return state.records.reduce((worst, record) => (record.totalDaily < (worst.totalDaily || Infinity) ? record : worst), {}); }
function getMonthSummary() { const monthly = {}; state.records.forEach((record) => { monthly[record.date.slice(0, 7)] = (monthly[record.date.slice(0, 7)] || 0) + record.totalDaily; }); const months = Object.entries(monthly).map(([label, value]) => ({ label, value })); months.sort((a, b) => b.value - a.value); const currentMonth = new Date().toISOString().slice(0, 7); const currentMonthTotal = monthly[currentMonth] || 0; return { currentMonthTotal, bestMonth: months[0] || { label: '', value: 0 }, worstMonth: months[months.length - 1] || { label: '', value: 0 } }; }
function buildDailySeries() { return state.records.slice(-10).map((record) => ({ label: record.date.slice(5), value: record.totalDaily })); }
function buildWeeklySeries() { const weekly = {}; state.records.forEach((record) => { const date = new Date(`${record.date}T00:00:00`); const key = `S${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`; weekly[key] = (weekly[key] || 0) + record.totalDaily; }); return Object.entries(weekly).map(([label, value]) => ({ label, value })); }
function buildMonthlySeries() { const monthly = {}; state.records.forEach((record) => { monthly[record.date.slice(0, 7)] = (monthly[record.date.slice(0, 7)] || 0) + record.totalDaily; }); return Object.entries(monthly).map(([label, value]) => ({ label, value })); }
function buildYearlySeries() { const yearly = {}; state.records.forEach((record) => { yearly[record.date.slice(0, 4)] = (yearly[record.date.slice(0, 4)] || 0) + record.totalDaily; }); return Object.entries(yearly).map(([label, value]) => ({ label, value })); }
function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
document.addEventListener('DOMContentLoaded', init);
