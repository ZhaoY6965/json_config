// ============================================================
// 入口文件：初始化、全局事件绑定
// ============================================================

import { dom, batch, modals, showStatus } from './core.js';
import { addRow, clearTable, buildTable } from './table.js';
import {
    generatePreview,
    cancelEdit,
    updatePreview,
    exitEditMode
} from './batch.js';
import { renderQuickEditButtons, addQuickEditText } from './quickEdit.js';
import { dialog } from './dialog.js';
import { handleImport, initImportPanel } from './import.js';
import { initExtractorPanel } from './extractor.js';
import { initTemplateLibPanel } from './templateLib.js';
import {
    enablePreviewEdit,
    applyPreviewEdit,
    clearPreview,
    setPreview,
    getCurrentContent,
    showFileNameModal,
    downloadFile,
    copyToClipboard
} from './preview.js';
import { initConfigProject, getCurrentConfig, updateCurrentData, getFkOptions, autoSave } from './configProject.js';
import { FieldType, DataShape, getForeignKeyFields } from './configSchema.js';
import { initCardDesigner, onConfigSelected as onCardConfigSelected } from './cardDesigner.js';
import { initWizardPanel } from './projectWizard.js';

// ============================================================
// 初始化
// ============================================================
function init() {
    // 每步独立执行：任一面板初始化失败也不会拖垮其他功能（尤其保证 bindEvents 一定执行，
    // 导入/下载/预览等核心按钮才能正常绑定）。
    var steps = [
        ['buildTable', function () { buildTable([]); }],
        ['updatePreview', updatePreview],
        ['renderQuickEditButtons', renderQuickEditButtons],
        ['initImportPanel', initImportPanel],
        ['initExtractorPanel', initExtractorPanel],
        ['initTemplateLibPanel', initTemplateLibPanel],
        ['initConfigProject', initConfigProject],
        ['initCardDesigner', initCardDesigner],
        ['initWizardPanel', initWizardPanel],
        ['bindEvents', bindEvents],
        ['bindTemplateLibEvents', bindTemplateLibEvents],
        ['bindConfigEvents', bindConfigEvents]
    ];
    var failed = [];
    steps.forEach(function (s) {
        try {
            s[1]();
        } catch (err) {
            failed.push(s[0]);
            console.error('[INIT-FAIL] ' + s[0] + ':', err);
        }
    });
    if (failed.length) {
        console.warn('[INIT] 以下初始化步骤失败：', failed.join(', '));
        showInitErrorBanner(failed);
    } else {
        console.log('✅ 设备配置生成器启动成功（模块化）');
    }
}

// 初始化失败时在页面顶部显示醒目横幅（无需打开控制台即可看到是哪个模块出错）
function showInitErrorBanner(failed) {
    try {
        var bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;'
            + 'background:#d9534f;color:#fff;padding:8px 14px;font-size:13px;'
            + 'font-family:system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.25);';
        bar.textContent = '部分功能初始化失败：' + failed.join('、') + '（其余功能已尽量保持可用；按 F12 查看 [INIT-FAIL] 详情）';
        var close = document.createElement('span');
        close.textContent = ' ✕';
        close.style.cssText = 'cursor:pointer;float:right;font-weight:bold;';
        close.onclick = function () { bar.remove(); };
        bar.appendChild(close);
        document.body.appendChild(bar);
    } catch (e) { /* ignore */ }
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
        switchTab('tab-extract-replace');
    });

    document.addEventListener('template-lib-load-extract', function(e) {
        // 切换到字段提取页，后续可扩展自动填充逻辑
        switchTab('tab-extract-replace');
    });

    document.addEventListener('template-lib-load-data', function(e) {
        var data = e.detail && e.detail.data;
        if (data && Array.isArray(data)) {
            setPreview(data, '（模板数据，共 ' + data.length + ' 条）');
        }
        switchTab('tab-extract-replace');
    });
}

