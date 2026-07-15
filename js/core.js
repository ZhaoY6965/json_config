// 核心变量、工具函数、DOM 引用
export const dom = {
    previewDisplay: document.getElementById('previewDisplay'),
    previewEditor: document.getElementById('previewEditor'),
    previewContainer: document.getElementById('previewContainer'),
    previewCount: document.getElementById('previewCount'),
    status: document.getElementById('statusMessageLeft'),
    downloadBtn: document.getElementById('downloadBtn'),
    copyBtn: document.getElementById('copyBtn'),
    clearPreviewBtn: document.getElementById('clearPreviewBtn'),
    editPreviewBtn: document.getElementById('editPreviewBtn'),
    applyPreviewBtn: document.getElementById('applyPreviewBtn'),
};

export const batch = {
    previewBtn: document.getElementById('previewBtn'),
    addRowBtn: document.getElementById('addRowBtn'),
    clearTableBtn: document.getElementById('clearTableBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    fileInput: document.getElementById('fileInput'),
    updateBatchBtn: document.getElementById('updateBatchBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    tableBody: document.getElementById('batchTableBody'),
};

// 字段提取页 DOM 引用
export const extractor = {
    fileBtn: document.getElementById('extractFileBtn'),
    fileInput: document.getElementById('extractFileInput'),
    fileInfo: document.getElementById('extractFileInfo'),
    meta: document.getElementById('extractMeta'),
    countDisplay: document.getElementById('extractCountDisplay'),
    fieldCountDisplay: document.getElementById('extractFieldCountDisplay'),
    fieldsContainer: document.getElementById('extractFieldsContainer'),
    fieldsBody: document.getElementById('extractFieldsBody'),
    selectAllBtn: document.getElementById('extractSelectAllBtn'),
    deselectAllBtn: document.getElementById('extractDeselectAllBtn'),
    invertBtn: document.getElementById('extractInvertBtn'),
    selectionCount: document.getElementById('extractSelectionCount'),
    startIndex: document.getElementById('extractStartIndex'),
    count: document.getElementById('extractCount'),
    previewBtn: document.getElementById('extractPreviewBtn'),
    saveConfigBtn: document.getElementById('extractSaveConfigBtn'),
    saveDataBtn: document.getElementById('extractSaveDataBtn'),
};

// 模板库页 DOM 引用
export const templateLib = {
    setupFolderBtn: document.getElementById('templateLibSetupFolderBtn'),
    clearFolderBtn: document.getElementById('templateLibClearFolderBtn'),
    folderStatus: document.getElementById('templateLibFolderStatus'),
    searchInput: document.getElementById('templateLibSearchInput'),
    filterAllBtn: document.getElementById('filterAllBtn'),
    filterBrowserBtn: document.getElementById('filterBrowserBtn'),
    filterLocalBtn: document.getElementById('filterLocalBtn'),
    importBtn: document.getElementById('templateLibImportBtn'),
    fileInput: document.getElementById('templateLibFileInput'),
    exportBtn: document.getElementById('templateLibExportBtn'),
    tableBody: document.getElementById('templateLibBody'),
    empty: document.getElementById('templateLibEmpty'),
};

export const modals = {
    countModal: document.getElementById('countModal'),
    countModalInput: document.getElementById('countModalInput'),
    countModalConfirm: document.getElementById('countModalConfirmBtn'),
    countModalCancel: document.getElementById('countModalCancelBtn'),
    fileNameModal: document.getElementById('fileNameModal'),
    modalInput: document.getElementById('modalFileNameInput'),
    modalConfirm: document.getElementById('modalConfirmBtn'),
    modalCancel: document.getElementById('modalCancelBtn'),
    detailModal: document.getElementById('batchDetailModal'),
    detailContent: document.getElementById('batchDetailContent'),
    detailCloseBtn: document.getElementById('batchDetailCloseBtn'),
};

export let batches = [];
export let nextBatchId = 1;

// ES模块导入绑定是只读的，通过函数操作来读写nextBatchId
export function getNextBatchId() { return nextBatchId; }
export function allocBatchId() { return nextBatchId++; }
export function resetBatchId() { nextBatchId = 1; }

export function showStatus(msg, type = 'info') {
    const el = dom.status;
    if (!el) return;
    el.textContent = msg;
    el.className = `status-message show ${type}`;
    if (type !== 'error') setTimeout(() => { el.className = 'status-message'; }, 4000);
}

export function darkenColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max(((num >> 8) & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + [R, G, B].map(c => c.toString(16).padStart(2, '0')).join('');
}