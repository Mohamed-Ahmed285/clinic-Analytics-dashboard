/* ==========================================================
   Global application state
   ========================================================== */

// Global Application State
let rawClinicData = [];
let filteredClinicData = [];
let currentTab = 'overview';

// Raw Table Pagination State
let currentPage = 1;
let pageSize = 30;
let sortColumn = 'date';
let sortDirection = 'desc';

// Chart Instances Storage
let chartInstances = {};
