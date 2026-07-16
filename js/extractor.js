// extractor.js — 字段提取 (Field Extraction) tab functionality
import { showStatus } from './core.js';
import { setPreview } from './preview.js';
import { setSourceData, setTargetData, getSourceInfo, getTargetInfo } from './import.js';

// ── Private module state ──
var extractData = null;
var extractFields = [];
var selectedFields = new Set();

// ── Internal utility functions ──

function getFieldType(value) {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) {
        if (value.length > 0) {
            var elemType = Array.isArray(value[0]) ? 'array' :
                (value[0] === null ? 'null' :
                (typeof value[0] === 'number' ? (Number.isInteger(value[0]) ? 'int' : 'float') : typeof value[0]));
            return 'array<' + elemType + '>[' + value.length + ']';
        }
        return 'array[0]';
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'number(int)' : 'number(float)';
    }
    return typeof value;
}

function formatSample(value, maxLen) {
    if (maxLen === undefined) maxLen = 30;
    if (value === null || value === undefined) return '';
    var str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (str.length > maxLen) return str.substring(0, maxLen) + '...';
    return str;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function extractFieldDetails(data) {
    if (!Array.isArray(data) || data.length === 0) return [];
    var fieldMap = {};
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        if (item && typeof item === 'object') {
            var keys = Object.keys(item);
            for (var k = 0; k < keys.length; k++) {
                var key = keys[k];
                if (!fieldMap[key]) {
                    fieldMap[key] = { name: key, type: getFieldType(item[key]), count: 0, sample: item[key] };
                }
                fieldMap[key].count++;
            }
        }
    }
    return Object.keys(fieldMap).map(function (k) { return fieldMap[k]; });
}

// ── Core functions ──

function loadExtractFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var parsed = JSON.parse(e.target.result);
            extractData = Array.isArray(parsed) ? parsed :
                (parsed.data && Array.isArray(parsed.data) ? parsed.data : [parsed]);
            extractFields = extractFieldDetails(extractData);
            selectedFields = new Set(extractFields.map(function (f) { return f.name; }));

            // Show file name
            var fileInfoEl = document.getElementById('extractFileInfo');
            if (fileInfoEl) fileInfoEl.textContent = file.name;

            // Show metadata using proper elements
            var metaEl = document.getElementById('extractMeta');
            if (metaEl) metaEl.style.display = 'block';
            var countEl = document.getElementById('extractCountDisplay');
            if (countEl) countEl.textContent = extractData.length;
            var fieldCountEl = document.getElementById('extractFieldCountDisplay');
            if (fieldCountEl) fieldCountEl.textContent = extractFields.length;

            renderExtractFieldsTable();
            showStatus('文件加载成功，共 ' + extractData.length + ' 条数据，' + extractFields.length + ' 个字段');
        } catch (err) {
            showStatus('JSON 解析失败: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

function renderExtractFieldsTable() {
    var tbody = document.getElementById('extractFieldsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var container = document.getElementById('extractFieldsContainer');
    if (container) container.style.display = 'block';

    for (var i = 0; i < extractFields.length; i++) {
        var f = extractFields[i];
        var tr = document.createElement('tr');

        var tdCheck = document.createElement('td');
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'field-checkbox';
        cb.setAttribute('data-field', f.name);
        cb.checked = selectedFields.has(f.name);
        tdCheck.appendChild(cb);
        tr.appendChild(tdCheck);

        var tdName = document.createElement('td');
        tdName.textContent = f.name;
        tdName.style.fontWeight = '500';
        tr.appendChild(tdName);

        var tdType = document.createElement('td');
        tdType.textContent = f.type;
        tdType.style.fontSize = '11px';
        tdType.style.color = 'var(--text-secondary)';
        tr.appendChild(tdType);

        var tdCount = document.createElement('td');
        tdCount.style.textAlign = 'center';
        tdCount.textContent = f.count;
        tr.appendChild(tdCount);

        var tdSample = document.createElement('td');
        tdSample.className = 'sample-cell';
        tdSample.textContent = formatSample(f.sample);
        tdSample.title = formatSample(f.sample, 200);
        tr.appendChild(tdSample);

        tbody.appendChild(tr);
    }

    updateSelectionCount();
}

function updateSelectionCount() {
    var countEl = document.getElementById('extractSelectionCount');
    if (countEl) countEl.textContent = '已选 ' + selectedFields.size + ' / ' + extractFields.length + ' 个字段';
}

function selectAllFields() {
    selectedFields = new Set(extractFields.map(function (f) { return f.name; }));
    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox');
    for (var i = 0; i < checkboxes.length; i++) checkboxes[i].checked = true;
    updateSelectionCount();
}

function deselectAllFields() {
    selectedFields.clear();
    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox');
    for (var i = 0; i < checkboxes.length; i++) checkboxes[i].checked = false;
    updateSelectionCount();
}

function invertFieldSelection() {
    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
        var fieldName = checkboxes[i].getAttribute('data-field');
        checkboxes[i].checked = !checkboxes[i].checked;
        if (checkboxes[i].checked) {
            selectedFields.add(fieldName);
        } else {
            selectedFields.delete(fieldName);
        }
    }
    updateSelectionCount();
}

function generateExtraction() {
    if (!extractData) { showStatus('请先加载数据文件'); return null; }

    // Collect selected fields from checkboxes
    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox:checked');
    var fields = [];
    for (var i = 0; i < checkboxes.length; i++) {
        fields.push(checkboxes[i].getAttribute('data-field'));
    }
    if (fields.length === 0) { showStatus('请至少选择一个字段'); return null; }

    var startInput = parseInt(document.getElementById('extractStartIndex').value, 10) || 1;
    var countInput = parseInt(document.getElementById('extractCount').value, 10) || extractData.length;
    var realStart = startInput - 1;
    if (realStart < 0) realStart = 0;

    var slice = extractData.slice(realStart, realStart + countInput);
    var result = [];
    for (var i = 0; i < slice.length; i++) {
        var obj = {};
        for (var j = 0; j < fields.length; j++) {
            var key = fields[j];
            if (slice[i].hasOwnProperty(key)) obj[key] = slice[i][key];
        }
        result.push(obj);
    }
    return result;
}

function previewExtraction() {
    var result = generateExtraction();
    if (!result) return;

    setPreview(result, '提取条数: ' + result.length);
    showStatus('提取完成，共 ' + result.length + ' 条数据已显示在右侧预览');
}

function saveAsConfigTemplate() {
    if (!extractData) { showStatus('请先加载数据文件'); return; }

    var name = prompt('请输入模板名称:');
    if (!name) return;
    var creator = prompt('请输入创建者:');
    if (!creator) return;

    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox:checked');
    var fields = [];
    for (var i = 0; i < checkboxes.length; i++) {
        fields.push(checkboxes[i].getAttribute('data-field'));
    }

    var startInput = parseInt(document.getElementById('extractStartIndex').value, 10) || 1;
    var countInput = parseInt(document.getElementById('extractCount').value, 10) || extractData.length;

    var template = {
        name: name,
        creator: creator,
        createdAt: new Date().toISOString(),
        type: 'extract_config',
        fields: fields,
        rowFilter: { start: startInput, count: countInput }
    };

    var templates = [];
    try { templates = JSON.parse(localStorage.getItem('config_templates')) || []; } catch (e) {}
    templates.push(template);
    localStorage.setItem('config_templates', JSON.stringify(templates));
    showStatus('配置模板 "' + name + '" 已保存');
}

function saveAsDataTemplate() {
    var result = generateExtraction();
    if (!result) return;

    var name = prompt('请输入模板名称:');
    if (!name) return;
    var creator = prompt('请输入创建者:');
    if (!creator) return;

    var template = {
        name: name,
        creator: creator,
        createdAt: new Date().toISOString(),
        type: 'data',
        data: result
    };

    var templates = [];
    try { templates = JSON.parse(localStorage.getItem('config_templates')) || []; } catch (e) {}
    templates.push(template);
    localStorage.setItem('config_templates', JSON.stringify(templates));
    showStatus('数据模板 "' + name + '" 已保存，共 ' + result.length + ' 条数据');
}

// ============================================================
// 提取结果 → 三选一保存（本地 / 源数据 / 目标数据）
// ============================================================

/** 保存提取结果到本地（下载 JSON 文件） */
function saveExtractionLocal() {
    var result = generateExtraction();
    if (!result) return;
    var blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted_data.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    showStatus('提取结果已下载，共 ' + result.length + ' 条数据', 'success');
}

/** 保存提取结果到源数据槽（JSON 1），供字段替换使用 */
function saveExtractionAsSource() {
    var result = generateExtraction();
    if (!result) return;
    var srcInfo = getSourceInfo();
    if (srcInfo && !confirm('源数据已有 ' + srcInfo.count + ' 条数据，确定要覆盖吗？')) return;
    setSourceData(result);
    updateSlotStatus();
    showStatus('提取结果已设为源数据，共 ' + result.length + ' 条数据', 'success');
}

/** 保存提取结果到目标数据槽（JSON 2），供字段替换使用 */
function saveExtractionAsTarget() {
    var result = generateExtraction();
    if (!result) return;
    var tgtInfo = getTargetInfo();
    if (tgtInfo && !confirm('目标数据已有 ' + tgtInfo.count + ' 条数据，确定要覆盖吗？')) return;
    setTargetData(result);
    updateSlotStatus();
    showStatus('提取结果已设为目标数据，共 ' + result.length + ' 条数据', 'success');
}

/** 更新界面上的源/目标数据状态显示 */
function updateSlotStatus() {
    var srcEl = document.getElementById('extractSrcStatus');
    var tgtEl = document.getElementById('extractTgtStatus');
    if (srcEl) {
        var src = getSourceInfo();
        srcEl.textContent = src ? '源数据: ' + src.count + ' 条, ' + src.fields + ' 个字段' : '源数据: 空';
        srcEl.style.color = src ? 'var(--text-primary)' : 'var(--text-secondary)';
    }
    if (tgtEl) {
        var tgt = getTargetInfo();
        tgtEl.textContent = tgt ? '目标数据: ' + tgt.count + ' 条, ' + tgt.fields + ' 个字段' : '目标数据: 空';
        tgtEl.style.color = tgt ? 'var(--text-primary)' : 'var(--text-secondary)';
    }
}

/** 绑定提取结果保存按钮 */
function bindDestButtons() {
    var localBtn = document.getElementById('saveExtractLocal');
    if (localBtn) localBtn.addEventListener('click', saveExtractionLocal);

    var srcBtn = document.getElementById('saveExtractAsSource');
    if (srcBtn) srcBtn.addEventListener('click', saveExtractionAsSource);

    var tgtBtn = document.getElementById('saveExtractAsTarget');
    if (tgtBtn) tgtBtn.addEventListener('click', saveExtractionAsTarget);
}

// ── 拖拽导入支持（分区域）──

function initDragDrop() {
    // Zone 1: 加载 JSON（提取源）
    var extractZone = document.getElementById('extractDropZone');
    if (extractZone) {
        ['dragenter','dragover'].forEach(function(ev) {
            extractZone.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); });
        });
        extractZone.addEventListener('dragover', function(e) {
            extractZone.style.borderColor = 'var(--accent-color)';
            extractZone.style.background = 'var(--bg-hover)';
        });
        extractZone.addEventListener('dragleave', function(e) {
            if (e.target === extractZone || !extractZone.contains(e.relatedTarget)) {
                extractZone.style.borderColor = '';
                extractZone.style.background = '';
            }
        });
        extractZone.addEventListener('drop', function(e) {
            e.preventDefault(); e.stopPropagation();
            extractZone.style.borderColor = '';
            extractZone.style.background = '';
            var file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                loadExtractFile(file);
            } else {
                showStatus('请拖入JSON文件', 'error');
            }
        });
    }

    // Zone 2: JSON 1（源数据）
    var sourceZone = document.getElementById('sourceDropZone');
    if (sourceZone) {
        ['dragenter','dragover'].forEach(function(ev) {
            sourceZone.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); });
        });
        sourceZone.addEventListener('dragover', function(e) {
            sourceZone.style.borderColor = 'var(--accent-color)';
            sourceZone.style.background = 'var(--bg-hover)';
        });
        sourceZone.addEventListener('dragleave', function(e) {
            if (e.target === sourceZone || !sourceZone.contains(e.relatedTarget)) {
                sourceZone.style.borderColor = '';
                sourceZone.style.background = '';
            }
        });
        sourceZone.addEventListener('drop', function(e) {
            e.preventDefault(); e.stopPropagation();
            sourceZone.style.borderColor = '';
            sourceZone.style.background = '';
            var file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    try {
                        var data = JSON.parse(ev.target.result);
                        setSourceData(data, file.name);
                    } catch(err) {
                        showStatus('JSON解析失败: ' + err.message, 'error');
                    }
                };
                reader.readAsText(file);
            } else {
                showStatus('请拖入JSON文件', 'error');
            }
        });
    }

    // Zone 3: JSON 2（目标数据）
    var targetZone = document.getElementById('targetDropZone');
    if (targetZone) {
        ['dragenter','dragover'].forEach(function(ev) {
            targetZone.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); });
        });
        targetZone.addEventListener('dragover', function(e) {
            targetZone.style.borderColor = 'var(--accent-color)';
            targetZone.style.background = 'var(--bg-hover)';
        });
        targetZone.addEventListener('dragleave', function(e) {
            if (e.target === targetZone || !targetZone.contains(e.relatedTarget)) {
                targetZone.style.borderColor = '';
                targetZone.style.background = '';
            }
        });
        targetZone.addEventListener('drop', function(e) {
            e.preventDefault(); e.stopPropagation();
            targetZone.style.borderColor = '';
            targetZone.style.background = '';
            var file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    try {
                        var data = JSON.parse(ev.target.result);
                        setTargetData(data, file.name);
                    } catch(err) {
                        showStatus('JSON解析失败: ' + err.message, 'error');
                    }
                };
                reader.readAsText(file);
            } else {
                showStatus('请拖入JSON文件', 'error');
            }
        });
    }
}

