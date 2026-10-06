/* ==========================================================
   Overview: average paid كشوفات per day, per specialty
   ========================================================== */

const WORKLOAD_TYPE_INFO = {
    [SERVICE_TYPES.VISIT]:     { label: 'الكشوفات',      caption: 'كشوفات مدفوعة مع طبيب', noun: 'كشف' },
    [SERVICE_TYPES.CONSULT]:   { label: 'استشارات',      caption: 'استشارات',               noun: 'استشارة' },
    [SERVICE_TYPES.PROCEDURE]: { label: 'خدمات أخرى',    caption: 'خدمات أخرى',             noun: 'خدمة' },
};

// Called by the 3 toggle buttons; at least one type always stays active
function toggleWorkloadType(type) {
    if (workloadTypes.has(type)) {
        if (workloadTypes.size === 1) return;
        workloadTypes.delete(type);
    } else {
        workloadTypes.add(type);
    }
    renderSpecialtyWorkload();
}

function syncWorkloadButtons() {
    document.querySelectorAll('#workload-types button').forEach(btn => {
        const on = workloadTypes.has(btn.dataset.type);
        btn.setAttribute('aria-pressed', on);
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold border transition ' +
            (on ? 'bg-clinic-600 text-white border-clinic-600 shadow-xs'
                : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50');
    });
}

function renderSpecialtyWorkload() {
    const host = document.getElementById('specialty-workload');
    if (!host) return;

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const f0 = n => n.toLocaleString('ar-EG');
    const f1 = n => n.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    const month = document.getElementById('filter-month').value;
    const days = Metrics.workingDays(rawClinicData, month);
    const list = Metrics.specialtyWorkload(workloadData, days, workloadTypes);

    syncWorkloadButtons();
    const selected = [...workloadTypes];
    const noun = selected.length === 1 ? WORKLOAD_TYPE_INFO[selected[0]].noun : 'زيارة';
    const what = selected.map(t => WORKLOAD_TYPE_INFO[t].caption).join(' + ');

    document.getElementById('workload-caption').textContent =
        `${what} (المريض يُحسب مرة لكل تخصص في اليوم) ÷ ${f0(days.count)} يوم عمل للمستشفى (الجمعة إجازة) • لا يتأثر بفلتر نوع الخدمة`;

    if (!list.length || !days.count) {
        host.innerHTML = '<div class="text-sm text-slate-400 py-6 text-center">لا توجد بيانات</div>';
        return;
    }

    const max = Math.max(...list.map(s => s.avgPerDay), 0.0001);
    const lowPct = Math.round(WORKLOAD_LOW_ACTIVITY_RATIO * 100);

    host.innerHTML = list.map(s => {
        const low = s.activeDays / days.count < WORKLOAD_LOW_ACTIVITY_RATIO;
        const width = s.avgPerDay > 0 ? Math.max(s.avgPerDay / max * 100, 1.5) : 0;
        return `
        <div class="grid grid-cols-12 gap-x-3 gap-y-0.5 items-center text-sm">
            <div class="col-span-12 sm:col-span-3 font-bold text-slate-700 truncate" title="${esc(s.specialty)}">${esc(s.specialty)}</div>
            <div class="col-span-9 sm:col-span-7">
                <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${low ? 'bg-amber-400' : 'bg-clinic-500'}" style="width:${width}%"></div>
                </div>
            </div>
            <div class="col-span-3 sm:col-span-2 text-left">
                <span class="font-black text-slate-800">${f1(s.avgPerDay)}</span>
                <span class="text-[11px] text-slate-400">${noun}/يوم</span>
            </div>
            <div class="col-span-12 sm:col-start-4 sm:col-span-9 text-[11px] text-slate-500 mb-1.5">
                ${f0(s.visits)} ${noun} • اشتغل ${f0(s.activeDays)} من ${f0(days.count)} يوم
                ${low ? `<span class="text-amber-600 font-bold">• أقل من ${f0(lowPct)}% من الأيام</span>` : ''}
            </div>
        </div>`;
    }).join('');
}
