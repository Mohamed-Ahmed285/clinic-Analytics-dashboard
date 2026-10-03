/* ==========================================================
   Import quality report: shown after every successful upload
   ========================================================== */

function showQualityReport(r) {
    const n = v => v.toLocaleString('ar-EG', { maximumFractionDigits: 2 });
    const ICON = { ok: ['fa-circle-check', 'text-emerald-600'], info: ['fa-circle-info', 'text-sky-600'], warn: ['fa-triangle-exclamation', 'text-amber-600'] };
    const checks = [];
    const add = (level, title, detail = '') => checks.push({ level, title, detail });

    add('ok', `تم استيراد ${n(r.imported)} سجل`, `الفترة: ${r.from} ← ${r.to}`);

    if (r.reconcile) {
        const { ok, computed: c, footer: f } = r.reconcile;
        add(ok ? 'ok' : 'warn',
            ok ? 'الإجماليات مطابقة لصف الإجمالي في الملف' : 'الإجماليات لا تطابق صف الإجمالي في الملف',
            `الإيراد: ${n(c.price)} (الملف: ${n(f.price)}) • حصة المريض: ${n(c.patientShare)} • حصة الجهة: ${n(c.entityShare)}`);
    } else {
        add('info', 'لا يوجد صف إجمالي في الملف للمطابقة');
    }
    if (r.skippedSummary) add('info', 'تم استبعاد صف الإجمالي من البيانات', 'حتى لا يُحتسب الإيراد مرتين');
    if (r.cashFilled) add('info', `${n(r.cashFilled)} صف بدون جهة اعتُبرت «نقدي»`, 'المريض دفع في العيادة');
    if (r.free) add('info', `${n(r.free)} خدمة سعرها صفر (مجانية)`, 'استخدم فلتر «مدفوع / مجاني» لفصلها');
    if (r.priceMismatch) add('warn', `${n(r.priceMismatch)} صف السعر فيه لا يساوي حصة المريض + حصة الجهة`, 'تستحق مراجعة في النظام المصدر');
    add(r.exactDuplicates ? 'warn' : 'ok',
        r.exactDuplicates ? `${n(r.exactDuplicates)} صف مكرر بالكامل (كل الأعمدة متطابقة)` : 'لا توجد صفوف مكررة بالكامل');
    if (r.skippedBadDate) add('warn', `${n(r.skippedBadDate)} صف تم تخطيه لأن التاريخ غير صالح`);

    let modal = document.getElementById('quality-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quality-modal';
        modal.className = 'fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4';
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
                <i class="fa-solid fa-clipboard-check text-clinic-600"></i> تقرير جودة البيانات
            </h3>
            <ul class="space-y-2.5 max-h-[60vh] overflow-y-auto">
                ${checks.map(c => `
                    <li class="flex gap-2.5 text-sm">
                        <i class="fa-solid ${ICON[c.level][0]} ${ICON[c.level][1]} mt-1"></i>
                        <div><div class="font-bold text-slate-800">${c.title}</div>
                        ${c.detail ? `<div class="text-xs text-slate-500">${c.detail}</div>` : ''}</div>
                    </li>`).join('')}
            </ul>
            <div class="flex justify-end">
                <button onclick="document.getElementById('quality-modal').classList.add('hidden')"
                    class="px-5 py-2 bg-clinic-600 hover:bg-clinic-700 text-white text-xs font-bold rounded-xl">متابعة</button>
            </div>
        </div>`;
}
