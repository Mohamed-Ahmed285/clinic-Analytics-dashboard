/* ==========================================================
   CSV export / print
   ========================================================== */

function exportRawCSV() {
    if (!filteredClinicData || filteredClinicData.length === 0) {
        showToast("لا توجد بيانات للتصدير", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM for Arabic support
    csvContent += "رقم الفاتورة,كود المريض,اسم المريض,التخصص,الطبيب الطالب,الخدمة,سعر الخدمة,حصة المريض,حصة الجهة,الجهة,التاريخ,الوقت\n";

    filteredClinicData.forEach(r => {
        csvContent += `"${r.invoice}","${r.patientCode}","${r.patientName}","${r.specialty}","${r.doctor}","${r.service}",${r.price},${r.patientShare},${r.entityShare},"${r.entity}","${r.date}","${r.time}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_بيانات_العيادات_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("تم تصدير ملف CSV بنجاح", "success");
}

function exportCurrentView() {
    window.print();
}