// ============================================================
// 事件绑定
// ============================================================
function bindEvents() {
    // 表格操作
    batch.addRowBtn?.addEventListener('click', () => addRow());
    batch.clearTableBtn?.addEventListener('click', clearTable);

    // 生成预览
    batch.previewBtn?.addEventListener('click', generatePreview);

    // 预览编辑
    dom.editPreviewBtn?.addEventListener('click', enablePreviewEdit);
    dom.applyPreviewBtn?.addEventListener('click', applyPreviewEdit);

    // 清空预览
    dom.clearPreviewBtn?.addEventListener('click', clearPreview);

    // 导入数据（原有功能）
    batch.importDataBtn?.addEventListener('click', () => batch.fileInput.click());
    batch.fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImport(e.target.files[0]);
            e.target.value = '';
        }
    });

    // 取消编辑
    batch.cancelEditBtn?.addEventListener('click', cancelEdit);

    // 下载/复制
    dom.downloadBtn?.addEventListener('click', async () => {
        const content = getCurrentContent();
        if (!content || content === '// 暂存区为空，请生成数据...' || content === '// 等待生成配置...' || content.startsWith('❌')) {
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
        if (!content || content === '// 暂存区为空，请生成数据...' || content === '// 等待生成配置...' || content.startsWith('❌')) {
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

    // 快捷编辑
    document.getElementById('addQuickEditBtn')?.addEventListener('click', addQuickEditText);
    document.getElementById('quickEditInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addQuickEditText();
        }
    });

    // Tab 点击切换
    document.querySelectorAll('.workbench-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.target);
        });
    });
}

// ============================================================
// 配置项目 - Schema感知编辑器（虚拟滚动）
// ============================================================

// 编辑器状态
let editorSchema = null;
let editorKey = null;
let editorData = [];        // 完整数据数组（内存中）
let editorDirty = false;    // 是否有未保存修改

// 虚拟滚动参数
const V_ROW_HEIGHT = 30;    // 每行高度(px)
const V_BUFFER = 30;        // 上下各缓冲行数
let vScrollHandler = null;  // 滚动事件引用（切换时移除）

function bindConfigEvents() {
    document.addEventListener('config-selected', function(e) {
        var d = e.detail;
        onCardConfigSelected(d);
        if (!d || !d.schema) return;
        buildConfigEditor(d.data, d.schema, d.key);
        var saveBtn = document.getElementById('saveConfigBtn');
        var saveAllBtn = document.getElementById('saveAllConfigBtn');
        var refreshBtn = document.getElementById('refreshConfigBtn');
        if (saveBtn) saveBtn.style.display = '';
        if (saveAllBtn) saveAllBtn.style.display = '';
        if (refreshBtn) refreshBtn.style.display = '';
    });

    document.addEventListener('config-project-loaded', function() {
        switchTab('tab-config-project');
    });

    document.getElementById('configAddRowBtn')?.addEventListener('click', configAddRow);
    document.getElementById('configDeleteRowBtn')?.addEventListener('click', configDeleteRows);
    document.getElementById('configPreviewBtn')?.addEventListener('click', configPreviewJson);
}

// 根据字段类型返回建议列宽(px)，用于固定布局 + 横向滚动

function buildConfigEditor(data, schema, key) {
    editorSchema = schema;
    editorKey = key;
    editorDirty = false;

    var section = document.getElementById('configEditorSection');
    var title = document.getElementById('configEditorTitle');
    var thead = document.getElementById('configEditTableHead');
    var hint = document.getElementById('configEditorHint');

    if (!section || !schema.fields || schema.fields.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }

    section.style.display = '';
    title.textContent = schema.label + ' 编辑';

    // 数据标准化
    editorData = Array.isArray(data) ? data.slice() : [Object.assign({}, data)];

    // 构建表头
    var headHtml = '<tr><th class="row-num"><input type="checkbox" class="row-check" id="configCheckAll"></th><th class="row-num">#</th>';
    for (var i = 0; i < schema.fields.length; i++) {
        var f = schema.fields[i];
        var title_attr = f.hint ? ' title="' + f.hint + '"' : '';
        headHtml += '<th' + title_attr + '>' + f.label + '</th>';
    }
    headHtml += '</tr>';
    thead.innerHTML = headHtml;

    // 全选checkbox
    var checkAll = document.getElementById('configCheckAll');
    if (checkAll) {
        checkAll.checked = false;
        checkAll.addEventListener('change', function(e) {
            var checked = e.target.checked;
            document.querySelectorAll('#configEditTableBody .row-check').forEach(function(cb) { cb.checked = checked; });
        });
    }

    // 提示
    var fkFields = getForeignKeyFields(key);
    var hints = [];
    if (schema.shape === DataShape.OBJECT) hints.push('单对象配置，直接编辑字段值');
    if (fkFields.length > 0) hints.push(fkFields.length + '个外键字段(下拉选择)');
    if (schema.complex) hints.push('含复杂嵌套结构，建议用预览编辑模式修改');
    hints.push('共 ' + editorData.length + ' 条记录');
    hint.textContent = hints.join(' | ');

    // 初始化虚拟滚动
    initVirtualScroll();
}

