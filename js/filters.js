/* ==========================================================
   Global filters, tab switching and dashboard refresh
   ========================================================== */

function populateFilterOptions() {
    const specialtySelect = document.getElementById('filter-specialty');
    const entitySelect = document.getElementById('filter-entity');
    const docTabSpecialtySelect = document.getElementById('doctor-tab-specialty-select');

    // Unique Specialties
    const specialties = Array.from(new Set(rawClinicData.map(d => d.specialty))).sort();
    specialtySelect.innerHTML = `<option value="ALL">جميع التخصصات الطبية (${specialties.length})</option>`;
    docTabSpecialtySelect.innerHTML = '';

    specialties.forEach(spec => {
        specialtySelect.innerHTML += `<option value="${spec}">${spec}</option>`;
        docTabSpecialtySelect.innerHTML += `<option value="${spec}">${spec}</option>`;
    });

    // Unique Entities
    const entities = Array.from(new Set(rawClinicData.map(d => d.entity))).sort();
    entitySelect.innerHTML = `<option value="ALL">جميع جهات العلاج والتأمين (${entities.length})</option>`;
    entities.forEach(ent => {
        entitySelect.innerHTML += `<option value="${ent}">${ent}</option>`;
    });

    updatePeriodLabel();
}

// Header subtitle: shows the real period covered by the loaded data
function updatePeriodLabel() {
    const el = document.getElementById('period-label');
    if (!el || !rawClinicData.length) return;
    const months = aggregateByMonth(rawClinicData);
    el.textContent = months.length > 1
        ? `(${months[0].label} - ${months[months.length - 1].label})`
        : `(${months[0].label})`;
}

function applyGlobalFilters() {
    const searchTerm = document.getElementById('global-search').value.trim().toLowerCase();
    const selectedSpec = document.getElementById('filter-specialty').value;
    const selectedEntity = document.getElementById('filter-entity').value;

    filteredClinicData = rawClinicData.filter(row => {
        // Search term matching
        const matchesSearch = !searchTerm || 
            (row.patientName && row.patientName.toLowerCase().includes(searchTerm)) ||
            (row.patientCode && row.patientCode.toLowerCase().includes(searchTerm)) ||
            (row.doctor && row.doctor.toLowerCase().includes(searchTerm)) ||
            (row.service && row.service.toLowerCase().includes(searchTerm)) ||
            (row.invoice && row.invoice.toLowerCase().includes(searchTerm));

        // Specialty filter
        const matchesSpec = selectedSpec === 'ALL' || row.specialty === selectedSpec;

        // Entity filter
        const matchesEntity = selectedEntity === 'ALL' || row.entity === selectedEntity;

        return matchesSearch && matchesSpec && matchesEntity;
    });

    // Update UI Badges
    document.getElementById('badge-total-records').innerText = filteredClinicData.length.toLocaleString('ar-EG');
    
    const uniqueDocsCount = new Set(filteredClinicData.map(d => d.doctor)).size;
    document.getElementById('badge-doc-count').innerText = uniqueDocsCount.toLocaleString('ar-EG');

    // Refresh Active Tab Content
    refreshDashboardViews();
}

function resetFilters(silent = false) {
    document.getElementById('global-search').value = '';
    document.getElementById('filter-specialty').value = 'ALL';
    document.getElementById('filter-entity').value = 'ALL';
    applyGlobalFilters();
    if (!silent) showToast("تم إعادة ضبط جميع الفلاتر", "info");
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Toggle active styles on tabs
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('active-tab');
        btn.classList.add('text-slate-600');
    });
    
    const selectedBtn = document.getElementById(`tab-${tabId}`);
    if (selectedBtn) {
        selectedBtn.classList.add('active-tab');
        selectedBtn.classList.remove('text-slate-600');
    }

    // Toggle view visibility
    document.querySelectorAll('.tab-content').forEach(view => {
        view.classList.add('hidden');
    });

    document.getElementById(`view-${tabId}`).classList.remove('hidden');

    // Refresh current view
    refreshDashboardViews();
}

function refreshDashboardViews() {
    if (currentTab === 'overview') {
        renderOverviewKPIs();
        renderOverviewCharts();
    } else if (currentTab === 'doctors') {
        renderDoctorComparisonView();
    } else if (currentTab === 'patients') {
        renderPatientAnalyticsView();
    } else if (currentTab === 'rawdata') {
        renderRawDataTable();
    }
}
