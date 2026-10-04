/* ==========================================================
   Overview: average paid كشوفات per day, per specialty
   ========================================================== */

function renderSpecialtyWorkload() {
    const host = document.getElementById('specialty-workload');
    if (!host) return;

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const f0 = n => n.toLocaleString('ar-EG');
    const f1 = n => n.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    const month = document.getElementById('filter-month').value;
    const days = Metrics.workingDays(rawClinicData, month);
    const list = Metrics.specialtyWorkload(workloadData, days);

    document.getElementById('workload-caption').textContent =
        `كشوفات مدفوعة مع طبيب ÷ ${f0(days.count)} يوم عمل للمستشفى في الفترة (الجمعة إجازة) • لا يتأثر بفلتر نوع الخدمة`;

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
                <span class="text-[11px] text-slate-400">كشف/يوم</span>
            </div>
            <div class="col-span-12 sm:col-start-4 sm:col-span-9 text-[11px] text-slate-500 mb-1.5">
                ${f0(s.visits)} كشف • اشتغل ${f0(s.activeDays)} من ${f0(days.count)} يوم
                ${low ? `<span class="text-amber-600 font-bold">• أقل من ${f0(lowPct)}% من الأيام</span>` : ''}
            </div>
        </div>`;
    }).join('');
}
