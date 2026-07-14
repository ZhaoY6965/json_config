import { dom, batch, modals, batches, nextBatchId, editingBatchId, stagedData, showStatus } from './core.js';
import { addRow, updateRowNumbers, buildTable } from './table.js';
import { exitPreviewEdit } from './preview.js';

export function updatePreview() {
    let all = [];
    batches.forEach(b => all = all.concat(b.data));
    if (dom.previewEditor.style.display !== 'none') return;
    if (all.length === 0) {
        dom.previewDisplay.textContent = '// 暂存区为空，请生成数据...';
        dom.previewCount.textContent = '';
    } else {
        dom.previewDisplay.textContent = JSON.stringify(all, null, 2);
        dom.previewCount.textContent = `（共 ${all.length} 条）`;
    }
    renderBatchList();
}

export function renderBatchList() {
    const container = batch.batchList;
    if (!container) return;
    if (batches.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary); font-size:13px; padding:4px 0;">暂无批次</div>';
        return;
    }
    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    batches.forEach((b, index) => {
        const isEditing = (editingBatchId === b.id);
        html += `<li style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid var(--border-color);">
            <span style="font-size:13px;">批次 ${index+1}（${b.data.length} 条）</span>
            <span>
                <button class="btn-sm detail-batch-btn" data-id="${b.id}">详情</button>
                <button class="btn-sm edit-batch-btn" data-id="${b.id}" ${isEditing ? 'disabled' : ''}>编辑</button>
                <button class="btn-sm delete-batch-btn" data-id="${b.id}" style="margin-left:4px;">删除</button>
                ${isEditing ? '<span style="color:var(--accent-color); font-size:12px; margin-left:4px;">编辑中</span>' : ''}
            </span>
        </li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}

export function getTableConfig(count) {
    const rows = batch.tableBody.querySelectorAll('tr');
    const config = [];
    rows.forEach(tr => {
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
        showStatus('所有字段的“生成数量”必须相同！', 'error');
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
    const rows = batch.tableBody.querySelectorAll('tr');
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

export function deleteBatch(id) {
    if (editingBatchId === id) {
        showStatus('请先取消编辑再删除', 'error');
        return;
    }
    const index = batches.findIndex(b => b.id === id);
    if (index === -1) return;
    batches.splice(index, 1);
    exitPreviewEdit();
    updatePreview();
    showStatus('已删除批次', 'info');
}

export function startEditBatch(id) {
    const batchObj = batches.find(b => b.id === id);
    if (!batchObj) {
        showStatus('批次不存在', 'error');
        return;
    }
    if (editingBatchId !== null && editingBatchId !== id) {
        showStatus('请先完成当前编辑', 'error');
        return;
    }
    editingBatchId = id;
    fillTableWithConfig(batchObj.config);
    batch.previewBtn.style.display = 'none';
    batch.addRowBtn.style.display = 'none';
    batch.clearTableBtn.style.display = 'none';
    batch.updateBatchBtn.style.display = 'inline-block';
    batch.cancelEditBtn.style.display = 'inline-block';
    const index = batches.findIndex(b => b.id === id) + 1;
    showStatus(`正在编辑批次 ${index}，修改后点击“更新批次”`, 'info');
    renderBatchList();
}

function fillTableWithConfig(config) {
    const tbody = batch.tableBody;
    tbody.innerHTML = '';
    config.forEach((cfg, index) => {
        const tr = document.createElement('tr');
        const stepSelect = createStepSelect(cfg.step);
        tr.innerHTML = `
            <td class="row-index" style="text-align:center; font-weight:600; color:var(--text-secondary);">${index + 1}</td>
            <td><input type="text" class="field-input" value="${cfg.field}" placeholder="字段名"></td>
            <td><input type="text" class="prefix-input" value="${cfg.prefix}" placeholder="固定前缀"></td>
            <td><input type="text" class="start-input" value="${cfg.start !== null ? cfg.start : ''}" placeholder="起始数字，留空不递增"></td>
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
    });
    updateRowNumbers();
}

export async function updateBatch() {
    if (editingBatchId === null) {
        showStatus('没有正在编辑的批次', 'error');
        return;
    }
    const rows = batch.tableBody.querySelectorAll('tr');
    if (rows.length === 0) {
        showStatus('表格为空', 'error');
        return;
    }
    const count = await showCountModal();
    if (count === null) {
        showStatus('已取消更新', 'info');
        return;
    }
    if (count <= 0) {
        showStatus('生成数量必须大于 0', 'error');
        return;
    }
    const config = getTableConfig(count);
    if (config.length === 0) {
        showStatus('表格为空', 'error');
        return;
    }
    const data = generateDataFromConfig(config);
    if (!data) return;
    const batchIndex = batches.findIndex(b => b.id === editingBatchId);
    if (batchIndex === -1) {
        showStatus('批次不存在', 'error');
        return;
    }
    batches[batchIndex].config = config;
    batches[batchIndex].data = data;
    exitPreviewEdit();
    updatePreview();
    const index = batchIndex + 1;
    showStatus(`已更新批次 ${index}，共 ${data.length} 条`, 'success');
    exitEditMode();
}

export function cancelEdit() {
    exitEditMode();
    showStatus('已取消编辑', 'info');
}

export function exitEditMode() {
    editingBatchId = null;
    batch.previewBtn.style.display = 'inline-block';
    batch.addRowBtn.style.display = 'inline-block';
    batch.clearTableBtn.style.display = 'inline-block';
    batch.updateBatchBtn.style.display = 'none';
    batch.cancelEditBtn.style.display = 'none';
    renderBatchList();
}

export function showBatchDetail(id) {
    const batchObj = batches.find(b => b.id === id);
    if (!batchObj) {
        showStatus('批次不存在', 'error');
        return;
    }
    const config = batchObj.config;
    const globalCount = config.length > 0 ? config[0].count : 0;
    let html = `<div style="margin-bottom:8px; font-weight:600;">生成数量：${globalCount}</div>`;
    html += `<table class="batch-table" style="font-size:13px; width:100%;">
        <thead>
            <tr>
                <th>序号</th>
                <th>字段</th>
                <th>前缀</th>
                <th>起始数字</th>
                <th>步长</th>
            </tr>
        </thead>
        <tbody>`;
    config.forEach((cfg, idx) => {
        html += `<tr>
            <td>${idx + 1}</td>
            <td>${cfg.field}</td>
            <td>${cfg.prefix}</td>
            <td>${cfg.start !== null ? cfg.start : ''}</td>
            <td>${cfg.step}</td>
        </tr>`;
    });
    html += `</tbody></table>
        <div style="margin-top:12px; font-size:13px; color:var(--text-secondary);">共生成 ${batchObj.data.length} 条配置</div>`;
    modals.detailContent.innerHTML = html;
    modals.detailModal.style.display = 'flex';
}