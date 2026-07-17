// ============================================================
// 模板库（Template Library）— 合并浏览器 localStorage 与本地文件夹
// ============================================================

import { showStatus } from './core.js';
import { dialog } from './dialog.js';
import { setPreview } from './preview.js';
import {
    isFileSystemAccessSupported,
    selectFolder,
    getStoredFolder,
    readAllLocalTemplates,
    writeTemplateToFolder,
    deleteTemplateFromFolder,
    clearStoredFolder
} from './localStore.js';

// ============================================================
// 模块状态
// ============================================================
var TEMPLATE_STORAGE_KEY = 'config_templates';

var currentFilter = 'all';    // "all" | "browser" | "local"
var searchKeyword = '';
var allTemplates = [];        // 合并后的模板数组，每项带 source 标记

// ============================================================
// 类型标签映射
// ============================================================
var typeLabels = {
    config: '生成规则',
    extract_config: '提取配置',
    data: '提取数据'
};

// ============================================================
// 核心函数
// ============================================================

/**
 * 加载所有模板（浏览器 localStorage + 本地文件夹），合并后渲染表格
 */
async function loadAllTemplates() {
    allTemplates = [];

    // 1. 读取浏览器 localStorage 模板
    try {
        var browserTemplates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY)) || [];
        for (var i = 0; i < browserTemplates.length; i++) {
            var tpl = browserTemplates[i];
            tpl.source = 'browser';
            tpl._browserIndex = i;
            // 推断缺失的 type
            if (!tpl.type) {
                if (tpl.config) {
                    tpl.type = 'config';
                } else if (tpl.fields) {
                    tpl.type = 'extract_config';
                } else if (tpl.data) {
                    tpl.type = 'data';
                } else {
                    tpl.type = 'config';
                }
            }
            allTemplates.push(tpl);
        }
    } catch (e) {
        console.warn('读取浏览器模板失败:', e);
    }

    // 2. 读取本地文件夹模板（如果支持且已设置）
    if (isFileSystemAccessSupported()) {
        try {
            var folderHandle = getStoredFolder();
            if (folderHandle) {
                var localTemplates = await readAllLocalTemplates();
                for (var j = 0; j < localTemplates.length; j++) {
                    var ltpl = localTemplates[j];
                    ltpl.source = 'local';
                    // 推断缺失的 type
                    if (!ltpl.type) {
                        if (ltpl.config) {
                            ltpl.type = 'config';
                        } else if (ltpl.fields) {
                            ltpl.type = 'extract_config';
                        } else if (ltpl.data) {
                            ltpl.type = 'data';
                        } else {
                            ltpl.type = 'config';
                        }
                    }
                    allTemplates.push(ltpl);
                }
            }
        } catch (e) {
            console.warn('读取本地模板失败:', e);
        }
    }

    renderTemplateLibTable();
}

/**
 * 获取当前过滤后的模板列表
 */
function getFilteredTemplates() {
    var filtered = allTemplates;

    // 按来源过滤
    if (currentFilter === 'browser') {
        filtered = filtered.filter(function(t) { return t.source === 'browser'; });
    } else if (currentFilter === 'local') {
        filtered = filtered.filter(function(t) { return t.source === 'local'; });
    }

    // 按关键词过滤（匹配 name 或 creator）
    if (searchKeyword) {
        var kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(function(t) {
            var nameMatch = t.name && t.name.toLowerCase().indexOf(kw) !== -1;
            var creatorMatch = t.creator && t.creator.toLowerCase().indexOf(kw) !== -1;
            return nameMatch || creatorMatch;
        });
    }

    return filtered;
}

/**
 * 渲染模板库表格
 */
