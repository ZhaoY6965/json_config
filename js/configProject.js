// configProject.js — ALCMS5 配置项目管理（多工作区）
// 支持：多目录加载、单文件拖拽导入、最近目录记忆

import { showStatus } from './core.js';
import {
    getSchemaByFileName, detectConfigType, getAllSchemas,
    getSchemaByKey, getForeignKeyFields, DataShape, FieldType
} from './configSchema.js';

// ========== 工作区状态 ==========
let projects = {};
let activeProjectId = null;
let projCounter = 0;

const ALL_CONFIG_FILES = getAllSchemas().map(s => s.fileName);

let dom = {};

function bindDom() {
    dom = {
        panel: document.getElementById('configProjectPanel'),
        folderBtn: document.getElementById('selectConfigFolderBtn'),
        folderName: document.getElementById('configFolderName'),
        configList: document.getElementById('configFileList'),
        configInfo: document.getElementById('configInfo'),
        projectStatus: document.getElementById('projectStatus'),
        projectSelector: document.getElementById('projectSelector'),
        saveBtn: document.getElementById('saveConfigBtn'),
        saveAllBtn: document.getElementById('saveAllConfigBtn'),
        refreshBtn: document.getElementById('refreshConfigBtn'),
        schemaBadge: document.getElementById('schemaBadge'),
        importFileInput: document.getElementById('configFileInput'),
    };
}

function getActiveProject() {
    return activeProjectId ? projects[activeProjectId] : null;
}

function getActiveConfigs() {
    const p = getActiveProject();
    return p ? p.configs : {};
}

// ========== 工作区切换 ==========

function switchProject(projId) {
    if (projId === activeProjectId) return;
    const proj = projects[projId];
    if (!proj) return;

    activeProjectId = projId;
    renderProjectSelector();
    renderConfigList();
    updateProjectStatus();

    dom.folderName.textContent = proj.name + (proj.readOnly ? '' : '');

    if (dom.saveBtn) dom.saveBtn.style.display = proj.readOnly ? 'none' : '';
    if (dom.saveAllBtn) dom.saveAllBtn.style.display = proj.readOnly ? 'none' : '';
    if (dom.refreshBtn) dom.refreshBtn.style.display = proj.dirHandle ? '' : 'none';

    const keys = Object.keys(proj.configs);
    if (keys.length > 0) {
        selectConfig(keys[0]);
    } else {
        dom.configInfo.style.display = 'none';
        document.dispatchEvent(new CustomEvent('config-selected', { detail: null }));
    }
}

function renderProjectSelector() {
    if (!dom.projectSelector) return;
    const ids = Object.keys(projects);
    if (ids.length <= 1) {
        dom.projectSelector.style.display = 'none';
        return;
    }
    dom.projectSelector.style.display = 'inline-flex';
    dom.projectSelector.innerHTML = ids.map(id => {
        const p = projects[id];
        return '<option value="' + id + '"' + (id === activeProjectId ? ' selected' : '') + '>' + p.name + '</option>';
    }).join('');
    dom.projectSelector.onchange = function(e) { switchProject(e.target.value); };
}

function createProject(name, fileList, dirHandle) {
    const id = 'proj_' + (projCounter++);
    projects[id] = {
        id, name, dirHandle: dirHandle || null,
        fileList: fileList || null,
        readOnly: !dirHandle,
        configs: {},
        currentConfigKey: null,
    };
    return id;
}