function initVirtualScroll() {
    var wrapper = document.getElementById('configTableWrapper');
    var tbody = document.getElementById('configEditTableBody');
    if (!wrapper || !tbody) return;

    // 移除旧的滚动监听
    if (vScrollHandler) {
        wrapper.removeEventListener('scroll', vScrollHandler);
        vScrollHandler = null;
    }

    tbody.innerHTML = '';
    renderVisibleRows();

    // 绑定滚动
    vScrollHandler = function() { renderVisibleRows(); };
    wrapper.addEventListener('scroll', vScrollHandler);
}

function renderVisibleRows() {
    var wrapper = document.getElementById('configTableWrapper');
    var tbody = document.getElementById('configEditTableBody');
    if (!wrapper || !tbody || !editorSchema) return;

    var total = editorData.length;
    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="' + (editorSchema.fields.length + 2) + '" style="text-align:center;color:var(--text-secondary);padding:16px;">暂无数据，点击"添加行"新增</td></tr>';
        return;
    }

    var scrollTop = wrapper.scrollTop;
    var viewHeight = wrapper.clientHeight;

    // 计算可见范围
    var startIdx = Math.max(0, Math.floor(scrollTop / V_ROW_HEIGHT) - V_BUFFER);
    var endIdx = Math.min(total - 1, Math.ceil((scrollTop + viewHeight) / V_ROW_HEIGHT) + V_BUFFER);

    // 清空并重建
    tbody.innerHTML = '';

    // 顶部占位
    if (startIdx > 0) {
        var topSpacer = document.createElement('tr');
        topSpacer.className = 'v-spacer';
        var tdTop = document.createElement('td');
        tdTop.colSpan = editorSchema.fields.length + 2;
        tdTop.style.height = (startIdx * V_ROW_HEIGHT) + 'px';
        tdTop.style.padding = '0';
        tdTop.style.border = 'none';
        topSpacer.appendChild(tdTop);
        tbody.appendChild(topSpacer);
    }

    // 渲染可见行
    var frag = document.createDocumentFragment();
    for (var i = startIdx; i <= endIdx; i++) {
        frag.appendChild(buildRow(editorData[i], i + 1, editorSchema));
    }
    tbody.appendChild(frag);

    // 底部占位
    if (endIdx < total - 1) {
        var bottomSpacer = document.createElement('tr');
        bottomSpacer.className = 'v-spacer';
        var tdBot = document.createElement('td');
        tdBot.colSpan = editorSchema.fields.length + 2;
        tdBot.style.height = ((total - 1 - endIdx) * V_ROW_HEIGHT) + 'px';
        tdBot.style.padding = '0';
        tdBot.style.border = 'none';
        bottomSpacer.appendChild(tdBot);
        tbody.appendChild(bottomSpacer);
    }
}

