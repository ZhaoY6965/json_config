import { batch, modals, showStatus } from './core.js';
import { buildTable, addRow } from './table.js';
import { exitEditMode, updatePreview, renderBatchList } from './batch.js';

const TEMPLATE_STORAGE_KEY = 'config_templates';

export function getTemplates() {
    try {
        return JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

export function saveTemplates(templates) {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

export function renderTemplateTable() {
    const searchKeyword = (batch.templateSearchInput?.value || '').toLowerCase();
    const templates = getTemplates();
    const filtered = templates.filter(tpl => {
        // 只显示"生成规则"类型（含无type的旧模板）
        if (tpl.type && tpl.type !== 'config') return false;
        return tpl.name.toLowerCase().includes(searchKeyword) ||
            (tpl.creator && tpl.creator.toLowerCase().includes(searchKeyword));
    });
    const tbody = batch.templateTableBody;
    const empty = batch.templateEmpty;
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = filtered.map((tpl, index) => {
        const realIndex = templates.indexOf(tpl);
        return `<tr>
            <td style="text-align:center; padding:4px 8px; border-bottom:1px solid var(--border-color);">${index + 1}</td>
            <td style="padding:4px 8px; border-bottom:1px solid var(--border-color);">${tpl.name}</td>
            <td style="padding:4px 8px; border-bottom:1px solid var(--border-color);">${tpl.creator || '-'}</td>
            <td style="padding:4px 8px; border-bottom:1px solid var(--border-color);">${tpl.createdAt || '-'}</td>
            <td style="text-align:center; padding:4px 8px; border-bottom:1px solid var(--border-color);">
                <button class="btn-sm load-template-btn" data-index="${realIndex}" style="background:var(--btn-success-bg); color:white; border:none; padding:2px 10px; border-radius:12px; cursor:pointer; margin-right:4px;">加载</button>
                <button class="btn-sm delete-template-btn" data-index="${realIndex}" style="background:var(--msg-error-bg); color:var(--msg-error-text); border:1px solid var(--msg-error-border); padding:2px 10px; border-radius:12px; cursor:pointer;">删除</button>
            </td>
        </tr>`;
    }).join('');
}

export function loadTemplateFromTable(index) {
    const templates = getTemplates();
    const tpl = templates[index];
    if (!tpl) {
        showStatus('模板不存在', 'error');
        return;
    }
    batch.tableBody.innerHTML = '';
    tpl.config.forEach(cfg => {
        addRow(cfg.field, cfg.prefix, cfg.start !== null ? cfg.start : '', cfg.step);
    });
    exitEditMode();
    showStatus(`已加载模板“${tpl.name}”`, 'success');
}

export function deleteTemplateFromTable(index) {
    if (!confirm('确定要删除此模板吗？')) return;
    const templates = getTemplates();
    templates.splice(index, 1);
    saveTemplates(templates);
    renderTemplateTable();
    showStatus('模板已删除', 'info');
}

export function showNewTemplateModal() {
    modals.newTemplateName.value = '';
    modals.newTemplateCreator.value = '';
    modals.newTemplateModal.style.display = 'flex';
    setTimeout(() => modals.newTemplateName.focus(), 100);
}

export function saveNewTemplate() {
    const name = modals.newTemplateName.value.trim();
    const creator = modals.newTemplateCreator.value.trim() || '未知';
    if (!name) {
        showStatus('请输入模板用途', 'error');
        modals.newTemplateName.focus();
        return;
    }
    const rows = batch.tableBody.querySelectorAll('tr');
    if (rows.length === 0) {
        showStatus('表格为空，无法保存模板', 'error');
        return;
    }
    const config = [];
    rows.forEach(tr => {
        const field = tr.querySelector('.field-input').value.trim();
        const prefix = tr.querySelector('.prefix-input').value.trim();
        const startStr = tr.querySelector('.start-input').value.trim();
        const start = startStr === '' ? null : parseInt(startStr);
        const stepSelect = tr.querySelector('.step-select');
        const step = parseFloat(stepSelect.value) || 1;
        if (field) {
            config.push({ field, prefix, start, step });
        }
    });
    if (config.length === 0) {
        showStatus('表格为空，无法保存模板', 'error');
        return;
    }
    const templates = getTemplates();
    if (templates.some(t => t.name === name)) {
        if (!confirm(`模板“${name}”已存在，是否覆盖？`)) return;
        const index = templates.findIndex(t => t.name === name);
        templates[index] = { name, creator, createdAt: new Date().toLocaleString(), type: 'config', config };
    } else {
        templates.push({ name, creator, createdAt: new Date().toLocaleString(), type: 'config', config });
    }
    saveTemplates(templates);
    renderTemplateTable();
    modals.newTemplateModal.style.display = 'none';
    showStatus(`模板“${name}”保存成功`, 'success');
}

export function closeNewTemplateModal() {
    modals.newTemplateModal.style.display = 'none';
}

export function exportTemplates() {
    const templates = getTemplates();
    if (templates.length === 0) {
        showStatus('没有模板可导出', 'error');
        return;
    }
    const json = JSON.stringify(templates, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showStatus('模板导出成功', 'success');
}

export function importTemplates(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                showStatus('无效的模板文件：应为数组', 'error');
                return;
            }
            if (imported.length === 0) {
                showStatus('模板文件为空', 'error');
                return;
            }
            const valid = imported.every(tpl =>
                typeof tpl === 'object' && tpl.name && (
                    Array.isArray(tpl.config) || Array.isArray(tpl.fields) || Array.isArray(tpl.data)
                )
            );
            if (!valid) {
                showStatus('模板格式无效', 'error');
                return;
            }
            const templates = getTemplates();
            let overwritten = 0;
            imported.forEach(imp => {
                const existingIndex = templates.findIndex(t => t.name === imp.name);
                if (existingIndex !== -1) {
                    templates[existingIndex] = imp;
                    overwritten++;
                } else {
                    templates.push(imp);
                }
            });
            saveTemplates(templates);
            renderTemplateTable();
            showStatus(`导入成功，新增 ${imported.length - overwritten} 个，覆盖 ${overwritten} 个同名模板`, 'success');
        } catch (err) {
            showStatus('解析失败：' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}