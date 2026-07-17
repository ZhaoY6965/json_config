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


export function showStatus(msg, type = 'info') {
    // 创建或获取顶部右侧 toast 容器
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;display:flex;flex-direction:column;gap:6px;pointer-events:none;max-width:360px;';
        document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    var bgColor = type === 'error' ? 'var(--msg-error-bg)' : type === 'success' ? 'var(--msg-success-bg)' : 'var(--msg-info-bg)';
    var textColor = type === 'error' ? 'var(--msg-error-text)' : type === 'success' ? 'var(--msg-success-text)' : 'var(--msg-info-text)';
    var borderColor = type === 'error' ? 'var(--msg-error-border)' : type === 'success' ? 'var(--msg-success-border)' : 'var(--msg-info-border)';
    toast.style.cssText = 'background:' + bgColor + ';color:' + textColor + ';border:1px solid ' + borderColor + ';border-radius:6px;padding:8px 16px;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:auto;transition:opacity 0.3s;';
    toast.textContent = msg;

    container.appendChild(toast);

    var timeout = setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    }, type === 'error' ? 5000 : 2500);

    toast.addEventListener('click', function() {
        clearTimeout(timeout);
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
}

