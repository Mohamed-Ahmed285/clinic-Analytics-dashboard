/* ==========================================================
   Overview tab: KPIs + charts
   ========================================================== */

function renderOverviewKPIs() {
    const f0 = n => n.toLocaleString('ar-EG');
    const total = filteredClinicData.length;

    // Services by type: كشف + استشارة + أخرى always add up to the services total
    const byType = { [SERVICE_TYPES.VISIT]: 0, [SERVICE_TYPES.CONSULT]: 0, [SERVICE_TYPES.PROCEDURE]: 0 };
    filteredClinicData.forEach(d => { byType[d.serviceType] = (byType[d.serviceType] || 0) + 1; });
    const pct = n => total ? `${(n / total * 100).toLocaleString('ar-EG', { maximumFractionDigits: 1 })}٪ من الخدمات` : '-';

    const totalRevenue = filteredClinicData.reduce((sum, d) => sum + (d.price || 0), 0);
    const totalPatientShare = filteredClinicData.reduce((sum, d) => sum + (d.patientShare || 0), 0);
    const totalEntityShare = filteredClinicData.reduce((sum, d) => sum + (d.entityShare || 0), 0);

    // Top specialty by number of services
    const specCounts = {};
    filteredClinicData.forEach(d => { specCounts[d.specialty] = (specCounts[d.specialty] || 0) + 1; });
    let topSpec = "-", maxCount = 0;
    Object.entries(specCounts).forEach(([spec, count]) => { if (count > maxCount) { maxCount = count; topSpec = spec; } });

    // Cash vs non-cash (services + revenue)
    const cashRows = filteredClinicData.filter(d => d.entity === CASH_LABEL);
    const cashCount = cashRows.length, nonCashCount = total - cashCount;
    const cashRevenue = cashRows.reduce((t, d) => t + (d.price || 0), 0);
    const nonCashRevenue = totalRevenue - cashRevenue;
    const p1 = (a, b) => b ? (a / b * 100).toLocaleString('ar-EG', { maximumFractionDigits: 1 }) : '٠';

    const set = (id, v) => { document.getElementById(id).innerText = v; };
    set('kpi-total-visits', f0(total));
    set('kpi-total-sub', 'كل الخدمات المسجلة');
    set('kpi-count-visit', f0(byType[SERVICE_TYPES.VISIT]));
    set('kpi-pct-visit', pct(byType[SERVICE_TYPES.VISIT]));
    set('kpi-count-consult', f0(byType[SERVICE_TYPES.CONSULT]));
    set('kpi-pct-consult', pct(byType[SERVICE_TYPES.CONSULT]));
    set('kpi-count-other', f0(byType[SERVICE_TYPES.PROCEDURE]));
    set('kpi-pct-other', pct(byType[SERVICE_TYPES.PROCEDURE]));
    set('kpi-total-revenue', `${f0(totalRevenue)} ج.م`);
    set('kpi-patient-share', `${f0(totalPatientShare)} ج.م`);
    set('kpi-entity-share', `${f0(totalEntityShare)} ج.م`);
    set('kpi-cash-text', `${f0(cashCount)} خدمة • ${f0(cashRevenue)} ج.م • ${p1(cashRevenue, totalRevenue)}٪`);
    set('kpi-noncash-text', `${f0(nonCashCount)} خدمة • ${f0(nonCashRevenue)} ج.م • ${p1(nonCashRevenue, totalRevenue)}٪`);
    document.getElementById('kpi-cash-bar').style.width = (totalRevenue ? cashRevenue / totalRevenue * 100 : 0) + '%';
    set('kpi-top-specialty', topSpec);
    set('kpi-top-specialty-count', `${f0(maxCount)} خدمة مسجلة`);
}

function renderOverviewCharts() {
    // Chart 1: Monthly Trend (July, Aug, Sept)
    const monthly = aggregateByMonth(filteredClinicData);

    createOrUpdateChart('chart-monthly-trend', {
        type: 'bar',
        data: {
            labels: monthly.map(m => m.label),
            datasets: [
                {
                    label: 'عدد الخدمات',
                    data: monthly.map(m => m.visits),
                    backgroundColor: '#0d9488',
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'الإيرادات (ج.م)',
                    data: monthly.map(m => m.revenue),
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    type: 'line',
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { position: 'right', title: { display: true, text: 'عدد الخدمات' } },
                y1: { position: 'left', grid: { drawOnChartArea: false }, title: { display: true, text: 'الإيرادات (ج.م)' } }
            }
        }
    });

    // Chart 2: Entity Distribution Pie Chart
    const entityCounts = {};
    filteredClinicData.forEach(d => {
        entityCounts[d.entity] = (entityCounts[d.entity] || 0) + 1;
    });

    createOrUpdateChart('chart-entity-distribution', {
        type: 'doughnut',
        data: {
            labels: Object.keys(entityCounts),
            datasets: [{
                data: Object.values(entityCounts),
                backgroundColor: ['#0d9488', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Chart 3: Top Specialties
    const specVisits = {};
    filteredClinicData.forEach(d => {
        specVisits[d.specialty] = (specVisits[d.specialty] || 0) + 1;
    });

    const sortedSpecs = Object.entries(specVisits).sort((a, b) => b[1] - a[1]);

    createOrUpdateChart('chart-specialty-overview', {
        type: 'bar',
        data: {
            labels: sortedSpecs.map(s => s[0]),
            datasets: [{
                label: 'عدد الزيارات',
                data: sortedSpecs.map(s => s[1]),
                backgroundColor: '#14b8a6',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y'
        }
    });

    // Chart 4: Hourly Peak Traffic
    const hourlyCounts = {};
    for (let h = 8; h <= 21; h++) {
        hourlyCounts[`${String(h).padStart(2, '0')}:00`] = 0;
    }

    filteredClinicData.forEach(d => {
        if (d.time) {
            const hourPrefix = d.time.split(':')[0] + ':00';
            if (hourlyCounts[hourPrefix] !== undefined) {
                hourlyCounts[hourPrefix]++;
            }
        }
    });

    createOrUpdateChart('chart-hourly-peak', {
        type: 'line',
        data: {
            labels: Object.keys(hourlyCounts),
            datasets: [{
                label: 'حجم تردد المرضى',
                data: Object.values(hourlyCounts),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
