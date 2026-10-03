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

// Group rows by YYYY-MM (chronological). Works for any period, not just one quarter.
function aggregateByMonth(rows) {
    const map = new Map();
    rows.forEach(r => {
        const key = r.date.slice(0, 7);
        if (!map.has(key)) {
            const [y, m] = key.split('-');
            map.set(key, { key, label: `${ARABIC_MONTHS[+m - 1]} ${y}`, visits: 0, revenue: 0 });
        }
        const agg = map.get(key);
        agg.visits++;
        agg.revenue += r.price || 0;
    });
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}
