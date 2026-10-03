/* ==========================================================
   Upload modal open/close
   ========================================================== */

function openUploadModal() {
    document.getElementById('upload-modal').classList.remove('hidden');
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
}

function initDropZone() {
    const zone = document.getElementById('drop-zone');
    if (!zone) return;
    const highlight = on => zone.classList.toggle('bg-clinic-100', on);
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); highlight(true); }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); highlight(false); }));
    zone.addEventListener('drop', e => ClinicImport.importFile(e.dataTransfer.files[0]));
}