function buildRow(item, rowNum, schema) {
    var tr = document.createElement('tr');
    tr.style.height = V_ROW_HEIGHT + 'px';
    tr.dataset.rowIndex = rowNum - 1;

    // checkbox
    var tdCheck = document.createElement('td');
    tdCheck.className = 'row-num';
    tdCheck.innerHTML = '<input type="checkbox" class="row-check">';
    tr.appendChild(tdCheck);

    // 行号
    var tdNum = document.createElement('td');
    tdNum.className = 'row-num';
    tdNum.textContent = rowNum;
    tr.appendChild(tdNum);

    // 字段列
    for (var i = 0; i < schema.fields.length; i++) {
        var f = schema.fields[i];
        var td = document.createElement('td');
        var val = item ? (item[f.key] !== undefined ? item[f.key] : (f.default !== undefined ? f.default : '')) : '';

        // 对齐：纯文字name左对齐，数值居中并缩窄，其他居中
        if (f.key === 'name') {
            td.style.textAlign = 'left';
        } else {
            td.style.textAlign = 'center';
        }
        if (f.type === FieldType.INT || f.type === FieldType.FLOAT) {
            td.classList.add('td-narrow');
        }

        if (f.fk) {
            var select = document.createElement('select');
            select.className = 'fk-select';
            select.dataset.fieldKey = f.key;
            select.dataset.rowIndex = rowNum - 1;
            var options = getFkOptions(f.fk.target, f.fk.field, f.fk.display);
            var optHtml = '<option value="">--</option>';
            for (var j = 0; j < options.length; j++) {
                var sel = options[j].value === String(val) ? ' selected' : '';
                optHtml += '<option value="' + options[j].value + '"' + sel + '>' + options[j].label + '</option>';
            }
            select.innerHTML = optHtml;
            select.addEventListener('change', onCellChange);
            td.appendChild(select);
        } else if (f.options) {
            var select2 = document.createElement('select');
            select2.dataset.fieldKey = f.key;
            select2.dataset.rowIndex = rowNum - 1;
            var optHtml2 = '<option value="">--</option>';
            for (var k = 0; k < f.options.length; k++) {
                var sel2 = f.options[k] === String(val) ? ' selected' : '';
                optHtml2 += '<option value="' + f.options[k] + '"' + sel2 + '>' + f.options[k] + '</option>';
            }
            select2.innerHTML = optHtml2;
            select2.addEventListener('change', onCellChange);
            td.appendChild(select2);
        } else if (f.type === FieldType.BOOL) {
            var boolSel = document.createElement('select');
            boolSel.dataset.fieldKey = f.key;
            boolSel.dataset.rowIndex = rowNum - 1;
            boolSel.innerHTML = '<option value="true"' + (val === true ? ' selected' : '') + '>true</option>' +
                '<option value="false"' + (val === false || val === '' ? ' selected' : '') + '>false</option>';
            boolSel.addEventListener('change', onCellChange);
            td.appendChild(boolSel);
        } else if (f.type === FieldType.HEX) {
            var wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '4px';
            var swatch = document.createElement('span');
            swatch.className = 'hex-swatch';
            swatch.style.background = val || '#000';
            var inp = document.createElement('input');
            inp.type = 'text';
            inp.dataset.fieldKey = f.key;
            inp.dataset.rowIndex = rowNum - 1;
            inp.value = val;
            inp.addEventListener('input', onHexInput);
            wrap.appendChild(swatch);
            wrap.appendChild(inp);
            td.appendChild(wrap);
        } else if (f.type === FieldType.OBJECT || f.type === FieldType.ARRAY) {
            var summary = typeof val === 'object' ? JSON.stringify(val) : String(val);
            if (summary.length > 40) summary = summary.substring(0, 37) + '...';
            var inp2 = document.createElement('input');
            inp2.type = 'text';
            inp2.dataset.fieldKey = f.key;
            inp2.dataset.rowIndex = rowNum - 1;
            inp2.dataset.complexType = f.type;
            inp2.value = summary;
            inp2.title = typeof val === 'object' ? JSON.stringify(val, null, 2) : '';
            inp2.readOnly = true;
            inp2.style.cursor = 'pointer';
            inp2.style.fontSize = '11px';
            inp2.addEventListener('click', onComplexFieldClick);
            td.appendChild(inp2);
        } else {
            var inp3 = document.createElement('input');
            inp3.type = (f.type === FieldType.INT || f.type === FieldType.FLOAT) ? 'number' : 'text';
            inp3.dataset.fieldKey = f.key;
            inp3.dataset.rowIndex = rowNum - 1;
            inp3.value = val;
            if (f.type === FieldType.INT) inp3.step = '1';
            if (f.type === FieldType.FLOAT) inp3.step = 'any';
            inp3.addEventListener('input', onCellChange);
            td.appendChild(inp3);
        }

        tr.appendChild(td);
    }
    return tr;
}

function onCellChange(e) {
    var el = e.target;
    var rowIdx = parseInt(el.dataset.rowIndex);
    var fieldKey = el.dataset.fieldKey;
    if (isNaN(rowIdx) || !fieldKey || !editorSchema) return;

    // 回写到内存数据
    var field = editorSchema.fields.find(function(f) { return f.key === fieldKey; });
    if (!field) return;
    var raw = el.value;
    if (field.type === FieldType.INT) raw = raw === '' ? 0 : parseInt(raw, 10);
    else if (field.type === FieldType.FLOAT) raw = raw === '' ? 0 : parseFloat(raw);
    else if (field.type === FieldType.BOOL) raw = raw === 'true';

    if (!editorData[rowIdx]) editorData[rowIdx] = {};
    editorData[rowIdx][fieldKey] = raw;
    markDirty();
    syncAutoSave();
}

