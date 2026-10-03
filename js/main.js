/* ==========================================================
   App entry point
   ========================================================== */

window.onload = function() {
    // Load Demo Data
    rawClinicData = generateDemoDataset();
    filteredClinicData = [...rawClinicData];

    // Populate Filter Dropdowns
    populateFilterOptions();

    // Apply Filters and Render Dashboard Views
    applyGlobalFilters();

    // Show Welcome Toast
    showToast(`تم تحميل البيانات النموذجية (${rawClinicData.length.toLocaleString('ar-EG')} سجل) - ارفع ملفك من زر «رفع ملف»`, "info");
    initDropZone();
};
