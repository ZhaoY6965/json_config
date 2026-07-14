// ============================================================
// 导入功能 — 双JSON文件加载 + 字段级替换
// ============================================================
import { batches, allocBatchId, dom, showStatus } from './core.js';

// ---- 模块状态 ----
var json1Data = null;   // JSON 1 原始解析结果
var json2Data = null;   // JSON 2 原始解析结果
var json1Fields = [];   // JSON 1 字段详情数组
var json2Fields = [];   // JSON 2 字段详情数组

// ============================================================
// 工具函数
// ============================================================

/** 判断值的类型标签 */
function getFieldType(value) {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'number(int)' : 'number(float)';
    }
    return typeof value;
}

/** 截断显示值 */
function formatSample(value, maxLen) {
    if (maxLen === undefined) maxLen = 30;
    if (value === null) return 'null';
    if (value === undefined) return '-';
    if (typeof value === 'object') {
        var s = JSON.stringify(value);
        return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
    }
    var str = String(value);
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}

/**
 * 提取字段详情：名称、类型、有效组数、示例值
 * @param {Array|Object} data  解析后的 JSON
 * @returns {Array<{name,type,count,sample}>}
 */
function extractFieldDetails(data) {
    var arr = Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);
    if (arr.length === 0) return [];

    // 收集所有出现过的 key（保持首次出现顺序）
    var keyOrder = [];
    var keySet = {};
    for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'object' || arr[i] === null) continue;
        var keys = Object.keys(arr[i]);
        for (var k = 0; k < keys.length; k++) {
            if (!keySet[keys[k]]) {
                keySet[keys[k]] = true;
                keyOrder.push(keys[k]);
            }
        }
    }

    var result = [];
    for (var ki = 0; ki < keyOrder.length; ki++) {
        var fieldName = keyOrder[ki];

        // 统计该字段在多少条数据中存在且有值
        var existCount = 0;
        var sampleValue = undefined;
        var sampleType = 'string';
        for (var j = 0; j < arr.length; j++) {
            if (typeof arr[j] === 'object' && arr[j] !== null && arr[j].hasOwnProperty(fieldName)) {
                var val = arr[j][fieldName];
                if (val !== undefined && val !== null && val !== '') {
                    existCount++;
                    if (sampleValue === undefined) {
                        sampleValue = val;
                        sampleType = getFieldType(val);
                    }
                }
            }
        }

        result.push({
            name: fieldName,
            type: sampleType,
            count: existCount,
            sample: sampleValue
        });
    }
    return result;
}

/** 获取数据总组数 */
function getDataCount(data) {
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object') return 1;
    return 0;
}

/** HTML 转义 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/** 简易深拷贝（适用于纯 JSON 数据） */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        return obj;
    }
}

// ============================================================
// UI 渲染
// ============================================================

/** 渲染字段详情表格（4列：字段名、类型、组数、示例值） */
function renderFieldsTable(containerId, fields) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var tbody = container.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (fields.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    var cellStyle = 'padding:3px 6px; border-bottom:1px solid var(--border-color);';
    var limit = Math.min(fields.length, 100);

    for (var i = 0; i < limit; i++) {
        var f = fields[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="' + cellStyle + ' font-weight:500;">' + escapeHtml(f.name) + '</td>' +
            '<td style="' + cellStyle + '">' + f.type + '</td>' +
            '<td style="' + cellStyle + ' text-align:center;">' + f.count + '</td>' +
            '<td style="' + cellStyle + ' color:var(--text-secondary); font-size:11px;">' + escapeHtml(formatSample(f.sample)) + '</td>';
        tbody.appendChild(tr);
    }

    if (fields.length > 100) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="padding:4px 6px; color:var(--text-secondary); font-style:italic;">... 共 ' + fields.length + ' 个字段，仅显示前100个</td>';
        tbody.appendChild(tr);
    }
}

/** 填充字段下拉选择框 */
function populateFieldSelect(selectId, fields) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';

    if (fields.length === 0) {
        var opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '-- 无可用字段 --';
        sel.appendChild(opt);
        return;
    }

    for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        var opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = f.name + '  (' + f.type + ', ' + f.count + '组)';
        sel.appendChild(opt);
    }
}

