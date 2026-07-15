import { batch, showStatus } from './core.js';
import { updatePreview } from './batch.js';

const STEP_OPTIONS = [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function createStepSelect(selectedValue = 1) {
    const select = document.createElement('select');
    select.className = 'step-select';
    STEP_OPTIONS.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        if (val === selectedValue) opt.selected = true;
        select.appendChild(opt);
    });
    return select;
}

export function updateRowNumbers() {
    const rows = batch.tableBody.querySelectorAll('tr');
    rows.forEach((tr, index) => {
        const td = tr.querySelector('.row-index');
        if (td) td.textContent = index + 1;
    });
}

export function addRow(field = '', prefix = '', start = '', step = 1) {
    const tbody = batch.tableBody;
    const tr = document.createElement('tr');
    const stepSelect = createStepSelect(step);
    tr.innerHTML = `
        <td class="row-index" style="text-align:center; font-weight:600; color:var(--text-secondary);">0</td>
        <td><input type="text" class="field-input" value="${field}" placeholder="字段名"></td>
        <td><input type="text" class="prefix-input" value="${prefix}" placeholder="固定前缀"></td>
        <td><input type="text" class="start-input" value="${start}" placeholder="起始数字，留空不递增"></td>
        <td></td>
        <td><button class="btn-sm delete-row-btn" style="background:var(--msg-error-bg); color:var(--msg-error-text); border:1px solid var(--msg-error-border);">✕</button></td>
    `;
    const td = tr.querySelectorAll('td')[4];
    td.appendChild(stepSelect);
    tr.querySelector('.delete-row-btn').addEventListener('click', function() {
        if (tbody.children.length > 1) {
            tr.remove();
            updateRowNumbers();
        } else {
            showStatus('至少保留一行', 'error');
        }
    });
    tbody.appendChild(tr);
    updateRowNumbers();
}

export function buildTable(fields) {
    const tbody = batch.tableBody;
    tbody.innerHTML = '';
    if (fields && fields.length > 0) {
        fields.forEach(f => addRow(f, '', '', 1));
    }
    // 如果没有字段传入，添加一个空行
    if (!fields || fields.length === 0) {
        addRow();
    }
}

export function clearTable() {
    if (batch.tableBody.children.length === 0) {
        showStatus('表格已为空', 'info');
        return;
    }
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) confirmModal.style.display = 'flex';
}

export function confirmClear() {
    batch.tableBody.innerHTML = '';
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) confirmModal.style.display = 'none';
    showStatus('表格已清空', 'info');
    updatePreview();
}

export function cancelClear() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) confirmModal.style.display = 'none';
    showStatus('已取消清空', 'info');
}

// 绑定确认模态框事件（自包含，不依赖外部 main.js）
(function bindConfirmModal() {
    const modal = document.getElementById('confirmModal');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    if (okBtn) okBtn.addEventListener('click', confirmClear);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelClear);
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) cancelClear();
    });
})();