function onHexInput(e) {
    var sw = e.target.parentElement.querySelector('.hex-swatch');
    if (sw) sw.style.background = e.target.value;
    onCellChange(e);
}

async function onComplexFieldClick(e) {
    var rowIdx = parseInt(e.target.dataset.rowIndex);
    var fieldKey = e.target.dataset.fieldKey;
    if (isNaN(rowIdx) || !fieldKey) return;
    var item = editorData[rowIdx];
    var curVal = item ? item[fieldKey] : '';
    try {
        var parsed = typeof curVal === 'object' ? curVal : JSON.parse(curVal);
        var edited = await dialog.prompt('编辑JSON (字段: ' + fieldKey + '):', JSON.stringify(parsed, null, 2));
        if (edited !== null) {
            var newVal = JSON.parse(edited);
            editorData[rowIdx][fieldKey] = newVal;
            e.target.value = JSON.stringify(newVal).substring(0, 40);
            e.target.title = edited;
            markDirty();
            syncAutoSave();
        }
    } catch (err) {
        showStatus('JSON格式错误: ' + err.message, 'error');
    }
}

function markDirty() {
    if (editorDirty) return;
    editorDirty = true;
    if (editorKey) {
        var cfg = getCurrentConfig();
        if (cfg) cfg.modified = true;
        var activeItem = document.querySelector('.config-item.active');
        if (activeItem && !activeItem.querySelector('.mod-dot')) {
            var dot = document.createElement('span');
            dot.className = 'mod-dot';
            dot.title = '已修改';
            activeItem.appendChild(dot);
        }
    }
}

/** 同步编辑器数据到 configProject 并触发自动保存到本地文件 */
async function syncAutoSave() {
    if (!editorSchema || !editorKey) return;
    var data = readConfigTableData();
    updateCurrentData(data);
    await autoSave();
}

function configAddRow() {
    if (!editorSchema) return;
    var newItem = {};
    for (var i = 0; i < editorSchema.fields.length; i++) {
        var f = editorSchema.fields[i];
        newItem[f.key] = f.default !== undefined ? f.default : '';
    }
    editorData.push(newItem);
    markDirty();
    syncAutoSave();
    // 滚动到底部触发渲染
    var wrapper = document.getElementById('configTableWrapper');
    if (wrapper) {
        wrapper.scrollTop = editorData.length * V_ROW_HEIGHT;
        renderVisibleRows();
    }
    // 更新提示
    var hint = document.getElementById('configEditorHint');
    if (hint) {
        hint.textContent = '共 ' + editorData.length + ' 条记录';
    }
}

function configDeleteRows() {
    var tbody = document.getElementById('configEditTableBody');
    if (!tbody || !editorSchema) return;
    var checks = tbody.querySelectorAll('.row-check');
    var indices = [];
    checks.forEach(function(cb) {
        if (cb.checked) {
            var tr = cb.closest('tr');
            if (tr && tr.dataset.rowIndex !== undefined) {
                indices.push(parseInt(tr.dataset.rowIndex));
            }
        }
    });
    if (indices.length === 0) {
        showStatus('请先勾选要删除的行', 'error');
        return;
    }
    // 从大到小删除
    indices.sort(function(a, b) { return b - a; });
    for (var i = 0; i < indices.length; i++) {
        editorData.splice(indices[i], 1);
    }
    markDirty();
    syncAutoSave();
    renderVisibleRows();
    showStatus('已删除 ' + indices.length + ' 行', 'success');
    // 更新提示
    var hint = document.getElementById('configEditorHint');
    if (hint) hint.textContent = '共 ' + editorData.length + ' 条记录';
}

function configPreviewJson() {
    if (!editorSchema) return;
    var data = readConfigTableData();
    updateCurrentData(data);
    setPreview(data, '（' + editorSchema.label + '，共 ' + (Array.isArray(data) ? data.length : 1) + ' 条）');
    showStatus('已更新预览', 'success');
}

/**
 * 从内存数据读取（虚拟滚动下直接从editorData返回）
 */
function readConfigTableData() {
    if (!editorSchema) return [];
    if (editorSchema.shape === DataShape.OBJECT && editorData.length === 1) {
        return editorData[0];
    }
    return editorData.slice();
}

// ============================================================
// 启动
// ============================================================
init();