async function loadFilesIntoProject(projId, fileList) {
    const proj = projects[projId];
    if (!proj || !fileList) return { loaded: 0, errors: [] };
    const loaded = [], errors = [];

    // 建立 文件名→File 映射
    const fileMap = {};
    for (var i = 0; i < fileList.length; i++) {
        var f = fileList[i];
        if (!f.name.endsWith('.json')) continue;
        var bn = (f.webkitRelativePath || f.name).split('/').pop();
        fileMap[bn] = f;
    }

    // 按 Schema 定义顺序遍历已知文件
    for (const fileName of ALL_CONFIG_FILES) {
        var file = fileMap[fileName];
        if (!file) continue;
        delete fileMap[fileName]; // 标记已处理
        try {
            var text = await file.text();
            var data = JSON.parse(text.replace(/^\uFEFF/, ''));
            var schema = getSchemaByFileName(fileName);
            var schemaKey = null;
            if (schema) {
                for (const s of getAllSchemas()) {
                    if (s.fileName === fileName) { schemaKey = s.key; break; }
                }
            }
            // 预定义Schema是空占位但数据有实际结构 → 动态生成
            if (schemaKey && schema.fields.length === 0 && hasDataStructure(data)) {
                schema = createDynamicSchema(data, fileName);
            }
            if (schemaKey) {
                proj.configs[schemaKey] = { data, schema, fileName, modified: false };
                loaded.push(schema.label);
            }
        } catch (e) {
            errors.push(fileName + ': ' + e.message);
        }
    }

    // 处理剩余无法识别文件（20条预定义之外的自定义JSON）
    for (const fileName of Object.keys(fileMap)) {
        var file = fileMap[fileName];
        try {
            var text = await file.text();
            var data = JSON.parse(text.replace(/^\uFEFF/, ''));
            // 先尝试按内容检测类型
            var detected = detectConfigType(data);
            var schema = detected ? detected.schema : null;
            var schemaKey = detected ? detected.key : null;
            // 仍无法识别则动态生成结构
            if (!schemaKey) {
                schemaKey = 'dynamic_' + fileName.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
                schema = createDynamicSchema(data, fileName);
            }
            proj.configs[schemaKey] = { data, schema, fileName, modified: false };
            loaded.push(schema.label || fileName);
        } catch (e) {
            errors.push(fileName + ': ' + e.message);
        }
    }

    return { loaded: loaded.length, errors: errors.length };
}

/** 从任意JSON数据动态生成Schema */
function createDynamicSchema(data, fileName) {
    const key = 'dynamic_' + fileName.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
    const label = fileName.replace(/\.json$/i, '');
    let shape = DataShape.ARRAY;
    let sample = data;

    if (!Array.isArray(data)) {
        shape = DataShape.OBJECT;
        sample = [data];
    }

    const fields = [];
    const firstItem = sample[0] || {};
    for (const k of Object.keys(firstItem)) {
        const val = firstItem[k];
        let type = FieldType.STRING;
        if (typeof val === 'number') {
            type = Number.isInteger(val) ? FieldType.INT : FieldType.FLOAT;
        } else if (typeof val === 'boolean') {
            type = FieldType.BOOL;
        } else if (Array.isArray(val)) {
            type = FieldType.ARRAY;
        } else if (typeof val === 'object' && val !== null) {
            type = FieldType.OBJECT;
        }
        fields.push({ key: k, label: k, type });
    }

    return { key, label, fileName, shape, fields, description: '动态识别: ' + fileName };
}

// ========== 文件夹选择 ==========

async function selectFolder() {
    var inp = document.getElementById('configDirFileInput');
    if (!inp) return;
    inp.value = '';
    inp.click();
}

async function loadFromFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    var dirName = (fileList[0].webkitRelativePath || fileList[0].name).split('/')[0] || '已选目录';
    const projId = createProject(dirName, fileList);
    const result = await loadFilesIntoProject(projId, fileList);
    if (result.loaded > 0) {
        switchProject(projId);
        showStatus('已加载 ' + result.loaded + ' 个配置', 'success');
    } else {
        delete projects[projId];
        showStatus('未找到可识别的配置文件', 'error');
    }
    document.dispatchEvent(new CustomEvent('config-project-loaded', { detail: result }));
}

// ========== 单文件导入 ==========

async function importSingleFile(file) {
    if (!file || !file.name.endsWith('.json')) { showStatus('请选择JSON文件', 'error'); return; }
    let proj = getActiveProject();
    let isNewProject = false;
    if (!proj) {
        const projId = createProject('导入文件', null);
        isNewProject = true;
        proj = projects[projId];
    }
    try {
        const text = await file.text();
        const data = JSON.parse(text.replace(/^\uFEFF/, ''));
        const result = importJsonDataIntoProj(proj, file.name, data);
        if (result) {
            const isOverwrite = !isNewProject && proj.configs[result] && !isNewProject;
            if (isNewProject) {
                switchProject(proj.id);
                selectConfig(result);
            } else {
                renderConfigList();
                updateProjectStatus();
                selectConfig(result);
            }
            showStatus((isOverwrite ? '已覆盖: ' : '已导入: ') + file.name, 'success');
        } else {
            showStatus('无法识别该JSON文件类型', 'error');
        }
    } catch (e) {
        showStatus('导入失败: ' + e.message, 'error');
    }
}

