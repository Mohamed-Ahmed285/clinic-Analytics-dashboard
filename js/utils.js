/* ==========================================================
   Shared helpers: charts + toast notifications
   ========================================================== */

function createOrUpdateChart(canvasId, config) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId);
    if (ctx) {
        chartInstances[canvasId] = new Chart(ctx.getContext('2d'), config);
    }
}


function showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgClass = "bg-slate-800 text-white";
    let icon = "fa-circle-info";

    if (type === "success") {
        bgClass = "bg-emerald-700 text-white";
        icon = "fa-circle-check";
    } else if (type === "error") {
        bgClass = "bg-rose-700 text-white";
        icon = "fa-triangle-exclamation";
    }

    toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2.5 transition-all duration-300 transform translate-y-2`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

// Months present in the data, chronological: [{ key: '2026-07', label: 'يوليو 2026' }]
function listMonths(rows) {
    return [...new Set(rows.map(r => r.date.slice(0, 7)))].sort().map(key => {
        const [y, m] = key.split('-');
        return { key, label: `${ARABIC_MONTHS[+m - 1]} ${y}` };
    });
}

// Per month: number of services and revenue. Works for any period.
function aggregateByMonth(rows) {
    const byMonth = new Map();
    rows.forEach(r => {
        const key = r.date.slice(0, 7);
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key).push(r);
    });
    const labels = Object.fromEntries(listMonths(rows).map(m => [m.key, m.label]));
    return [...byMonth.keys()].sort().map(key => ({
        key,
        label: labels[key],
        visits: byMonth.get(key).length,   // services (rows), same basis as the KPI cards
        revenue: byMonth.get(key).reduce((t, r) => t + (r.price || 0), 0),
    }));
}
