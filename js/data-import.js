/* ==========================================================
   Excel / CSV import
   ----------------------------------------------------------
   Pipeline:  file -> workbook -> pick best sheet -> find header row
              -> map columns -> clean rows -> report
   Public API:
     handleFileSelect(event)   (called from the <input type=file>)
     importFile(file)          (also used by drag & drop)
   ========================================================== */

const ClinicImport = (() => {

    /* ---------- 1. Configuration ---------- */

    // Fallbacks in case the primary CDN is blocked (common on hospital networks)
    const SHEETJS_URLS = [
        'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    ];

    // Internal field -> accepted column titles (matched EXACTLY after normalisation,
    // first alias has priority). Add new spellings here if your export changes.
    const FIELDS = {
        invoice:      { label: 'رقم الفاتورة',  aliases: ['رقم الفاتورة', 'الفاتورة', 'invoice', 'invoice no', 'invoice number'] },
        patientCode:  { label: 'كود المريض',    aliases: ['كود المريض', 'patient code', 'patientcode', 'patient id'] },
        patientName:  { label: 'المريض',        aliases: ['المريض', 'اسم المريض', 'patient', 'patient name'] },
        specialty:    { label: 'التخصص',        aliases: ['التخصص', 'specialty', 'department'], required: true },
        doctor:       { label: 'الطبيب الطالب', aliases: ['الطبيب الطالب', 'الطبيب', 'طبيب', 'doctor', 'الطبيب المنفذ'], required: true },
        service:      { label: 'الخدمة',        aliases: ['الخدمة', 'الخدمه', 'اسم الخدمة', 'service'] },
        price:        { label: 'سعر الخدمة',    aliases: ['سعر الخدمة', 'السعر', 'سعر', 'price', 'amount'], required: true },
        patientShare: { label: 'حصة المريض',    aliases: ['حصة المريض', 'patient share', 'patientshare'] },
        entityShare:  { label: 'حصة الجهة',     aliases: ['حصة الجهة', 'entity share', 'entityshare'] },
        entity:       { label: 'الجهة',         aliases: ['الجهة', 'جهة التعاقد', 'entity', 'payer', 'insurance'] },
        date:         { label: 'التاريخ',       aliases: ['التاريخ', 'تاريخ', 'date', 'visit date'], required: true },
        time:         { label: 'الوقت',         aliases: ['الوقت', 'وقت', 'time'] },
    };

    const UNKNOWN = 'غير محدد';
    // Service type = how a service is counted. Matched on the START of the name, because
    // "كشف استشاري العظام" contains both words. Anything not matched is a procedure.
    const SERVICE_TYPE_RULES = [
        { type: SERVICE_TYPES.VISIT,   startsWith: ['كشف'] },
        { type: SERVICE_TYPES.CONSULT, startsWith: ['استشار'], equals: ['متابعه اسنان'] },
    ];
    function classifyService(name) {
        const n = normalizeText(name);
        for (const rule of SERVICE_TYPE_RULES) {
            if ((rule.startsWith || []).some(p => n.startsWith(normalizeText(p))) ||
                (rule.equals || []).some(e => n === normalizeText(e))) return rule.type;
        }
        return SERVICE_TYPES.PROCEDURE;
    }

    const HEADER_SEARCH_ROWS = 15;   // header may sit below a title row

    /* ---------- 2. Text / value helpers ---------- */

    const ARABIC_DIGITS = { '٠':0,'١':1,'٢':2,'٣':3,'٤':4,'٥':5,'٦':6,'٧':7,'٨':8,'٩':9,
                            '۰':0,'۱':1,'۲':2,'۳':3,'۴':4,'۵':5,'۶':6,'۷':7,'۸':8,'۹':9 };

    function westernDigits(s) {
        return String(s).replace(/[٠-٩۰-۹]/g, d => ARABIC_DIGITS[d]);
    }

    function cleanText(v) {
        if (v === null || v === undefined) return '';
        return String(v).replace(/[\u200E\u200F\u00A0]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Aggressive normaliser used ONLY for comparing (never for display)
    function normalizeText(v) {
        return cleanText(v).normalize('NFKC').toLowerCase()
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')   // tashkeel + tatweel
            .replace(/[أإآٱ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/[_\-]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
    }

    function parseNumber(v) {
        if (typeof v === 'number') return isFinite(v) ? v : 0;
        const s = westernDigits(cleanText(v)).replace(/[,٬\s]/g, '').replace('٫', '.');
        const n = parseFloat(s);
        return isFinite(n) ? n : 0;
    }

    const pad2 = n => String(n).padStart(2, '0');

    function isoDate(y, m, d) {
        if (!(y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return '';
        return `${y}-${pad2(m)}-${pad2(d)}`;
    }

    // Returns 'YYYY-MM-DD' or '' when the value can't be understood as a date
    function parseDate(v) {
        if (v === null || v === undefined || v === '') return '';

        if (v instanceof Date && !isNaN(v)) {
            return isoDate(v.getFullYear(), v.getMonth() + 1, v.getDate());
        }
        if (typeof v === 'number') {                       // Excel serial date
            if (v < 20000 || v > 80000) return '';
            const p = XLSX.SSF.parse_date_code(v);
            return p ? isoDate(p.y, p.m, p.d) : '';
        }

        const s = westernDigits(cleanText(v));
        let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);          // 2026-08-27
        if (m) return isoDate(+m[1], +m[2], +m[3]);
        m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);              // 27/08/2026 (day first)
        if (m) return isoDate(+m[3], +m[2], +m[1]);
        if (/^\d{5}(\.\d+)?$/.test(s)) return parseDate(parseFloat(s));     // serial stored as text
        return '';
    }

    // Returns 'HH:MM' or ''
    function parseTime(v) {
        if (v === null || v === undefined || v === '') return '';
        if (v instanceof Date && !isNaN(v)) return `${pad2(v.getHours())}:${pad2(v.getMinutes())}`;
        if (typeof v === 'number') {                       // fraction of a day
            const frac = v % 1;
            const mins = Math.round(frac * 24 * 60) % (24 * 60);
            return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
        }
        const m = westernDigits(cleanText(v)).match(/(\d{1,2}):(\d{2})/);
        return m ? `${pad2(+m[1])}:${m[2]}` : '';
    }

    /* ---------- 3. Loading the libraries / reading the file ---------- */

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url; s.onload = resolve; s.onerror = () => reject(new Error('load failed: ' + url));
            document.head.appendChild(s);
        });
    }

    async function ensureSheetJS() {
        if (window.XLSX) return;
        for (const url of SHEETJS_URLS) {
            try { await loadScript(url); if (window.XLSX) return; } catch (e) { console.warn(e.message); }
        }
        throw new Error('SHEETJS_UNAVAILABLE');
    }

    function readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = () => reject(r.error || new Error('read failed'));
            r.readAsArrayBuffer(file);
        });
    }

    async function readWorkbook(file) {
        const buffer = await readAsArrayBuffer(file);

        if (/\.csv$/i.test(file.name)) {
            // Decode CSV ourselves so Arabic files saved as Windows-1256 still work
            let text = new TextDecoder('utf-8').decode(buffer);
            if (text.includes('\uFFFD')) text = new TextDecoder('windows-1256').decode(buffer);
            return XLSX.read(text.replace(/^\uFEFF/, ''), { type: 'string', raw: true });
        }
        return XLSX.read(new Uint8Array(buffer), { type: 'array', raw: true });
    }

    /**
     * Some exporters write a wrong <dimension ref="A1:C1"/> into the sheet, and
     * SheetJS trusts it, so only the first row is returned ("file is empty").
     * We recompute the real range from the cells that were actually parsed.
     */
    function repairSheetRange(ws) {
        let maxR = -1, maxC = -1;
        for (const addr in ws) {
            if (addr.charCodeAt(0) === 33) continue;      // skip "!ref", "!cols", ...
            const { r, c } = XLSX.utils.decode_cell(addr);
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
        if (maxR >= 0) ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
    }

    /* ---------- 4. Finding the header row and mapping columns ---------- */

    function findColumnIndex(headerCells, aliases) {
        const normalized = headerCells.map(normalizeText);
        for (const alias of aliases) {
            const idx = normalized.indexOf(normalizeText(alias));
            if (idx !== -1) return idx;
        }
        return -1;
    }

    function mapColumns(headerCells) {
        const map = {};
        for (const [field, cfg] of Object.entries(FIELDS)) {
            map[field] = findColumnIndex(headerCells, cfg.aliases);
        }
        return map;
    }

    function scoreHeader(headerCells) {
        return Object.values(mapColumns(headerCells)).filter(i => i !== -1).length;
    }

    // Look at every sheet, return the one whose header matches the most known columns
    function pickBestSheet(workbook) {
        let best = null;
        for (const name of workbook.SheetNames) {
            const ws = workbook.Sheets[name];
            if (!ws) continue;
            repairSheetRange(ws);
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: false });
            for (let i = 0; i < Math.min(rows.length, HEADER_SEARCH_ROWS); i++) {
                const score = scoreHeader(rows[i]);
                if (!best || score > best.score) best = { name, rows, headerIndex: i, score };
            }
        }
        return best;
    }

    /* ---------- 5. Cleaning rows ---------- */

    // Merge spelling variants ("نقدى" / "نقدي " / "نقدى") under the first spelling seen
    function makeCanonicalizer() {
        const seen = new Map();
        return value => {
            const text = cleanText(value);
            if (!text) return UNKNOWN;
            const key = normalizeText(text);
            if (!seen.has(key)) seen.set(key, text);
            return seen.get(key);
        };
    }

    function buildRecords(rows, headerIndex, colMap) {
        const canon = {
            specialty: makeCanonicalizer(), doctor: makeCanonicalizer(),
            entity: makeCanonicalizer(), service: makeCanonicalizer(),
        };
        canon.entity(CASH_LABEL);   // seed: spelling variants like "نقدى" merge into "نقدي"
        const cell = (row, field) => colMap[field] === -1 ? '' : row[colMap[field]];
        const hasShares = colMap.patientShare !== -1 && colMap.entityShare !== -1;

        const records = [];
        const seenRows = new Set();
        const stats = { total: 0, blank: 0, summary: 0, badDate: 0, cashFilled: 0,
                        mismatch: 0, exactDup: 0, free: 0, footer: null };

        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => cleanText(c) === '')) { stats.blank++; continue; }
            stats.total++;

            const date = parseDate(cell(row, 'date'));
            if (!date) {
                // No date AND no patient = a totals/footer row (many HIS exports end with one)
                const isSummary = !cleanText(cell(row, 'patientName')) && !cleanText(cell(row, 'patientCode'));
                if (isSummary) {
                    stats.summary++;
                    stats.footer = { price: parseNumber(cell(row, 'price')),
                                     patientShare: parseNumber(cell(row, 'patientShare')),
                                     entityShare: parseNumber(cell(row, 'entityShare')) };
                } else stats.badDate++;
                continue;
            }

            const price = parseNumber(cell(row, 'price'));
            const patientShare = parseNumber(cell(row, 'patientShare'));
            const entityShare = parseNumber(cell(row, 'entityShare'));
            const rawEntity = cleanText(cell(row, 'entity'));
            if (colMap.entity !== -1 && !rawEntity) stats.cashFilled++;

            if (price === 0) stats.free++;
            if (hasShares && Math.abs(price - patientShare - entityShare) > 0.01) stats.mismatch++;
            const fingerprint = row.map(cleanText).join('\u0001');
            seenRows.has(fingerprint) ? stats.exactDup++ : seenRows.add(fingerprint);

            const svc = canon.service(cell(row, 'service'));

            records.push({
                invoice:      cleanText(cell(row, 'invoice')) || '-',
                patientCode:  cleanText(cell(row, 'patientCode')) || '-',
                patientName:  cleanText(cell(row, 'patientName')) || UNKNOWN,
                specialty:    canon.specialty(cell(row, 'specialty')),
                doctor:       canon.doctor(cell(row, 'doctor')),
                service:      svc,
                serviceType:  classifyService(svc),
                price, patientShare, entityShare,
                entity:       canon.entity(colMap.entity === -1 ? '' : (rawEntity || CASH_LABEL)),
                date,
                time:         parseTime(cell(row, 'time')),
            });
        }
        return { records, stats };
    }

    // Compare our sums with the totals row of the file itself (null = file has none)
    function reconcile(records, footer) {
        if (!footer) return null;
        const sum = k => records.reduce((t, r) => t + r[k], 0);
        const computed = { price: sum('price'), patientShare: sum('patientShare'), entityShare: sum('entityShare') };
        const ok = Object.keys(computed).every(k => Math.abs(computed[k] - footer[k]) < 1);
        return { ok, computed, footer };
    }

    /* ---------- 6. Orchestration ---------- */

    // Pure(ish) function: workbook -> { records, report }.  Throws Error with .userMessage
    function parseWorkbook(workbook) {
        const best = pickBestSheet(workbook);
        if (!best || best.rows.length <= 1) throw userError('الملف فارغ أو لا يحتوي على صفوف بيانات');

        const headerCells = best.rows[best.headerIndex];
        const colMap = mapColumns(headerCells);

        const missingRequired = Object.entries(FIELDS)
            .filter(([f, cfg]) => cfg.required && colMap[f] === -1)
            .map(([, cfg]) => cfg.label);
        if (missingRequired.length) {
            throw userError('لم يتم العثور على أعمدة مطلوبة: ' + missingRequired.join('، '));
        }

        const { records, stats } = buildRecords(best.rows, best.headerIndex, colMap);
        if (!records.length) {
            throw userError(`تم العثور على ${stats.total - stats.summary} صف لكن لا يوجد بينها تاريخ صالح. تأكد من عمود «التاريخ»`);
        }

        const dates = records.map(r => r.date).sort();
        return {
            records,
            report: {
                sheet: best.name,
                imported: records.length,
                skippedBadDate: stats.badDate,
                skippedSummary: stats.summary,
                cashFilled: stats.cashFilled,
                priceMismatch: stats.mismatch,
                exactDuplicates: stats.exactDup,
                free: stats.free,
                reconcile: reconcile(records, stats.footer),
                missingOptional: Object.entries(FIELDS)
                    .filter(([f, cfg]) => !cfg.required && colMap[f] === -1).map(([, cfg]) => cfg.label),
                from: dates[0],
                to: dates[dates.length - 1],
            },
        };
    }

    function userError(message) {
        const e = new Error(message); e.userMessage = message; return e;
    }

    const nextPaint = () => new Promise(r => setTimeout(r, 30));
    const fmtNum = n => n.toLocaleString('ar-EG');

    async function importFile(file) {
        if (!file) return;
        try {
            showToast(`جاري قراءة «${file.name}» ... قد يستغرق ملف كبير بضع ثوانٍ`, 'info');
            const shortBox = document.getElementById('short-period-checkbox');
            const wantsShort = !!(shortBox && shortBox.checked);
            await nextPaint();                    // let the toast render before heavy work

            await ensureSheetJS();
            const workbook = await readWorkbook(file);
            const { records, report } = parseWorkbook(workbook);

            // Hand the data to the dashboard
            rawClinicData = records;
            shortPeriodMode = wantsShort;          // only changes after a successful import
            report.shortPeriod = wantsShort;
            if (shortBox) shortBox.checked = false;
            populateFilterOptions();
            resetFilters(true);
            closeUploadModal();

            showQualityReport(report);
            showToast(`تم استيراد ${fmtNum(report.imported)} سجل (${report.from} ← ${report.to})`, 'success');
            if (report.missingOptional.length) {
                console.info('Optional columns not found:', report.missingOptional.join(', '));
            }
        } catch (err) {
            console.error('Import failed:', err);
            if (err.message === 'SHEETJS_UNAVAILABLE') {
                showToast('تعذر تحميل مكتبة قراءة Excel. تأكد من الاتصال بالإنترنت ثم أعد المحاولة', 'error');
            } else {
                showToast(err.userMessage || 'حدث خطأ أثناء قراءة الملف، يرجى التأكد من الصيغة', 'error');
            }
        }
    }

    return { importFile, parseWorkbook, parseDate, parseTime, parseNumber, normalizeText, FIELDS };
})();

// Called by <input type="file" onchange="handleFileSelect(event)">
function handleFileSelect(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    ClinicImport.importFile(file).finally(() => { input.value = ''; });   // allow re-selecting the same file
}
