/* ==========================================================
   Doctors tab
   ========================================================== */

function renderDoctorComparisonView() {
    const specSelect = document.getElementById('doctor-tab-specialty-select');
    const selectedSpec = specSelect.value || Object.keys(DEMO_SPECIALTIES_DOCTORS)[0];

    // Filter data for this specific specialty
    const specData = filteredClinicData.filter(d => d.specialty === selectedSpec);

    // Group by Doctor
    const docStats = {};
    specData.forEach(d => {
        if (!docStats[d.doctor]) {
            docStats[d.doctor] = {
                doctorName: d.doctor,
                visits: 0,
                uniquePatients: new Set(),
                revenue: 0,
                servicesMap: {}
            };
        }

        docStats[d.doctor].visits++;
        docStats[d.doctor].uniquePatients.add(d.patientCode);
        docStats[d.doctor].revenue += d.price || 0;
        docStats[d.doctor].servicesMap[d.service] = (docStats[d.doctor].servicesMap[d.service] || 0) + 1;
    });

    const docList = Object.values(docStats).map(doc => {
        // Determine top service
        let topService = "-";
        let maxSvcCount = 0;
        Object.entries(doc.servicesMap).forEach(([svc, count]) => {
            if (count > maxSvcCount) {
                maxSvcCount = count;
                topService = svc;
            }
        });

        return {
            doctorName: doc.doctorName,
            visits: doc.visits,
            uniquePatientsCount: doc.uniquePatients.size,
            revenue: doc.revenue,
            topService: topService
        };
    }).sort((a, b) => b.uniquePatientsCount - a.uniquePatientsCount);

    // Total specialty stats
    const totalSpecPatients = new Set(specData.map(d => d.patientCode)).size;
    const docCount = docList.length;
    const avgPatients = docCount > 0 ? (totalSpecPatients / docCount).toFixed(1) : 0;

    const topDoc = docList[0] || { doctorName: "-", uniquePatientsCount: 0 };
    const topDocShare = totalSpecPatients > 0 ? ((topDoc.uniquePatientsCount / totalSpecPatients) * 100).toFixed(1) : 0;

    // Update Summary Cards
    document.getElementById('spec-doc-count').innerText = docCount.toLocaleString('ar-EG');
    document.getElementById('spec-total-patients').innerText = totalSpecPatients.toLocaleString('ar-EG');
    document.getElementById('spec-avg-patients').innerText = Number(avgPatients).toLocaleString('ar-EG');
    document.getElementById('spec-top-doctor').innerText = topDoc.doctorName;
    document.getElementById('spec-top-doctor-share').innerText = `%${Number(topDocShare).toLocaleString('ar-EG')} من مرضى القسم`;

    // Render Doctor Comparison Chart
    createOrUpdateChart('chart-doctors-in-specialty', {
        type: 'bar',
        data: {
            labels: docList.map(d => d.doctorName),
            datasets: [
                {
                    label: 'المرضى الفريدين',
                    data: docList.map(d => d.uniquePatientsCount),
                    backgroundColor: '#0d9488',
                    borderRadius: 6
                },
                {
                    label: 'إجمالي الزيارات',
                    data: docList.map(d => d.visits),
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Render Leaderboard Matrix Table
    const tbody = document.getElementById('doctor-leaderboard-tbody');
    tbody.innerHTML = '';

    if (docList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">لا توجد بيانات متاحة لهذا التخصص وفق الفلاتر الحالية</td></tr>`;
        return;
    }

    docList.forEach((doc, idx) => {
        const sharePercent = totalSpecPatients > 0 ? ((doc.uniquePatientsCount / totalSpecPatients) * 100).toFixed(1) : 0;

        let rankBadge = `<span class="font-bold text-slate-500">${idx + 1}</span>`;
        if (idx === 0) rankBadge = `<span class="w-7 h-7 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 font-black text-xs shadow-xs"><i class="fa-solid fa-crown"></i></span>`;
        else if (idx === 1) rankBadge = `<span class="w-7 h-7 inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs">2</span>`;
        else if (idx === 2) rankBadge = `<span class="w-7 h-7 inline-flex items-center justify-center rounded-full bg-amber-700/20 text-amber-900 font-bold text-xs">3</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="p-3.5 text-center">${rankBadge}</td>
                <td class="p-3.5 font-bold text-slate-800">${doc.doctorName}</td>
                <td class="p-3.5 text-center font-black text-clinic-700">${doc.uniquePatientsCount.toLocaleString('ar-EG')}</td>
                <td class="p-3.5 text-center text-slate-600">${doc.visits.toLocaleString('ar-EG')}</td>
                <td class="p-3.5 text-center">
                    <span class="inline-block px-2.5 py-1 rounded-full bg-slate-100 font-bold text-xs text-slate-700">
                        %${Number(sharePercent).toLocaleString('ar-EG')}
                    </span>
                </td>
                <td class="p-3.5 text-slate-600">${doc.topService}</td>
                <td class="p-3.5 text-left font-bold text-emerald-700">${doc.revenue.toLocaleString('ar-EG')} ج.م</td>
            </tr>
        `;
    });
}
