/* ==========================================================
   Overview tab: KPIs + charts
   ========================================================== */

function renderOverviewKPIs() {
    const totalVisits = filteredClinicData.length;
    const uniquePatients = new Set(filteredClinicData.map(d => d.patientCode)).size;
    const frequencyRate = uniquePatients > 0 ? (totalVisits / uniquePatients).toFixed(2) : 0;

    const totalRevenue = filteredClinicData.reduce((sum, d) => sum + (d.price || 0), 0);
    const totalPatientShare = filteredClinicData.reduce((sum, d) => sum + (d.patientShare || 0), 0);
    const totalEntityShare = filteredClinicData.reduce((sum, d) => sum + (d.entityShare || 0), 0);

    // Calculate Top Specialty
    const specCounts = {};
    filteredClinicData.forEach(d => {
        specCounts[d.specialty] = (specCounts[d.specialty] || 0) + 1;
    });
    
    let topSpec = "-";
    let maxCount = 0;
    Object.entries(specCounts).forEach(([spec, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topSpec = spec;
        }
    });

    // Update KPI DOM elements
    const freeCount = filteredClinicData.filter(d => !(d.price > 0)).length;
    document.getElementById('kpi-free-count').innerText = freeCount.toLocaleString('ar-EG');
    document.getElementById('kpi-total-visits').innerText = totalVisits.toLocaleString('ar-EG');
    document.getElementById('kpi-unique-patients').innerText = uniquePatients.toLocaleString('ar-EG');
    document.getElementById('kpi-frequency-rate').innerText = Number(frequencyRate).toLocaleString('ar-EG');
    document.getElementById('kpi-total-revenue').innerText = `${totalRevenue.toLocaleString('ar-EG')} ج.م`;
    document.getElementById('kpi-patient-share').innerText = `${totalPatientShare.toLocaleString('ar-EG')} ج.م`;
    document.getElementById('kpi-entity-share').innerText = `${totalEntityShare.toLocaleString('ar-EG')} ج.م`;
    document.getElementById('kpi-top-specialty').innerText = topSpec;
    document.getElementById('kpi-top-specialty-count').innerText = `${maxCount.toLocaleString('ar-EG')} زيارة مسجلة`;
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
                    label: 'إجمالي الزيارات',
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
                y: { position: 'right', title: { display: true, text: 'عدد الزيارات' } },
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
