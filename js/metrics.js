/* ==========================================================
   Metrics: the ONE place that defines how things are counted
   ----------------------------------------------------------
   - Services  = rows (every billed service line)
   - Visit     = unique (patient + date + specialty)
                 type: has a "كشف" row -> كشف, else has "استشارة" -> استشارة,
                 else -> إجراء فقط (not counted as a doctor visit)
   - Working day = a date with data that is not a weekly-off day
   Change a definition here and every view follows.
   ========================================================== */

const Metrics = (() => {
    const BIT = { [SERVICE_TYPES.PROCEDURE]: 1, [SERVICE_TYPES.CONSULT]: 2, [SERVICE_TYPES.VISIT]: 4 };

    function visitKey(r) {
        const who = r.patientCode && r.patientCode !== '-' ? r.patientCode : r.patientName;
        return `${who}|${r.date}|${r.specialty}`;
    }

    // -> { paid: كشف visits, consult: استشارة-only visits, procedureOnly, total: paid + consult }
    function countVisits(rows) {
        const visits = new Map();
        for (const r of rows) {
            const k = visitKey(r);
            visits.set(k, (visits.get(k) || 0) | (BIT[r.serviceType] || 1));
        }
        let paid = 0, consult = 0, procedureOnly = 0;
        for (const v of visits.values()) {
            if (v & 4) paid++; else if (v & 2) consult++; else procedureOnly++;
        }
        return { paid, consult, procedureOnly, total: paid + consult };
    }

    function isWeeklyOff(isoDate) {
        return WEEKLY_OFF_DAYS.includes(new Date(isoDate + 'T00:00:00Z').getUTCDay());
    }

    // Same denominator for every specialty: hospital working days in the chosen period
    function workingDays(rows, month = 'ALL') {
        const set = new Set();
        for (const r of rows) {
            if ((month === 'ALL' || r.date.startsWith(month)) && !isWeeklyOff(r.date)) set.add(r.date);
        }
        return { count: set.size, set };
    }

    // Paid كشف visits per specialty, averaged over the hospital's working days
    function specialtyWorkload(rows, days) {
        const map = new Map();
        for (const r of rows) {
            if (!map.has(r.specialty)) map.set(r.specialty, { specialty: r.specialty, keys: new Set(), dates: new Set() });
            if (r.serviceType === SERVICE_TYPES.VISIT) {
                const s = map.get(r.specialty);
                s.keys.add(visitKey(r));
                if (days.set.has(r.date)) s.dates.add(r.date);
            }
        }
        return [...map.values()].map(s => ({
            specialty: s.specialty,
            visits: s.keys.size,
            activeDays: s.dates.size,
            avgPerDay: days.count ? s.keys.size / days.count : 0,
        })).sort((a, b) => b.avgPerDay - a.avgPerDay || a.specialty.localeCompare(b.specialty, 'ar'));
    }

    return { countVisits, workingDays, specialtyWorkload, visitKey };
})();
