// ============================================================
// 入口文件：初始化、全局事件绑定
// ============================================================

import { dom, batch, modals, showStatus } from './core.js';
import { initTheme } from './theme.js';
import { addRow, clearTable, confirmClear, cancelClear, buildTable } from './table.js';
import {
    generatePreview,
    deleteBatch,
    startEditBatch,
    updateBatch,
    cancelEdit,
    showBatchDetail,
    updatePreview,
    renderBatchList,
    exitEditMode
} from './batch.js';
import {
    renderTemplateTable,
    loadTemplateFromTable,
    deleteTemplateFromTable,
    showNewTemplateModal,
    saveNewTemplate,
    closeNewTemplateModal,
    exportTemplates,
    importTemplates
} from './template.js';
import { renderQuickEditButtons, addQuickEditText } from './quickEdit.js';
import { handleImport, initImportPanel } from './import.js';
import { initExtractorPanel } from './extractor.js';
import { initTemplateLibPanel, loadAllTemplates } from './templateLib.js';
import {
    enablePreviewEdit,
    applyPreviewEdit,
    getCurrentContent,
    showFileNameModal,
    downloadFile,
    copyToClipboard
} from './preview.js';

// ============================================================
// 初始化
// ============================================================
function init() {
    initTheme();
    buildTable([]);
    updatePreview();
    renderTemplateTable();
    renderQuickEditButtons();
    initImportPanel();
    initExtractorPanel();
    initTemplateLibPanel();
    bindEvents();
    bindTemplateLibEvents();
    console.log('✅ 设备配置生成器启动成功（模块化）');
}

// 切换到指定 Tab（供模板库加载时跳转）
function switchTab(targetId) {
    document.querySelectorAll('.workbench-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.workbench-panel').forEach(function(p) { p.classList.remove('active'); });
    var tabBtn = document.querySelector('.workbench-tab[data-target="' + targetId + '"]');
    var panel = document.getElementById(targetId);
    if (tabBtn) tabBtn.classList.add('active');
    if (panel) panel.classList.add('active');
}

// 模板库自定义事件监听（加载模板时跳转对应页面）
function bindTemplateLibEvents() {
    document.addEventListener('template-lib-load-config', function(e) {
        var config = e.detail && e.detail.config;
        if (config && Array.isArray(config)) {
            batch.tableBody.innerHTML = '';
            config.forEach(function(cfg) {
                addRow(cfg.field, cfg.prefix, cfg.start !== null ? cfg.start : '', cfg.step);
            });
            exitEditMode();
        }
        switchTab('tab-generate');
    });

    document.addEventListener('template-lib-load-extract', function(e) {
        // 切换到字段提取页，后续可扩展自动填充逻辑
        switchTab('tab-extract');
    });

    document.addEventListener('template-lib-load-data', function(e) {
        // 数据模板直接加载到预览，不切换页面
        switchTab('tab-generate');
    });
}

