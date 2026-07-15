import { dom, modals, showStatus } from './core.js';

// 编辑状态（模块内部管理）
let editingBatchId = null;

export function updatePreview() {
    if (dom.previewEditor.style.display !== 'none') return;
    dom.previewDisplay.textContent = '// 等待生成配置...';
    dom.previewCount.textContent = '';
}

export function getTableConfig(count) {
    const tbody = document.getElementById('batchTableBody');
    const config = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        const field = tr.querySelector('.field-input').value.trim();
        const prefix = tr.querySelector('.prefix-input').value.trim();
        const startStr = tr.querySelector('.start-input').value.trim();
        const start = startStr === '' ? null : parseInt(startStr);
        const stepSelect = tr.querySelector('.step-select');
        const step = parseFloat(stepSelect.value) || 1;
        if (field) {
            config.push({ field, prefix, start, step, count });
        }
    });
    return config;
}

export function generateDataFromConfig(config) {
    const counts = config.map(c => c.count);
    const firstCount = counts[0];
    if (counts.some(c => c !== firstCount)) {
        showStatus('所有字段的”生成数量”必须相同！', 'error');
        return null;
    }
    if (firstCount <= 0) {
        showStatus('生成数量必须大于 0', 'error');
        return null;
    }
    const total = firstCount;
    const result = [];
    for (let i = 0; i < total; i++) {
        const obj = {};
        config.forEach(cfg => {
            let value;
            if (cfg.start !== null && cfg.start !== '') {
                const num = cfg.start + i * cfg.step;
                let numStr = Number.isInteger(num) ? num.toString() : num.toFixed(2);
                value = `${cfg.prefix}${numStr}`;
            } else {
                value = cfg.prefix;
            }
            obj[cfg.field] = value;
        });
        result.push(obj);
    }
    return result;
}

function showCountModal() {
    return new Promise((resolve) => {
        modals.countModalInput.value = 1;
        modals.countModal.style.display = 'flex';
        modals.countModalInput.focus();
        const onConfirm = () => {
            const val = parseInt(modals.countModalInput.value) || 0;
            modals.countModal.style.display = 'none';
            cleanup();
            resolve(val);
        };
        const onCancel = () => {
            modals.countModal.style.display = 'none';
            cleanup();
            resolve(null);
        };
        const onKeydown = (e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        };
        const cleanup = () => {
            modals.countModalConfirm.removeEventListener('click', onConfirm);
            modals.countModalCancel.removeEventListener('click', onCancel);
            modals.countModalInput.removeEventListener('keydown', onKeydown);
        };
        modals.countModalConfirm.addEventListener('click', onConfirm);
        modals.countModalCancel.addEventListener('click', onCancel);
        modals.countModalInput.addEventListener('keydown', onKeydown);
    });
}

export async function generatePreview() {
    const tbody = document.getElementById('batchTableBody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) {
        showStatus('表格为空，请添加字段', 'error');
        return;
    }
    const count = await showCountModal();
    if (count === null) {
        showStatus('已取消预览', 'info');
        return;
    }
    if (count <= 0) {
        showStatus('生成数量必须大于 0', 'error');
        return;
    }
    const config = getTableConfig(count);
    if (config.length === 0) {
        showStatus('表格为空，请添加字段', 'error');
        return;
    }
    const data = generateDataFromConfig(config);
    if (!data) return;
    dom.previewDisplay.textContent = JSON.stringify(data, null, 2);
    dom.previewCount.textContent = `（预览 ${data.length} 条）`;
    showStatus(`预览生成 ${data.length} 条配置（未保存）`, 'success');
}

export function cancelEdit() {
    exitEditMode();
    showStatus('已取消编辑', 'info');
}

export function exitEditMode() {
    editingBatchId = null;
    const previewBtn = document.getElementById('previewBtn');
    const addRowBtn = document.getElementById('addRowBtn');
    const clearTableBtn = document.getElementById('clearTableBtn');
    const updateBatchBtn = document.getElementById('updateBatchBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (previewBtn) previewBtn.style.display = 'inline-block';
    if (addRowBtn) addRowBtn.style.display = 'inline-block';
    if (clearTableBtn) clearTableBtn.style.display = 'inline-block';
    if (updateBatchBtn) updateBatchBtn.style.display = 'none';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
}