function importJsonDataIntoProj(proj, fileName, data) {
    let schema = getSchemaByFileName(fileName);
    let schemaKey = null;
    if (schema) {
        for (const s of getAllSchemas()) {
            if (s.fileName === fileName) { schemaKey = s.key; break; }
        }
        // 预定义Schema是空占位(fields:[])但数据有实际结构 → 保留key，用数据动态生成Schema
        if (schemaKey && schema.fields.length === 0 && hasDataStructure(data)) {
            schema = createDynamicSchema(data, fileName);
        }
    }
    if (!schemaKey) {
        const detected = detectConfigType(data);
        if (detected) { schemaKey = detected.key; schema = detected.schema; }
    }
    if (!schemaKey) {
        schemaKey = 'dynamic_' + fileName.replace(/\.json$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
        schema = createDynamicSchema(data, fileName);
    }
    if (schemaKey) {
        proj.configs[schemaKey] = { data, schema, fileName, modified: true };
        return schemaKey;
    }
    return null;
}

/** 检查数据是否有实际结构（非空数组/对象） */
function hasDataStructure(data) {
    if (Array.isArray(data)) {
        if (data.length === 0) return false;
        return Object.keys(data[0]).length > 0;
    }
    if (data && typeof data === 'object') return Object.keys(data).length > 0;
    return false;
}

// ========== 配置列表 ==========

function renderConfigList() {
    if (!dom.configList) return;
    dom.configList.innerHTML = '';
    const cfgs = getActiveConfigs();
    const loadedKeys = Object.keys(cfgs);
    if (loadedKeys.length === 0) {
        dom.configList.innerHTML = '<div class="config-empty">暂无配置文件<br>选择Config目录或拖入JSON文件加载</div>';
        return;
    }

    const proj = getActiveProject();
    for (const key of loadedKeys) {
        const cfg = cfgs[key];
        if (!cfg) continue;
        const item = document.createElement('div');
        item.className = 'config-item' + (key === (proj ? proj.currentConfigKey : null) ? ' active' : '');
        item.dataset.key = key;
        const count = Array.isArray(cfg.data) ? cfg.data.length : 1;
        const modDot = cfg.modified ? '<span class="mod-dot" title="已修改"></span>' : '';
        item.innerHTML = '<span class="config-name">' + cfg.schema.label + '</span>' +
            '<span class="config-count">' + count + '条</span>' + modDot +
            '<span class="config-remove" title="从项目中移除">×</span>';
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('config-remove')) return;
            selectConfig(key);
        });
        item.querySelector('.config-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeConfig(key);
        });
        dom.configList.appendChild(item);
    }
}

function removeConfig(key) {
    const proj = getActiveProject();
    if (!proj || !proj.configs[key]) return;
    const label = proj.configs[key].schema.label || key;
    if (!confirm('确定从项目中移除 "' + label + '" 吗？')) return;
    delete proj.configs[key];
    if (proj.currentConfigKey === key) {
        proj.currentConfigKey = null;
        var section = document.getElementById('configEditorSection');
        if (section) section.style.display = 'none';
        var info = document.getElementById('configInfo');
        if (info) info.style.display = 'none';
        document.dispatchEvent(new CustomEvent('config-selected', { detail: null }));
    }
    renderConfigList();
    updateProjectStatus();
    showStatus('已移除: ' + label, 'info');
}

function updateProjectStatus() {
    if (!dom.projectStatus) return;
    const count = Object.keys(getActiveConfigs()).length;
    if (count === 0) {
        dom.projectStatus.textContent = '未加载项目';
        dom.projectStatus.className = 'project-status empty';
    } else {
        dom.projectStatus.textContent = count + ' 已加载';
        dom.projectStatus.className = 'project-status loaded';
    }
}

// ========== 配置选择 ==========

function selectConfig(key) {
    const proj = getActiveProject();
    if (!proj) return;
    proj.currentConfigKey = key;
    const cfg = proj.configs[key];
    if (!cfg) return;

    document.querySelectorAll('.config-item').forEach(el => {
        el.classList.toggle('active', el.dataset.key === key);
    });

    if (dom.configInfo) {
        const count = Array.isArray(cfg.data) ? cfg.data.length : 1;
        const fkFields = getForeignKeyFields(key);
        const fkInfo = fkFields.length > 0
            ? '<div class="info-row">外键字段: ' + fkFields.map(f => f.label).join(', ') + '</div>' : '';
        dom.configInfo.innerHTML =
            '<div class="info-row"><strong>' + cfg.schema.label + '</strong> (' + cfg.fileName + ')</div>' +
            '<div class="info-row">' + cfg.schema.description + '</div>' +
            '<div class="info-row">记录数: ' + count + '</div>' + fkInfo;
        dom.configInfo.style.display = '';
    }
    if (dom.schemaBadge) {
        dom.schemaBadge.textContent = cfg.schema.label;
        dom.schemaBadge.style.display = 'inline-block';
    }
    document.dispatchEvent(new CustomEvent('config-selected', {
        detail: { key, data: cfg.data, schema: cfg.schema, fileName: cfg.fileName }
    }));
}