// ============================================================
// 事件绑定
// ============================================================
function bindEvents() {
    // 表格操作
    batch.addRowBtn?.addEventListener('click', () => addRow());
    batch.clearTableBtn?.addEventListener('click', clearTable);
    modals.confirmOkBtn?.addEventListener('click', confirmClear);
    modals.confirmCancelBtn?.addEventListener('click', cancelClear);
    modals.confirmModal?.addEventListener('click', (e) => {
        if (e.target === modals.confirmModal) cancelClear();
    });

    // 生成预览
    batch.previewBtn?.addEventListener('click', generatePreview);

    // 预览编辑
    dom.editPreviewBtn?.addEventListener('click', enablePreviewEdit);
    dom.applyPreviewBtn?.addEventListener('click', applyPreviewEdit);

    // 导入数据（原有功能）
    batch.importDataBtn?.addEventListener('click', () => batch.fileInput.click());
    batch.fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImport(e.target.files[0]);
            e.target.value = '';
        }
    });

    // 历史批次（事件委托）
    batch.batchList?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('detail-batch-btn')) {
            const id = parseInt(target.dataset.id);
            if (!isNaN(id)) showBatchDetail(id);
            e.preventDefault();
        }
        if (target.classList.contains('edit-batch-btn')) {
            const id = parseInt(target.dataset.id);
            if (!isNaN(id)) startEditBatch(id);
            e.preventDefault();
        }
        if (target.classList.contains('delete-batch-btn')) {
            const id = parseInt(target.dataset.id);
            if (!isNaN(id)) deleteBatch(id);
            e.preventDefault();
        }
    });

    // 更新/取消编辑
    batch.updateBatchBtn?.addEventListener('click', updateBatch);
    batch.cancelEditBtn?.addEventListener('click', cancelEdit);

    // 下载/复制
    dom.downloadBtn?.addEventListener('click', async () => {
        const content = getCurrentContent();
        if (!content || content === '// 暂存区为空，请生成数据...' || content.startsWith('❌')) {
            showStatus('没有可下载的内容', 'error');
            return;
        }
        const fn = await showFileNameModal('config.json');
        if (fn === null) {
            showStatus('已取消下载', 'info');
            return;
        }
        downloadFile(content, fn);
        showStatus(`文件 "${fn}" 开始下载`, 'success');
    });

    dom.copyBtn?.addEventListener('click', async () => {
        const content = getCurrentContent();
        if (!content || content === '// 暂存区为空，请生成数据...' || content.startsWith('❌')) {
            showStatus('没有可复制的内容', 'error');
            return;
        }
        try {
            await copyToClipboard(content);
            showStatus('已复制到剪贴板', 'success');
        } catch (e) {
            showStatus('复制失败: ' + e.message, 'error');
        }
    });

    // 数量模态框背景关闭
    modals.countModal?.addEventListener('click', (e) => {
        if (e.target === modals.countModal) {
            modals.countModal.style.display = 'none';
            showStatus('已取消生成', 'info');
        }
    });

    // 批次详情关闭
    modals.detailCloseBtn?.addEventListener('click', () => {
        modals.detailModal.style.display = 'none';
    });
    modals.detailModal?.addEventListener('click', (e) => {
        if (e.target === modals.detailModal) modals.detailModal.style.display = 'none';
    });

    // 模板管理
    batch.addTemplateBtn?.addEventListener('click', showNewTemplateModal);
    modals.newTemplateCancel?.addEventListener('click', closeNewTemplateModal);
    modals.newTemplateConfirm?.addEventListener('click', saveNewTemplate);
    modals.newTemplateModal?.addEventListener('click', (e) => {
        if (e.target === modals.newTemplateModal) closeNewTemplateModal();
    });
    modals.newTemplateName?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            modals.newTemplateCreator.focus();
        }
    });
    modals.newTemplateCreator?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveNewTemplate();
        }
    });

    batch.exportTemplateBtn?.addEventListener('click', exportTemplates);
    batch.importTemplateBtn?.addEventListener('click', () => {
        batch.templateFileInput.click();
    });
    batch.templateFileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importTemplates(e.target.files[0]);
            e.target.value = '';
        }
    });
    batch.templateSearchInput?.addEventListener('input', renderTemplateTable);

    // 模板列表事件委托
    batch.templateTableBody?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('load-template-btn')) {
            const idx = parseInt(target.dataset.index);
            if (!isNaN(idx)) loadTemplateFromTable(idx);
            e.preventDefault();
        }
        if (target.classList.contains('delete-template-btn')) {
            const idx = parseInt(target.dataset.index);
            if (!isNaN(idx)) deleteTemplateFromTable(idx);
            e.preventDefault();
        }
    });

    // 快捷编辑
    document.getElementById('addQuickEditBtn')?.addEventListener('click', addQuickEditText);
    document.getElementById('quickEditInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addQuickEditText();
        }
    });
}

// ============================================================
// 启动
// ============================================================
init();