/** 更新字段选择后的详情提示 */
function updateFieldDetail(detailId, fields, selectedName) {
    var el = document.getElementById(detailId);
    if (!el) return;
    if (!selectedName) { el.textContent = ''; return; }

    for (var i = 0; i < fields.length; i++) {
        if (fields[i].name === selectedName) {
            var f = fields[i];
            el.textContent = '类型: ' + f.type + ' | 有效值: ' + f.count + '组 | 示例: ' + formatSample(f.sample, 40);
            return;
        }
    }
    el.textContent = '';
}

// ============================================================
// 文件加载
// ============================================================

function loadJson1(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var json = JSON.parse(e.target.result);
            json1Data = json;
            json1Fields = extractFieldDetails(json);
            var total = getDataCount(json);

            document.getElementById('json1FileInfo').textContent = '已加载: ' + file.name;
            var meta = document.getElementById('json1Meta');
            meta.style.display = 'block';
            document.getElementById('json1CountDisplay').textContent = total;
            document.getElementById('json1FieldCountDisplay').textContent = json1Fields.length;

            renderFieldsTable('json1FieldsContainer', json1Fields);
            populateFieldSelect('sourceFieldSelect', json1Fields);
            updateFieldDetail('sourceFieldDetail', json1Fields, document.getElementById('sourceFieldSelect').value);
            updateReplaceSummary();

            showStatus('JSON 1 解析成功 — 字段: ' + json1Fields.length + ', 数据: ' + total + ' 组', 'success');
        } catch (err) {
            showStatus('JSON 1 解析失败: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

function loadJson2(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var json = JSON.parse(e.target.result);
            json2Data = json;
            json2Fields = extractFieldDetails(json);
            var total = getDataCount(json);

            document.getElementById('json2FileInfo').textContent = '已加载: ' + file.name;
            var meta = document.getElementById('json2Meta');
            meta.style.display = 'block';
            document.getElementById('json2CountDisplay').textContent = total;
            document.getElementById('json2FieldCountDisplay').textContent = json2Fields.length;

            renderFieldsTable('json2FieldsContainer', json2Fields);
            populateFieldSelect('targetFieldSelect', json2Fields);
            updateFieldDetail('targetFieldDetail', json2Fields, document.getElementById('targetFieldSelect').value);
            updateReplaceSummary();

            showStatus('JSON 2 解析成功 — 字段: ' + json2Fields.length + ', 数据: ' + total + ' 组', 'success');
        } catch (err) {
            showStatus('JSON 2 解析失败: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ============================================================
// 替换摘要（实时提示）
// ============================================================

function updateReplaceSummary() {
    var summaryEl = document.getElementById('replaceSummary');
    if (!summaryEl) return;

    var srcField = document.getElementById('sourceFieldSelect').value;
    var tgtField = document.getElementById('targetFieldSelect').value;

    if (!json1Data || !json2Data || !srcField) {
        summaryEl.style.display = 'none';
        return;
    }

    var srcArray = Array.isArray(json1Data) ? json1Data : [json1Data];
    var tgtArray = Array.isArray(json2Data) ? json2Data : [json2Data];

    var startInput = parseInt(document.getElementById('replaceStartIndex').value) || 1;
    var countVal = document.getElementById('replaceCount').value;
    var count = countVal ? parseInt(countVal) : 0;

    var srcTotal = srcArray.length;
    var tgtTotal = tgtArray.length;

    if (count <= 0) count = tgtTotal;
    var realStart = startInput - 1;  // 转0-based
    var available = srcTotal - realStart;
    var actual = Math.min(count, available);

    var mode = document.getElementById('replaceMode').value;
    var modeDesc = '';
    if (mode === 'override_rename') {
        modeDesc = '将 JSON 2 中 <strong>' + escapeHtml(tgtField) + '</strong> 字段<strong>重命名</strong>为 <strong>' + escapeHtml(srcField) + '</strong> 并替换值';
    } else if (mode === 'keep_name') {
        modeDesc = '保留 JSON 2 的 <strong>' + escapeHtml(tgtField) + '</strong> 字段名，仅<strong>替换值</strong>';
    } else if (mode === 'append_new') {
        modeDesc = '在 JSON 2 每条数据末尾<strong>新增</strong> <strong>' + escapeHtml(srcField) + '</strong> 字段';
    }

    summaryEl.style.display = 'block';
    summaryEl.innerHTML =
        '<strong>预览：</strong>从 JSON 1 的 <strong>' + escapeHtml(srcField) + '</strong> 字段第 <strong>' + startInput + '</strong> 条开始取 <strong>' + actual + '</strong> 个值，' +
        modeDesc + '（JSON 2 共 ' + tgtTotal + ' 条）。' +
        (actual < count ? ' <span style="color:#e53e3e;">(源数据不足，实际可取 ' + actual + ' 个)</span>' : '');
}

// ============================================================
// 核心替换逻辑
// ============================================================

function generateReplacement() {
    if (!json1Data) {
        showStatus('请先加载 JSON 1（源数据）', 'error');
        return null;
    }
    if (!json2Data) {
        showStatus('请先加载 JSON 2（目标数据）', 'error');
        return null;
    }

    var srcField = document.getElementById('sourceFieldSelect').value;
    var tgtField = document.getElementById('targetFieldSelect').value;
    var mode = document.getElementById('replaceMode').value;

    if (!srcField) {
        showStatus('请选择源字段（来自 JSON 1）', 'error');
        return null;
    }

    if (!tgtField && mode !== 'append_new') {
        showStatus('请选择目标字段（来自 JSON 2）', 'error');
        return null;
    }

    var srcArray = Array.isArray(json1Data) ? json1Data : [json1Data];
    var tgtArray = Array.isArray(json2Data) ? json2Data : [json2Data];

    var startInput = parseInt(document.getElementById('replaceStartIndex').value) || 1;
    var countVal = document.getElementById('replaceCount').value;
    var count = countVal ? parseInt(countVal) : 0;

    var realStart = startInput - 1;  // 用户输入1-based，转为0-based数组索引

    if (realStart < 0 || realStart >= srcArray.length) {
        showStatus('起始位置超出范围（JSON 1 共 ' + srcArray.length + ' 条，有效范围 1~' + srcArray.length + '）', 'error');
        return null;
    }

    if (count <= 0) count = tgtArray.length;
    var available = srcArray.length - realStart;
    var actual = Math.min(count, available);

    if (actual <= 0) {
        showStatus('没有可替换的数据', 'error');
        return null;
    }

    var rangeDesc = 'JSON1.' + srcField + '[第' + startInput + '~' + (startInput + actual - 1) + '条]';

    // ---------- 模式 1：覆盖字段名 ----------
    // 删除目标字段，用源字段名替代（字段改名 + 值替换）
    if (mode === 'override_rename') {
        var result = [];
        var replacedCount = 0;

        for (var i = 0; i < tgtArray.length; i++) {
            var item = deepClone(tgtArray[i]);

            // 删除旧的目标字段
            delete item[tgtField];

            if (i < actual) {
                // 用源字段名 + 源值 插入
                var srcItem = srcArray[realStart + i];
                item[srcField] = (srcItem && srcItem.hasOwnProperty(srcField)) ? srcItem[srcField] : null;
                replacedCount++;
            } else {
                // 超出替换范围的行，保留原目标字段值但改用源字段名
                item[srcField] = tgtArray[i][tgtField] !== undefined ? tgtArray[i][tgtField] : null;
            }

            result.push(item);
        }

        showStatus('覆盖字段名完成 — "' + tgtField + '" → "' + srcField + '"，替换 ' + replacedCount + ' 条值（来源: ' + rangeDesc + '）', 'success');
        return result;
    }

    // ---------- 模式 2：保留字段名 ----------
    // 字段名不变，只替换值
    if (mode === 'keep_name') {
        var result = [];
        var replacedCount = 0;

        for (var i = 0; i < tgtArray.length; i++) {
            var item = deepClone(tgtArray[i]);

            if (i < actual) {
                var srcItem = srcArray[realStart + i];
                item[tgtField] = (srcItem && srcItem.hasOwnProperty(srcField)) ? srcItem[srcField] : null;
                replacedCount++;
            }

            result.push(item);
        }

        showStatus('保留字段名替换完成 — "' + tgtField + '" 字段值已替换 ' + replacedCount + ' 条（来源: ' + rangeDesc + '）', 'success');
        return result;
    }

    // ---------- 模式 3：新增到目标文件 ----------
    // 在 JSON2 每条数据末尾追加新字段
    if (mode === 'append_new') {
        var result = [];
        var addedCount = 0;

        for (var i = 0; i < tgtArray.length; i++) {
            var item = deepClone(tgtArray[i]);

            if (i < actual) {
                var srcItem = srcArray[realStart + i];
                item[srcField] = (srcItem && srcItem.hasOwnProperty(srcField)) ? srcItem[srcField] : null;
                addedCount++;
            } else {
                item[srcField] = null;
            }

            result.push(item);
        }

        showStatus('新增字段完成 — 在 JSON 2 中追加 "' + srcField + '" 字段，填充 ' + addedCount + ' 条（来源: ' + rangeDesc + '）', 'success');
        return result;
    }

    showStatus('未知的替换模式', 'error');
    return null;
}

// ============================================================
// 更新预览面板
// ============================================================

function updatePreviewManually(dataArray) {
    if (dom.previewDisplay) {
        dom.previewDisplay.textContent = JSON.stringify(dataArray, null, 2);
    }
    if (dom.previewCount) {
        dom.previewCount.textContent = '（共 ' + dataArray.length + ' 条）';
    }
    var container = document.getElementById('batchList');
    if (container) {
        container.innerHTML = '';
        if (batches.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary); font-size:13px; padding:4px 0;">暂无批次</div>';
        } else {
            var html = '<ul style="list-style:none; padding:0; margin:0;">';
            for (var i = 0; i < batches.length; i++) {
                var b = batches[i];
                html += '<li style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px solid var(--border-color);">' +
                    '<span style="font-size:13px;">批次 ' + (i + 1) + '（' + b.data.length + ' 条）</span>' +
                    '<span>' +
                    '<button class="btn-sm detail-batch-btn" data-id="' + b.id + '">详情</button>' +
                    '<button class="btn-sm edit-batch-btn" data-id="' + b.id + '">编辑</button>' +
                    '<button class="btn-sm delete-batch-btn" data-id="' + b.id + '" style="margin-left:4px;">删除</button>' +
                    '</span></li>';
            }
            html += '</ul>';
            container.innerHTML = html;
        }
    }
}

// ============================================================
// 原有简单导入功能（保留兼容）
// ============================================================

export function handleImport(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var json = JSON.parse(e.target.result);
            var dataArray = [];
            if (Array.isArray(json)) {
                dataArray = json;
            } else if (typeof json === 'object' && json !== null) {
                dataArray = [json];
            } else {
                showStatus('无效的JSON格式，请上传对象或对象数组', 'error');
                return;
            }
            if (dataArray.length === 0) {
                showStatus('数据为空', 'error');
                return;
            }
            var fields = Object.keys(dataArray[0]);
            if (fields.length === 0) {
                showStatus('数据对象没有字段', 'error');
                return;
            }
            var config = [];
            for (var i = 0; i < fields.length; i++) {
                config.push({ field: fields[i], prefix: '', start: null, step: 1, count: dataArray.length });
            }
            var newBatch = {
                id: allocBatchId(),
                config: config,
                data: dataArray
            };
            batches.push(newBatch);
            updatePreviewManually(dataArray);
            showStatus('成功导入 ' + dataArray.length + ' 条数据作为批次', 'success');
        } catch (err) {
            showStatus('解析JSON失败: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ============================================================
// 初始化导入面板（绑定所有事件）
// ============================================================

export function initImportPanel() {
    // --- 文件选择按钮 ---
    var json1Btn = document.getElementById('importJson1Btn');
    var json1Input = document.getElementById('json1FileInput');
    var json2Btn = document.getElementById('importJson2Btn');
    var json2Input = document.getElementById('json2FileInput');

    if (json1Btn && json1Input) {
        json1Btn.addEventListener('click', function() { json1Input.click(); });
        json1Input.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                loadJson1(e.target.files[0]);
                e.target.value = '';
            }
        });
    }

    if (json2Btn && json2Input) {
        json2Btn.addEventListener('click', function() { json2Input.click(); });
        json2Input.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                loadJson2(e.target.files[0]);
                e.target.value = '';
            }
        });
    }

    // --- 字段选择变化时更新详情 ---
    var srcSelect = document.getElementById('sourceFieldSelect');
    var tgtSelect = document.getElementById('targetFieldSelect');

    if (srcSelect) {
        srcSelect.addEventListener('change', function() {
            updateFieldDetail('sourceFieldDetail', json1Fields, this.value);
            updateReplaceSummary();
        });
    }
    if (tgtSelect) {
        tgtSelect.addEventListener('change', function() {
            updateFieldDetail('targetFieldDetail', json2Fields, this.value);
            updateReplaceSummary();
        });
    }

    // --- 起始索引 / 替换数量 / 模式 变化时更新摘要 ---
    var startInput = document.getElementById('replaceStartIndex');
    var countInput = document.getElementById('replaceCount');
    var modeSelect = document.getElementById('replaceMode');

    if (startInput) startInput.addEventListener('input', updateReplaceSummary);
    if (countInput) countInput.addEventListener('input', updateReplaceSummary);
    if (modeSelect) modeSelect.addEventListener('change', updateReplaceSummary);

    // --- 生成替换预览 ---
    var generateBtn = document.getElementById('generateReplaceBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            try {
                var data = generateReplacement();
                if (!data) return;

                var dataArray = Array.isArray(data) ? data : [data];
                if (dataArray.length === 0) {
                    showStatus('生成数据为空', 'error');
                    return;
                }

                var fields = Object.keys(dataArray[0]);
                var config = [];
                for (var i = 0; i < fields.length; i++) {
                    config.push({ field: fields[i], prefix: '', start: null, step: 1, count: dataArray.length });
                }
                var newBatch = {
                    id: allocBatchId(),
                    config: config,
                    data: dataArray
                };
                batches.push(newBatch);

                updatePreviewManually(dataArray);
            } catch (err) {
                console.error('替换生成错误:', err);
                showStatus('替换生成失败: ' + err.message, 'error');
            }
        });
    }

    // --- 清空全部 ---
    var clearBtn = document.getElementById('clearImportBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            json1Data = null;
            json2Data = null;
            json1Fields = [];
            json2Fields = [];

            var el;
            el = document.getElementById('json1FileInfo');
            if (el) el.textContent = '未选择文件';
            el = document.getElementById('json1Meta');
            if (el) el.style.display = 'none';
            el = document.getElementById('json1FieldsContainer');
            if (el) el.style.display = 'none';

            el = document.getElementById('json2FileInfo');
            if (el) el.textContent = '未选择文件';
            el = document.getElementById('json2Meta');
            if (el) el.style.display = 'none';
            el = document.getElementById('json2FieldsContainer');
            if (el) el.style.display = 'none';

            populateFieldSelect('sourceFieldSelect', []);
            populateFieldSelect('targetFieldSelect', []);
            el = document.getElementById('sourceFieldDetail');
            if (el) el.textContent = '';
            el = document.getElementById('targetFieldDetail');
            if (el) el.textContent = '';
            el = document.getElementById('replaceStartIndex');
            if (el) el.value = '1';
            el = document.getElementById('replaceCount');
            if (el) el.value = '';
            el = document.getElementById('replaceSummary');
            if (el) el.style.display = 'none';

            showStatus('已清空所有导入数据', 'info');
        });
    }
}