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

// Rows passing every filter EXCEPT service type (feeds the workload card)
let workloadData = [];

// ---- Shared configuration ----
const SERVICE_TYPES = { VISIT: 'كشف', CONSULT: 'استشارة', PROCEDURE: 'إجراء' };
const WEEKLY_OFF_DAYS = [5];               // 0=Sunday ... 5=Friday
const WORKLOAD_LOW_ACTIVITY_RATIO = 0.7;   // specialty flagged if it worked < 70% of working days
