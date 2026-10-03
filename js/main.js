/* ==========================================================
   App entry point
   ========================================================== */

window.onload = function() {
    // Load Demo Data
    // rawClinicData = generateDemoDataset();
    rawClinicData = [];
    filteredClinicData = [...rawClinicData];

    // Populate Filter Dropdowns
    populateFilterOptions();

    // Apply Filters and Render Dashboard Views
    applyGlobalFilters();

    // Show Welcome Toast
    showToast(` ارفع ملفك من زر (رفع ملف)`, "info");
    initDropZone();
};
