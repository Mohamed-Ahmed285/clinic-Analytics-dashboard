/* ==========================================================
   Raw data tab: table, paging, sorting
   ========================================================== */

function renderRawDataTable() {
    let data = [...filteredClinicData];

    // Sorting logic
    data.sort((a, b) => {
        let valA = a[sortColumn] || '';
        let valB = b[sortColumn] || '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination calculation
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = data.slice(startIndex, startIndex + pageSize);

    // Populate Table Rows
    const tbody = document.getElementById('raw-data-tbody');
    tbody.innerHTML = '';

    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="p-8 text-center text-slate-400 font-bold">لا توجد سجلات تطابق معايير البحث الحالية</td></tr>`;
    } else {
        paginatedData.forEach(row => {
            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-3 text-center font-bold text-slate-800">${row.invoice}</td>
                    <td class="p-3 text-center font-mono text-clinic-700 font-bold">${row.patientCode}</td>
                    <td class="p-3 font-bold text-slate-800">${row.patientName}</td>
                    <td class="p-3">${row.specialty}</td>
                    <td class="p-3 font-medium text-slate-700">${row.doctor}</td>
                    <td class="p-3 text-slate-600">${row.service}</td>
                    <td class="p-3 text-left font-bold text-slate-800">${row.price} ج.م</td>
                    <td class="p-3 text-left text-emerald-700">${row.patientShare} ج.م</td>
                    <td class="p-3 text-left text-indigo-700">${row.entityShare} ج.م</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${row.entity}</span></td>
                    <td class="p-3 text-center text-slate-500">${row.date}</td>
                    <td class="p-3 text-center text-slate-500 font-mono">${row.time}</td>
                </tr>
            `;
        });
    }

    // Pagination Controls
    document.getElementById('raw-pagination-info').innerText = 
        `عرض السجلات من ${startIndex + 1} إلى ${Math.min(startIndex + pageSize, totalRecords)} (من إجمالي ${totalRecords.toLocaleString('ar-EG')})`;

    const controlsContainer = document.getElementById('raw-pagination-controls');
    controlsContainer.innerHTML = '';

    // Prev Button
    controlsContainer.innerHTML += `
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
    `;

    // Page Indicator
    controlsContainer.innerHTML += `
        <span class="px-3 py-1.5 text-xs font-bold bg-clinic-100 text-clinic-800 rounded-lg">
            صفحة ${currentPage} من ${totalPages}
        </span>
    `;

    // Next Button
    controlsContainer.innerHTML += `
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>
    `;
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('raw-page-size').value, 10);
    currentPage = 1;
    renderRawDataTable();
}

function goToPage(page) {
    currentPage = page;
    renderRawDataTable();
}

function sortRawData(col) {
    if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = col;
        sortDirection = 'asc';
    }
    renderRawDataTable();
}
