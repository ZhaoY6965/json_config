// extractor.js — 字段提取 (Field Extraction) tab functionality
import { batches, allocBatchId, dom, showStatus } from './core.js';

// ── Private module state ──
var extractData = null;
var extractFields = [];
var selectedFields = new Set();

// ── Internal utility functions ──

function getFieldType(value) {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
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
            extractData = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
            extractFields = extractFieldDetails(extractData);
            selectedFields = new Set(extractFields.map(function (f) { return f.name; }));

            // Show file name
            var fileInfoEl = document.getElementById('extractFileInfo');
            if (fileInfoEl) fileInfoEl.textContent = file.name;

            // Show metadata
            var metaEl = document.getElementById('extractMeta');
            if (metaEl) {
                metaEl.textContent = '数据条数: ' + extractData.length + ' | 字段数: ' + extractFields.length;
            }

            renderExtractFieldsTable();
            showStatus('文件加载成功，共 ' + extractData.length + ' 条数据，' + extractFields.length + ' 个字段');
        } catch (err) {
            showStatus('JSON 解析失败: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function renderExtractFieldsTable() {
    var tbody = document.getElementById('extractFieldsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
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
        tr.appendChild(tdName);

        var tdType = document.createElement('td');
        tdType.textContent = f.type;
        tr.appendChild(tdType);

        var tdCount = document.createElement('td');
        tdCount.style.textAlign = 'center';
        tdCount.textContent = f.count;
        tr.appendChild(tdCount);

        var tdSample = document.createElement('td');
        tdSample.textContent = formatSample(f.sample);
        tr.appendChild(tdSample);

        tbody.appendChild(tr);
    }
}

function selectAllFields() {
    selectedFields = new Set(extractFields.map(function (f) { return f.name; }));
    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox');
    for (var i = 0; i < checkboxes.length; i++) checkboxes[i].checked = true;
}

function deselectAllFields() {
    selectedFields.clear();
    var checkboxes = document.querySelectorAll('#extractFieldsBody .field-checkbox');
    for (var i = 0; i < checkboxes.length; i++) checkboxes[i].checked = false;
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

    if (dom.previewDisplay) dom.previewDisplay.textContent = JSON.stringify(result, null, 2);
    if (dom.previewCount) dom.previewCount.textContent = '提取条数: ' + result.length;

    var batchId = allocBatchId();
    batches.push({ id: batchId, data: result, source: '字段提取' });
    showStatus('预览已生成，共 ' + result.length + ' 条数据（批次 #' + batchId + '）');
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
                }
            }
        });
    }
}