// ========== 导出API ==========

export function getCurrentConfig() {
    const p = getActiveProject();
    return (p && p.currentConfigKey) ? p.configs[p.currentConfigKey] || null : null;
}

export function getCurrentSchema() {
    const c = getCurrentConfig();
    return c ? c.schema : null;
}

export function getCurrentKey() {
    const p = getActiveProject();
    return p ? p.currentConfigKey : null;
}

export function updateCurrentData(newData) {
    const p = getActiveProject();
    if (!p || !p.currentConfigKey) return;
    p.configs[p.currentConfigKey].data = newData;
    p.configs[p.currentConfigKey].modified = true;
    renderConfigList();
}

export function getConfigData(schemaKey) {
    const cfgs = getActiveConfigs();
    return cfgs[schemaKey] ? cfgs[schemaKey].data : null;
}

export function getFkOptions(targetSchemaKey, idField, displayField) {
    const cfg = getActiveConfigs()[targetSchemaKey];
    if (!cfg || !Array.isArray(cfg.data)) return [];
    return cfg.data.map(item => ({
        value: item[idField] || '',
        label: (item[displayField] || item[idField] || '') + (item[idField] ? ' (' + item[idField] + ')' : ''),
    }));
}

export function getAllLoadedConfigs() {
    const p = getActiveProject();
    return p ? p.configs : {};
}

export function isProjectLoaded() {
    return !!getActiveProject() && Object.keys(getActiveConfigs()).length > 0;
}

export function getProjects() { return Object.values(projects); }
export function getActiveProjectId() { return activeProjectId; }
export function switchToProject(projId) { if (projects[projId]) switchProject(projId); }
export async function loadSingleFile(file) { return importSingleFile(file); }
export function importJsonData(fileName, data) {
    const p = getActiveProject();
    return p ? importJsonDataIntoProj(p, fileName, data) : null;
}

/**
 * 自动保存当前配置到本地文件
 * 有 dirHandle 直接写文件，没有则尝试 showDirectoryPicker 获取写入权限
 * 静默执行，不弹状态提示
 */
export async function autoSave() {
    const p = getActiveProject();
    if (!p || !p.currentConfigKey || !p.configs[p.currentConfigKey]) return;
    const cfg = p.configs[p.currentConfigKey];

    // 只有已有 dirHandle（已通过 showDirectoryPicker 获得写入权限）才写入
    // 无 dirHandle 时（file:// 协议 webkitdirectory），数据保留在内存中
    if (!p.dirHandle) return;

    try {
        const fh = await p.dirHandle.getFileHandle(cfg.fileName, { create: true });
        const w = await fh.createWritable();
        await w.write(JSON.stringify(cfg.data, null, 4));
        await w.close();
    } catch (e) {
        console.warn('[自动保存失败]', cfg.fileName, e.message);
    }
}

// ========== 保存 ==========

async function saveCurrentConfig() {
    const p = getActiveProject();
    if (!p || !p.currentConfigKey || !p.configs[p.currentConfigKey]) {
        showStatus('没有选中的配置', 'error');
        return;
    }
    await saveConfig(p.currentConfigKey);
}

async function saveConfig(key) {
    const p = getActiveProject();
    if (!p) return;
    const cfg = p.configs[key];
    if (!cfg || !p.dirHandle) return;
    try {
        const fh = await p.dirHandle.getFileHandle(cfg.fileName, { create: true });
        const w = await fh.createWritable();
        await w.write(JSON.stringify(cfg.data, null, 4));
        await w.close();
        cfg.modified = false;
        renderConfigList();
        showStatus(cfg.schema.label + ' 已保存', 'success');
    } catch (e) { showStatus('保存失败: ' + e.message, 'error'); }
}

async function saveAllConfigs() {
    const p = getActiveProject();
    if (!p || !p.dirHandle) return;
    let n = 0;
    for (const key of Object.keys(p.configs)) {
        if (p.configs[key].modified) { await saveConfig(key); n++; }
    }
    if (n === 0) showStatus('没有修改的配置', 'info');
    else showStatus('已保存 ' + n + ' 个配置', 'success');
}