function renderTemplateLibTable() {
    var tbody = document.getElementById('templateLibBody');
    var emptyEl = document.getElementById('templateLibEmpty');
    var folderStatusEl = document.getElementById('templateLibFolderStatus');

    if (!tbody) return;

    // 更新文件夹状态文本
    if (folderStatusEl) {
        if (!isFileSystemAccessSupported()) {
            folderStatusEl.textContent = '当前浏览器不支持本地文件夹访问';
        } else {
            var folderHandle = getStoredFolder();
            if (folderHandle) {
                folderStatusEl.textContent = '已连接本地文件夹: ' + (folderHandle.name || '已选择');
            } else {
                folderStatusEl.textContent = '未连接本地文件夹';
            }
        }
    }

    var filtered = getFilteredTemplates();

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var tpl = filtered[i];
        var realIndex = allTemplates.indexOf(tpl);
        var typeLabel = typeLabels[tpl.type] || tpl.type || '-';
        var sourceLabel = tpl.source === 'browser' ? '浏览器' : '本地';

        html += '<tr>' +
            '<td style="text-align:center; padding:4px 8px; border-bottom:1px solid var(--border-color);">' + (i + 1) + '</td>' +
            '<td style="padding:4px 8px; border-bottom:1px solid var(--border-color);">' + escapeHtml(tpl.name || '-') + '</td>' +
            '<td style="padding:4px 8px; border-bottom:1px solid var(--border-color);">' + escapeHtml(tpl.creator || '-') + '</td>' +
            '<td style="padding:4px 8px; border-bottom:1px solid var(--border-color);">' + escapeHtml(typeLabel) + '</td>' +
            '<td style="text-align:center; padding:4px 8px; border-bottom:1px solid var(--border-color);">' + escapeHtml(sourceLabel) + '</td>' +
            '<td style="text-align:center; padding:4px 8px; border-bottom:1px solid var(--border-color);">' +
                '<button class="btn-sm load-lib-btn" data-index="' + realIndex + '" style="background:var(--btn-success-bg); color:white; border:none; padding:2px 10px; border-radius:12px; cursor:pointer; margin-right:4px;">加载</button>' +
                '<button class="btn-sm delete-lib-btn" data-index="' + realIndex + '" style="background:var(--msg-error-bg); color:var(--msg-error-text); border:1px solid var(--msg-error-border); padding:2px 10px; border-radius:12px; cursor:pointer;">删除</button>' +
            '</td>' +
            '</tr>';
    }

    tbody.innerHTML = html;
}

/**
 * 从模板库加载模板
 */
function loadTemplateFromLib(index) {
    var tpl = allTemplates[index];
    if (!tpl) {
        showStatus('模板不存在', 'error');
        return;
    }

    try {
        if (tpl.type === 'config') {
            // 生成规则 — 派发自定义事件，由 main.js 切换到生成模板 tab 并加载
            var configEvent = new CustomEvent('template-lib-load-config', {
                detail: { config: tpl.config }
            });
            document.dispatchEvent(configEvent);
            showStatus('已加载生成规则模板"' + tpl.name + '"', 'success');

        } else if (tpl.type === 'extract_config') {
            // 提取配置 — 派发自定义事件，由 main.js 切换到字段提取 tab 并加载
            var extractEvent = new CustomEvent('template-lib-load-extract', {
                detail: {
                    fields: tpl.fields,
                    rowFilter: tpl.rowFilter || null
                }
            });
            document.dispatchEvent(extractEvent);
            showStatus('已加载提取配置模板"' + tpl.name + '"', 'success');

        } else if (tpl.type === 'data') {
            // 提取数据 — 直接显示到右侧预览
            if (tpl.data && Array.isArray(tpl.data)) {
                setPreview(tpl.data, '模板"' + tpl.name + '"（共 ' + tpl.data.length + ' 条）');
            }
            var dataEvent = new CustomEvent('template-lib-load-data', {
                detail: { data: tpl.data, name: tpl.name }
            });
            document.dispatchEvent(dataEvent);
            showStatus('已加载数据模板"' + tpl.name + '"', 'success');

        } else {
            showStatus('未知的模板类型: ' + tpl.type, 'error');
        }
    } catch (e) {
        showStatus('加载模板失败: ' + e.message, 'error');
    }
}

/**
 * 从模板库删除模板
 */
async function deleteTemplateFromLib(index) {
    var tpl = allTemplates[index];
    if (!tpl) {
        showStatus('模板不存在', 'error');
        return;
    }

    if (!(await dialog.confirm('确定要删除模板"' + tpl.name + '"吗？'))) return;

    try {
        if (tpl.source === 'browser') {
            // 从 localStorage 数组中移除
            var browserTemplates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY)) || [];
            var browserIdx = tpl._browserIndex;
            if (browserIdx >= 0 && browserIdx < browserTemplates.length) {
                browserTemplates.splice(browserIdx, 1);
                localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(browserTemplates));
            }
            showStatus('已删除浏览器模板"' + tpl.name + '"', 'info');

        } else if (tpl.source === 'local') {
            // 从本地文件夹中删除
            await deleteTemplateFromFolder(tpl.name);
            showStatus('已删除本地模板"' + tpl.name + '"', 'info');
        }

        await loadAllTemplates();
    } catch (e) {
        showStatus('删除模板失败: ' + e.message, 'error');
    }
}