// ── Exported initializer ──

export function initExtractorPanel() {
    var extractFileBtn = document.getElementById('extractFileBtn');
    var extractFileInput = document.getElementById('extractFileInput');
    if (extractFileBtn && extractFileInput) {
        extractFileBtn.addEventListener('click', function () { extractFileInput.click(); });
        extractFileInput.addEventListener('change', function (e) {
            if (e.target.files && e.target.files[0]) loadExtractFile(e.target.files[0]);
        });
    }

    var selectAllBtn = document.getElementById('extractSelectAllBtn');
    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllFields);

    var deselectAllBtn = document.getElementById('extractDeselectAllBtn');
    if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAllFields);

    var invertBtn = document.getElementById('extractInvertBtn');
    if (invertBtn) invertBtn.addEventListener('click', invertFieldSelection);

    var previewBtn = document.getElementById('extractPreviewBtn');
    if (previewBtn) previewBtn.addEventListener('click', previewExtraction);

    var saveConfigBtn = document.getElementById('extractSaveConfigBtn');
    if (saveConfigBtn) saveConfigBtn.addEventListener('click', saveAsConfigTemplate);

    var saveDataBtn = document.getElementById('extractSaveDataBtn');
    if (saveDataBtn) saveDataBtn.addEventListener('click', saveAsDataTemplate);

    // Event delegation on tbody for checkbox changes and row clicks
    var tbody = document.getElementById('extractFieldsBody');
    if (tbody) {
        tbody.addEventListener('change', function (e) {
            if (e.target.classList.contains('field-checkbox')) {
                var fieldName = e.target.getAttribute('data-field');
                if (e.target.checked) {
                    selectedFields.add(fieldName);
                } else {
                    selectedFields.delete(fieldName);
                }
                updateSelectionCount();
            }
        });
        tbody.addEventListener('click', function (e) {
            var tr = e.target.closest('tr');
            if (tr && e.target.tagName !== 'INPUT') {
                var cb = tr.querySelector('.field-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                    var fieldName = cb.getAttribute('data-field');
                    if (cb.checked) {
                        selectedFields.add(fieldName);
                    } else {
                        selectedFields.delete(fieldName);
                    }
                    updateSelectionCount();
                }
            }
        });
    }

    bindDestButtons();
    updateSlotStatus();
    initDragDrop();
}