async function loadAllConfigs() {
    const p = getActiveProject();
    if (!p || !p.dirHandle) return;
    const dirFiles = [];
    try {
        for await (const e of p.dirHandle.values()) {
            if (e.kind === 'file') dirFiles.push(e.name);
        }
    } catch (e) { console.error('扫描目录失败:', e); return; }

    let loaded = [], missing = [], errors = [];
    for (const fileName of ALL_CONFIG_FILES) {
        let an = dirFiles.find(f => f === fileName) || dirFiles.find(f => f.toLowerCase() === fileName.toLowerCase());
        if (!an) { missing.push(fileName); continue; }
        try {
            const fh = await p.dirHandle.getFileHandle(an);
            const f = await fh.getFile();
            const data = JSON.parse((await f.text()).replace(/^\uFEFF/, ''));
            let schema = getSchemaByFileName(fileName);
            let sk = null;
            if (schema) { for (const s of getAllSchemas()) { if (s.fileName === fileName) { sk = s.key; break; } } }
            if (!sk) { const d = detectConfigType(data); if (d) { sk = d.key; schema = d.schema; } }
            if (sk) { p.configs[sk] = { data, schema, fileName: an, modified: false }; loaded.push(schema.label); }
            else errors.push(an + ': 无法识别');
        } catch (e) { errors.push(an + ': ' + e.message); }
    }

    renderConfigList();
    updateProjectStatus();
    let msg = '已加载 ' + loaded.length + ' 个配置';
    if (missing.length > 0) msg += '，缺失 ' + missing.length + ' 个';
    if (errors.length > 0) msg += '，错误 ' + errors.length + ' 个';
    showStatus(msg, loaded.length > 0 ? 'success' : 'error');
    if (loaded.length > 0) selectConfig(Object.keys(p.configs)[0]);
}

// ========== 初始化 ==========

export function initConfigProject() {
    bindDom();

    if (dom.folderBtn) dom.folderBtn.addEventListener('click', selectFolder);

    var dirInput = document.getElementById('configDirFileInput');
    if (dirInput) dirInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files.length > 0) loadFromFiles(e.target.files);
    });

    var importBtn = document.getElementById('importConfigBtn');
    if (importBtn) importBtn.addEventListener('click', function() {
        if (dom.importFileInput) dom.importFileInput.click();
    });

    if (dom.importFileInput) dom.importFileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files.length > 0) {
            importSingleFile(e.target.files[0]);
            e.target.value = '';
        }
    });

    // 全左侧区域拖拽导入：整个配置项目面板都是拖拽目标
    var panelEl = dom.panel;
    if (panelEl) {
        ['dragenter','dragover'].forEach(function(ev) {
            panelEl.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); });
        });
        panelEl.addEventListener('dragover', function(e) {
            panelEl.style.outline = '2px dashed var(--accent-color)';
            panelEl.style.outlineOffset = '-10px';
        });
        panelEl.addEventListener('dragleave', function(e) {
            if (e.target === panelEl || !panelEl.contains(e.relatedTarget)) {
                panelEl.style.outline = '';
                panelEl.style.outlineOffset = '';
            }
        });
        panelEl.addEventListener('drop', function(e) {
            e.preventDefault(); e.stopPropagation();
            panelEl.style.outline = '';
            panelEl.style.outlineOffset = '';
            var files = e.dataTransfer.files;
            if (!files.length) return;
            var hasDir = false;
            for (var f of files) { if (f.webkitRelativePath && f.webkitRelativePath.includes('/')) { hasDir = true; break; } }
            if (hasDir) loadFromFiles(files);
            else { for (var sf of files) { if (sf.name.endsWith('.json')) importSingleFile(sf); } }
        });
    }

    if (dom.saveBtn) dom.saveBtn.addEventListener('click', saveCurrentConfig);
    if (dom.saveAllBtn) dom.saveAllBtn.addEventListener('click', saveAllConfigs);
    if (dom.refreshBtn) dom.refreshBtn.addEventListener('click', loadAllConfigs);

    var removeBtn = document.getElementById('configRemoveBtn');
    if (removeBtn) removeBtn.addEventListener('click', function() {
        var key = getCurrentKey();
        if (key) removeConfig(key);
    });

    if (dom.configList) {
        dom.configList.innerHTML = '<div class="config-empty">点击"选择目录"加载ALCMS5配置<br>或拖入JSON文件到下方区域</div>';
    }
}