/**
 * 设置本地文件夹
 */
async function handleSetupFolder() {
    try {
        var handle = await selectFolder();
        if (handle) {
            await loadAllTemplates();
            showStatus('已连接本地文件夹: ' + (handle.name || '已选择'), 'success');
        }
    } catch (e) {
        showStatus('设置文件夹失败: ' + e.message, 'error');
    }
}

/**
 * 清除本地文件夹连接
 */
async function handleClearFolder() {
    if (!(await dialog.confirm('确定要断开本地文件夹连接吗？'))) return;

    try {
        await clearStoredFolder();
        await loadAllTemplates();
        showStatus('已断开本地文件夹连接', 'info');
    } catch (e) {
        showStatus('清除文件夹失败: ' + e.message, 'error');
    }
}

/**
 * 从 JSON 文件导入模板到浏览器 localStorage
 */
function importTemplatesFromFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                showStatus('无效的模板文件：应为数组', 'error');
                return;
            }
            if (imported.length === 0) {
                showStatus('模板文件为空', 'error');
                return;
            }

            // 校验每项必须有 name，且至少有 config / fields / data 之一
            var validCount = 0;
            var invalidNames = [];
            for (var i = 0; i < imported.length; i++) {
                var tpl = imported[i];
                if (typeof tpl !== 'object' || !tpl.name) {
                    invalidNames.push('第' + (i + 1) + '项');
                    continue;
                }
                if (!tpl.config && !tpl.fields && !tpl.data) {
                    invalidNames.push(tpl.name || '第' + (i + 1) + '项');
                    continue;
                }

                // 推断缺失的 type
                if (!tpl.type) {
                    if (tpl.config) {
                        tpl.type = 'config';
                    } else if (tpl.fields) {
                        tpl.type = 'extract_config';
                    } else if (tpl.data) {
                        tpl.type = 'data';
                    }
                }

                validCount++;
            }

            if (validCount === 0) {
                showStatus('没有有效的模板可导入', 'error');
                return;
            }

            // 合并到浏览器 localStorage
            var browserTemplates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY)) || [];
            var overwritten = 0;

            for (var j = 0; j < imported.length; j++) {
                var imp = imported[j];
                if (!imp.name || (!imp.config && !imp.fields && !imp.data)) continue;

                var existingIndex = -1;
                for (var k = 0; k < browserTemplates.length; k++) {
                    if (browserTemplates[k].name === imp.name) {
                        existingIndex = k;
                        break;
                    }
                }

                if (existingIndex !== -1) {
                    browserTemplates[existingIndex] = imp;
                    overwritten++;
                } else {
                    browserTemplates.push(imp);
                }
            }

            localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(browserTemplates));
            loadAllTemplates();

            var msg = '导入成功，新增 ' + (validCount - overwritten) + ' 个';
            if (overwritten > 0) msg += '，覆盖 ' + overwritten + ' 个同名模板';
            if (invalidNames.length > 0) msg += '（跳过 ' + invalidNames.length + ' 个无效项）';
            showStatus(msg, 'success');
        } catch (err) {
            showStatus('解析失败：' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * 导出当前可见模板为 JSON 文件
 */
function exportAllTemplates() {
    var filtered = getFilteredTemplates();
    if (filtered.length === 0) {
        showStatus('没有模板可导出', 'error');
        return;
    }

    // 导出时去除 source / _browserIndex 等内部属性
    var exportData = [];
    for (var i = 0; i < filtered.length; i++) {
        var tpl = filtered[i];
        var clean = {};
        var keys = Object.keys(tpl);
        for (var k = 0; k < keys.length; k++) {
            if (keys[k] === 'source' || keys[k] === '_browserIndex') continue;
            clean[keys[k]] = tpl[keys[k]];
        }
        exportData.push(clean);
    }

    try {
        var json = JSON.stringify(exportData, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'template_lib_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        showStatus('模板库导出成功（' + exportData.length + ' 个）', 'success');
    } catch (e) {
        showStatus('导出失败: ' + e.message, 'error');
    }
}

/**
 * 将指定浏览器模板复制到本地文件夹
 */
async function saveToFolder(name) {
    try {
        var browserTemplates = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY)) || [];
        var tpl = null;
        for (var i = 0; i < browserTemplates.length; i++) {
            if (browserTemplates[i].name === name) {
                tpl = browserTemplates[i];
                break;
            }
        }

        if (!tpl) {
            showStatus('找不到模板"' + name + '"', 'error');
            return;
        }

        await writeTemplateToFolder(tpl);
        await loadAllTemplates();
        showStatus('已将"' + name + '"保存到本地文件夹', 'success');
    } catch (e) {
        showStatus('保存到文件夹失败: ' + e.message, 'error');
    }
}

// ============================================================
// HTML 转义
// ============================================================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ============================================================
// 初始化面板 — 绑定事件
// ============================================================

/**
 * 初始化模板库面板，绑定所有交互事件
 */
function initTemplateLibPanel() {
    // --- 文件夹操作按钮 ---
    var setupFolderBtn = document.getElementById('templateLibSetupFolderBtn');
    var clearFolderBtn = document.getElementById('templateLibClearFolderBtn');

    if (setupFolderBtn) {
        setupFolderBtn.addEventListener('click', function() { handleSetupFolder(); });
    }
    if (clearFolderBtn) {
        clearFolderBtn.addEventListener('click', function() { handleClearFolder(); });
    }

    // --- 搜索框 ---
    var searchInput = document.getElementById('templateLibSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchKeyword = searchInput.value.trim();
            renderTemplateLibTable();
        });
    }

    // --- 存储来源过滤按钮 ---
    var filterAllBtn = document.getElementById('filterAllBtn');
    var filterBrowserBtn = document.getElementById('filterBrowserBtn');
    var filterLocalBtn = document.getElementById('filterLocalBtn');

    function setActiveFilter(activeBtn) {
        var btns = [filterAllBtn, filterBrowserBtn, filterLocalBtn];
        for (var i = 0; i < btns.length; i++) {
            if (btns[i]) btns[i].classList.remove('active');
        }
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', function() {
            currentFilter = 'all';
            setActiveFilter(filterAllBtn);
            renderTemplateLibTable();
        });
    }
    if (filterBrowserBtn) {
        filterBrowserBtn.addEventListener('click', function() {
            currentFilter = 'browser';
            setActiveFilter(filterBrowserBtn);
            renderTemplateLibTable();
        });
    }
    if (filterLocalBtn) {
        filterLocalBtn.addEventListener('click', function() {
            currentFilter = 'local';
            setActiveFilter(filterLocalBtn);
            renderTemplateLibTable();
        });
    }

    // --- 导入/导出 ---
    var importBtn = document.getElementById('templateLibImportBtn');
    var fileInput = document.getElementById('templateLibFileInput');
    var exportBtn = document.getElementById('templateLibExportBtn');

    if (importBtn && fileInput) {
        importBtn.addEventListener('click', function() { fileInput.click(); });
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                importTemplatesFromFile(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', function() { exportAllTemplates(); });
    }

    // --- 事件委托：加载 / 删除按钮 ---
    var tbody = document.getElementById('templateLibBody');
    if (tbody) {
        tbody.addEventListener('click', function(e) {
            var target = e.target;
            if (target.classList.contains('load-lib-btn')) {
                var loadIdx = parseInt(target.dataset.index);
                if (!isNaN(loadIdx)) loadTemplateFromLib(loadIdx);
                e.preventDefault();
            }
            if (target.classList.contains('delete-lib-btn')) {
                var delIdx = parseInt(target.dataset.index);
                if (!isNaN(delIdx)) deleteTemplateFromLib(delIdx);
                e.preventDefault();
            }
        });
    }

    // --- 初始化：检测 File System Access API ---
    if (isFileSystemAccessSupported()) {
        // 显示文件夹操作按钮
        if (setupFolderBtn) setupFolderBtn.style.display = '';
        if (clearFolderBtn) clearFolderBtn.style.display = '';

        // 尝试恢复之前存储的文件夹
        (async function() {
            try {
                var folderHandle = getStoredFolder();
                if (folderHandle) {
                    showStatus('已恢复本地文件夹连接', 'info');
                }
            } catch (e) {
                console.warn('恢复文件夹失败:', e);
            }
        })();
    } else {
        // 不支持时隐藏文件夹按钮，显示提示
        if (setupFolderBtn) setupFolderBtn.style.display = 'none';
        if (clearFolderBtn) clearFolderBtn.style.display = 'none';

        var fallbackEl = document.getElementById('templateLibFolderFallback');
        if (fallbackEl) {
            fallbackEl.textContent = '当前浏览器不支持 File System Access API，仅可使用浏览器存储的模板。';
            fallbackEl.style.display = '';
        }
    }

    // --- 初始加载模板 ---
    loadAllTemplates();
}

// ============================================================
// 导出
// ============================================================
export { initTemplateLibPanel, loadAllTemplates };
