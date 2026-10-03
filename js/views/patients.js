/* ==========================================================
   Patients tab
   ========================================================== */

function renderPatientAnalyticsView() {
    // Patient Count by Entity Chart
    const entityMap = {};
    filteredClinicData.forEach(d => {
        if (!entityMap[d.entity]) entityMap[d.entity] = new Set();
        entityMap[d.entity].add(d.patientCode);
    });

    const sortedEntities = Object.entries(entityMap)
        .map(([ent, set]) => ({ entity: ent, count: set.size }))
        .sort((a, b) => b.count - a.count);

    createOrUpdateChart('chart-patients-by-entity', {
        type: 'bar',
        data: {
            labels: sortedEntities.map(e => e.entity),
            datasets: [{
                label: 'عدد المرضى الفريدين',
                data: sortedEntities.map(e => e.count),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y'
        }
    });

    // Patient Count by Service Chart
    const serviceMap = {};
    filteredClinicData.forEach(d => {
        serviceMap[d.service] = (serviceMap[d.service] || 0) + 1;
    });

    const sortedServices = Object.entries(serviceMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    createOrUpdateChart('chart-patients-by-service', {
        type: 'bar',
        data: {
            labels: sortedServices.map(s => s[0]),
            datasets: [{
                label: 'عدد مرات طلب الخدمة',
                data: sortedServices.map(s => s[1]),
                backgroundColor: '#10b981',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Populate Specialty Patient Frequency Summary Table
    const specStats = {};
    filteredClinicData.forEach(d => {
        if (!specStats[d.specialty]) {
            specStats[d.specialty] = { visits: 0, patients: new Set(), totalPrice: 0 };
        }
        specStats[d.specialty].visits++;
        specStats[d.specialty].patients.add(d.patientCode);
        specStats[d.specialty].totalPrice += d.price || 0;
    });

    const tbody = document.getElementById('patient-freq-tbody');
    tbody.innerHTML = '';

    Object.entries(specStats).forEach(([spec, data]) => {
        const uniqueCount = data.patients.size;
        const freq = uniqueCount > 0 ? (data.visits / uniqueCount).toFixed(2) : 0;
        const avgPrice = data.visits > 0 ? Math.round(data.totalPrice / data.visits) : 0;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition">
                <td class="p-3 font-bold text-slate-800">${spec}</td>
                <td class="p-3 text-center">${data.visits.toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center font-bold text-indigo-700">${uniqueCount.toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center"><span class="px-2 py-0.5 rounded bg-slate-100 font-bold">${Number(freq).toLocaleString('ar-EG')}</span></td>
                <td class="p-3 text-left font-bold text-emerald-700">${avgPrice.toLocaleString('ar-EG')} ج.م</td>
            </tr>
        `;
    });
}
