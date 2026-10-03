/* ==========================================================
   Demo dataset generator (first load / "reload demo" button)
   ========================================================== */

// Sample Arabic Physicians List by Specialty
const DEMO_SPECIALTIES_DOCTORS = {
    "الجلدية والتناسلية": ["د. حمدي عبد الدايم", "د. هاجر عبد الغني", "د. مروة الشريف"],
    "جراحة العظام": ["د. أحمد العمروسي", "د. عصام النجار", "د. طارق جلال"],
    "الباطنية العامة": ["د. أيمن طاهر", "د. سارة محمود", "د. خالد السعيد"],
    "أمراض العيون (رمد)": ["د. شريف زكي", "د. نادية عبد الرازق", "د. رانيا فهمي"],
    "النساء والتوليد": ["د. هناء السعيد", "د. هالة عبد الفتاح", "د. نجلاء يوسف"],
    "أنف وأذن وحنجرة": ["د. وائل سلامة", "د. كريم جودة"],
    "طب الأطفال": ["د. إيمان حسين", "د. زياد الشامي"]
};

const DEMO_SERVICES = {
    "الجلدية والتناسلية": [
        { name: "كشف استشاري جلدية", price: 450 },
        { name: "جلسة ليزر نضارة", price: 800 },
        { name: "كي بالتبريد", price: 350 }
    ],
    "جراحة العظام": [
        { name: "كشف أخصائي عظام", price: 350 },
        { name: "حقن مفصل الركبة", price: 900 },
        { name: "جبيرة جبس صغيرة", price: 400 }
    ],
    "الباطنية العامة": [
        { name: "كشف استشاري باطنة", price: 400 },
        { name: "رسم قلب ECG", price: 200 },
        { name: "سونار بطن وحوض", price: 600 }
    ],
    "أمراض العيون (رمد)": [
        { name: "فحص قياس نظر ونظارة", price: 250 },
        { name: "كشف رمد شامل", price: 400 },
        { name: "قياس ضغط العين", price: 300 }
    ],
    "النساء والتوليد": [
        { name: "متابعة حمل وسونار", price: 500 },
        { name: "كشف استشاري نساء", price: 450 }
    ],
    "أنف وأذن وحنجرة": [
        { name: "تنظيف أذن بالماء", price: 250 },
        { name: "منظار أنف وأذن", price: 450 }
    ],
    "طب الأطفال": [
        { name: "كشف أطفال واستشارات نمو", price: 300 }
    ]
};

const DEMO_ENTITIES = [
    "كاش (نقدي)",
    "نكست كير (NextCare)",
    "جلوب ميد (GlobeMed)",
    "ميتلايف (MetLife)",
    "أكسا (AXA)",
    "وادي النيل للتأمين",
    "نقابة المهندسين"
];

function generateDemoDataset() {
    const records = [];
    const patientPool = [];
    
    // Create a pool of 800 distinct patients
    for (let i = 1; i <= 850; i++) {
        const code = `P-${10000 + i}`;
        const firstNames = ["أحمد", "محمود", "محمد", "سارة", "إيمان", "منى", "خالد", "عمر", "فاطمة", "علي", "مصطفى", "ريم", "هدى", "طارق", "ياسمين"];
        const lastNames = ["العوضي", "الشريف", "السيد", "عبد الله", "منصور", "فهمي", "حسن", "إبراهيم", "راضي", "سالم"];
        const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
        patientPool.push({ code, name });
    }

    const startDate = new Date(2026, 6, 1); // July 1, 2026
    const endDate = new Date(2026, 8, 30);  // September 30, 2026

    let invoiceCounter = 98000;

    // Generate ~1400 transactions
    for (let i = 0; i < 1420; i++) {
        // Select specialty
        const specialties = Object.keys(DEMO_SPECIALTIES_DOCTORS);
        const specialty = specialties[i % specialties.length];

        // Select doctor
        const doctors = DEMO_SPECIALTIES_DOCTORS[specialty];
        const doctor = doctors[i % doctors.length];

        // Select service
        const services = DEMO_SERVICES[specialty];
        const serviceObj = services[i % services.length];

        // Select patient (simulating re-visits)
        const patient = patientPool[Math.floor(Math.random() * patientPool.length)];

        // Select entity
        const entity = DEMO_ENTITIES[Math.floor(Math.random() * DEMO_ENTITIES.length)];

        // Price calculation
        const price = serviceObj.price;
        let patientShare = 0;
        let entityShare = 0;

        if (entity.includes("كاش")) {
            patientShare = price;
            entityShare = 0;
        } else {
            // Insurance co-pay (e.g. 10% or 20% patient share)
            patientShare = Math.round(price * (Math.random() > 0.5 ? 0.15 : 0.20));
            entityShare = price - patientShare;
        }

        // Random Date between July and September 2026
        const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const yyyy = randomTime.getFullYear();
        const mm = String(randomTime.getMonth() + 1).padStart(2, '0');
        const dd = String(randomTime.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        // Random Operating Hour (08:00 to 21:00)
        const hour = 8 + Math.floor(Math.random() * 14);
        const minute = (Math.floor(Math.random() * 4) * 15);
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        invoiceCounter++;

        records.push({
            invoice: `INV-${invoiceCounter}`,
            patientCode: patient.code,
            patientName: patient.name,
            specialty: specialty,
            doctor: doctor,
            service: serviceObj.name,
            price: price,
            patientShare: patientShare,
            entityShare: entityShare,
            entity: entity,
            date: dateStr,
            time: timeStr
        });
    }

    return records;
}


function reloadDemoData() {
    rawClinicData = [];
    populateFilterOptions();
    resetFilters();
    showToast("تم مسح الداتا ارفع ملفك من زر (رفع ملف)", "info");
}
