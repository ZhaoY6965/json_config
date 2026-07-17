// cardDesigner.js — 页面设计器
// 模式一：卡片模式（ccr_card_config / circuit_card_config）— 按 card 定义网格，拖拽写回 row/colum
// 模式二：站点模式（ccr_config / circuit_config）— 按 site 分组，用户自定义行列，拖拽写回 card_row/card_colum

import { showStatus } from './core.js';
import { dialog } from './dialog.js';
import { getAllLoadedConfigs, getCurrentKey } from './configProject.js';

// ========== 状态 ==========
/** 当前设计模式: 'ccr_card' | 'circuit_card' | 'ccr_site' | 'circuit_site' */
let currentDesignMode = null;
let cardDom = {};

/** 拖动来源记录 */
let dragSource = null;
/** 站点 id → 名称 映射（来自 site_config.json） */
let siteNameMap = {};

function bindCardDom() {
    cardDom = {
        designerBtn: document.getElementById('cardDesignerBtn'),
        modal: document.getElementById('cardDesignerModal'),
        closeBtn: document.getElementById('cardDesignerClose'),
        // 卡片模式
        cardSelector: document.getElementById('cdCardSelector'),
        // 站点模式
        siteMode: document.getElementById('cdSiteMode'),
        cardMode: document.getElementById('cdCardMode'),
        siteSelector: document.getElementById('cdSiteSelector'),
        siteRows: document.getElementById('cdSiteRows'),
        siteCols: document.getElementById('cdSiteCols'),
        siteGenerateBtn: document.getElementById('cdSiteGenerateBtn'),
        // 共用
        gridContainer: document.getElementById('cdGridContainer'),
        ccrPanel: document.getElementById('cdCcrPanel'),
        panelTitle: document.getElementById('cdPanelTitle'),
        ccrFilter: document.getElementById('cdCcrFilter'),
        ccrList: document.getElementById('cdCcrList'),
        placementInfo: document.getElementById('cdPlacementInfo'),
        generateBtn: document.getElementById('cdGenerateBtn'),
        applyBtn: document.getElementById('cdApplyBtn'),
        clearBtn: document.getElementById('cdClearBtn'),
        outputArea: document.getElementById('cdOutputArea'),
        designTitle: document.getElementById('cdDesignTitle'),
        sortSelector: document.getElementById('cdSortSelector'),
        sortMenu: document.getElementById('cdSortMenu'),
        sortLabel: document.getElementById('cdSortLabel'),
    };
}

// ========== 配置检测与模式判断 ==========

export function isCardConfig(key, schema) {
    if (!key || !schema) return false;
    return key === 'ccr_card_config' || key === 'circuit_card_config' ||
           key === 'ccr_config' || key === 'circuit_config' ||
           (schema.label && schema.label.includes('card'));
}

/**
 * 返回设计模式:
 *   'ccr_card'   → ccr_card_config（卡片模式）
 *   'circuit_card'→ circuit_card_config（卡片模式）
 *   'ccr_site'   → ccr_config（站点模式）
 *   'circuit_site'→ circuit_config（站点模式）
 */
function getDesignMode(key) {
    if (key === 'ccr_config') return 'ccr_site';
    if (key === 'circuit_config') return 'circuit_site';
    if (key === 'ccr_card_config') return 'ccr_card';
    if (key === 'circuit_card_config') return 'circuit_card';
    if (key && key.includes('card')) return 'ccr_card';
    return null;
}

export function onConfigSelected(detail) {
    if (!detail || !detail.key || !detail.schema) {
        if (cardDom.designerBtn) cardDom.designerBtn.style.display = 'none';
        currentDesignMode = null;
        return;
    }
    const isCard = isCardConfig(detail.key, detail.schema);
    if (cardDom.designerBtn) {
        cardDom.designerBtn.style.display = isCard ? '' : 'none';
    }
    if (isCard) {
        currentDesignMode = getDesignMode(detail.key);
    } else {
        currentDesignMode = null;
    }
}

// ========== 打开设计器入口 ==========

export function openCardDesigner() {
    const allConfigs = getAllLoadedConfigs();
    if (!allConfigs || Object.keys(allConfigs).length === 0) {
        showStatus('请先加载配置文件', 'error');
        return;
    }

    if (!currentDesignMode) {
        const key = getCurrentKey();
        currentDesignMode = getDesignMode(key);
    }

    switch (currentDesignMode) {
        case 'ccr_site':      openCcrSiteDesigner(); break;
        case 'circuit_site':  openCircuitSiteDesigner(); break;
        case 'ccr_card':      openCcrCardDesigner(); break;
        case 'circuit_card':  openCircuitCardDesigner(); break;
        default:
            showStatus('未识别的设计类型', 'error');
    }
}

// ===================================================================
// 通用工具
// ===================================================================

function findConfigByFileName(allConfigs, fileName) {
    for (const key of Object.keys(allConfigs)) {
        if (allConfigs[key].fileName === fileName) return allConfigs[key];
    }
    return null;
}

/** 在 placements 中查找 itemId 所在坐标 {row, col} */
function findPlacedPosition(placements, itemId) {
    for (const cId of Object.keys(placements)) {
        const rData = placements[cId];
        for (const r of Object.keys(rData)) {
            for (const c of Object.keys(rData[r])) {
                if (rData[r][c] === itemId) {
                    return { row: parseInt(r), col: parseInt(c) };
                }
            }
        }
    }
    return null;
}

/**
 * 构建站点列表：优先以 site_config.json（站点定义）为权威来源，
 * 再补充 ccr/circuit 数据里出现的 site_id，确保下拉显示完整的站点集合。
 * 这样即使某些站点（如塔台、运管中心）在 ccr_config 中没有对应条目，
 * 也会作为站点出现在下拉菜单中。
 * @returns {{ids:string[], names:Object}} ids=排序后的站点id列表；names=id→名称
 */
function getSiteList(allConfigs, items) {
    var names = {};

    // 1) 站点定义文件（权威来源）
    var siteConfig = findConfigByFileName(allConfigs, 'site_config.json');
    if (siteConfig && Array.isArray(siteConfig.data)) {
        for (var i = 0; i < siteConfig.data.length; i++) {
            var sObj = siteConfig.data[i];
            var sid = sObj && sObj.id;
            if (sid) names[sid] = (sObj.name != null ? sObj.name : '');
        }
    }

    // 2) 补充数据里出现的站点（防止站点定义缺失某些站点时遗漏）
    if (Array.isArray(items)) {
        for (var j = 0; j < items.length; j++) {
            var s = items[j] && items[j].site_id;
            if (s && !Object.prototype.hasOwnProperty.call(names, s)) names[s] = '';
        }
    }

    return { ids: Object.keys(names).sort(), names: names };
}

// ===================================================================
// 通用网格构建器（供卡片模式和站点模式共用）
// ===================================================================

/**
 * @param {string}  gridLabel     - 网格标题文本
 * @param {number}  rows          - 行数
 * @param {number}  cols          - 列数
 * @param {string}  containerKey  - 容器标识（卡片模式下是 cardId，站点模式下是 siteId）
 * @param {object}  placements    - { [containerKey]: { [row]: { [col]: itemId } } }
 * @param {array}   items         - 全部数据条目（用于查找 item 显示名）
 * @param {function} onDrop       - (containerKey, row, col, itemId) => void
 * @param {function} onRemove     - (containerKey, row, col) => void
 * @param {function} itemLabel    - (item) => string
 */
function buildGridTable(gridLabel, rows, cols, containerKey, placements, items, onDrop, onRemove, itemLabel) {
    const container = cardDom.gridContainer;
    if (!container) return;

    container.innerHTML = '';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;font-size:14px;margin-bottom:8px;color:var(--text-primary);';
    title.textContent = gridLabel + ' (' + rows + '\u00d7' + cols + ')';
    container.appendChild(title);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border:1px solid var(--border-color);border-radius:6px;flex:1;min-height:0;';

    const table = document.createElement('table');
    table.className = 'cd-grid-table';
    table.style.cssText = 'border-collapse:collapse;font-size:11px;';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    const cornerTh = document.createElement('th');
    cornerTh.style.cssText = 'position:sticky;top:0;left:0;z-index:3;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);width:28px;overflow:hidden;';
    cornerTh.textContent = '';
    headRow.appendChild(cornerTh);

    for (let c = 0; c < cols; c++) {
        const th = document.createElement('th');
        th.style.cssText = 'position:sticky;top:0;z-index:2;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);';
        th.textContent = c;
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const containerPlacements = (placements && placements[containerKey]) ? placements[containerKey] : {};

    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');

        const rowLabel = document.createElement('th');
        rowLabel.style.cssText = 'position:sticky;left:0;z-index:1;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);width:28px;overflow:hidden;';
        rowLabel.textContent = r;
        tr.appendChild(rowLabel);

        for (let c = 0; c < cols; c++) {
            const td = document.createElement('td');
            td.className = 'cd-grid-cell';
            td.dataset.row = r;
            td.dataset.col = c;
            td.tabIndex = 0;
            td.style.cssText = 'border:1px solid var(--border-color);text-align:center;vertical-align:middle;cursor:pointer;transition:background 0.15s;';

            const itemId = containerPlacements[r] ? containerPlacements[r][c] : null;
            if (itemId) {
                const item = items.find(it => it.id === itemId);
                const inner = document.createElement('div');
                inner.className = 'cd-cell-inner';
                inner.textContent = item ? itemLabel(item) : itemId;
                inner.title = item ? itemLabel(item) + ' (' + itemId + ')' : itemId;
                inner.style.cssText = 'width:100%;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;text-align:center;box-sizing:border-box;word-break:break-word;line-height:1.15;font-size:10px;padding:0 2px;';
                td.appendChild(inner);
                td.style.background = 'var(--accent-color, #0078D4)';
                td.style.color = 'white';
                td.style.fontWeight = '600';
                td.classList.add('cd-cell-occupied');
                td.draggable = true;
                td.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', itemId);
                    dragSource = { containerKey: containerKey, row: r, col: c };
                    this.style.opacity = '0.6';
                });
                td.addEventListener('dragend', function(e) {
                    this.style.opacity = '1';
                });
            }

            // 拖放目标
            td.addEventListener('dragover', function(e) { e.preventDefault(); this.style.background = 'var(--bg-hover)'; });
            td.addEventListener('dragleave', function(e) {
                this.style.background = this.querySelector('.cd-cell-inner') ? 'var(--accent-color, #0078D4)' : '';
            });
            td.addEventListener('drop', async function(e) {
                e.preventDefault();
                const droppedId = e.dataTransfer.getData('text/plain');
                if (!droppedId) return;
                const targetR = parseInt(this.dataset.row);
                const targetC = parseInt(this.dataset.col);
                if (isNaN(targetR) || isNaN(targetC)) return;

                // 来自网格自身 → 移动/交换
                if (dragSource && dragSource.containerKey === containerKey) {
                    const srcR = dragSource.row;
                    const srcC = dragSource.col;
                    if (srcR === targetR && srcC === targetC) {
                        dragSource = null;
                        return;
                    }
                    const existingId = containerPlacements[targetR] ? containerPlacements[targetR][targetC] : null;
                    if (existingId) {
                        if (!(await dialog.confirm('该位置已有项目，是否交换？'))) {
                            dragSource = null;
                            return;
                        }
                        if (!containerPlacements[srcR]) containerPlacements[srcR] = {};
                        containerPlacements[srcR][srcC] = existingId;
                    } else {
                        delete containerPlacements[srcR][srcC];
                        if (Object.keys(containerPlacements[srcR]).length === 0) delete containerPlacements[srcR];
                    }
                    if (!containerPlacements[targetR]) containerPlacements[targetR] = {};
                    containerPlacements[targetR][targetC] = droppedId;
                    dragSource = null;
                    buildGridTable(gridLabel, rows, cols, containerKey, placements, items, onDrop, onRemove, itemLabel);
                    updatePlacementInfo();
                    showStatus('\u5df2\u79fb\u52a8: ' + droppedId + ' \u2192 (' + targetR + ',' + targetC + ')', 'success');
                } else {
                    onDrop(containerKey, targetR, targetC, droppedId);
                }
                dragSource = null;
            });
            // 双击/右键/键盘 删除
            ['dblclick', 'contextmenu'].forEach(evtType => {
                td.addEventListener(evtType, async function(e) {
                    if (evtType === 'contextmenu') e.preventDefault();
                    const rid = parseInt(this.dataset.row);
                    const cid = parseInt(this.dataset.col);
                    if (containerPlacements[rid] && containerPlacements[rid][cid]) {
                        if (await dialog.confirm('\u79fb\u9664\u8be5\u4f4d\u7f6e\u7684\u9879\u76ee\u5417?')) {
                            onDrop(containerKey, rid, cid, '__REMOVE__');
                        }
                    }
                });
            });
            td.addEventListener('keydown', async function(e) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    const rid = parseInt(this.dataset.row);
                    const cid = parseInt(this.dataset.col);
                    if (containerPlacements[rid] && containerPlacements[rid][cid]) {
                        if (await dialog.confirm('\u79fb\u9664 (' + rid + ',' + cid + ') \u7684\u9879\u76ee?')) {
                            onDrop(containerKey, rid, cid, '__REMOVE__');
                        }
                    }
                }
            });

            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    // 自适应尺寸：列宽和行高均按容器可用空间等分，填满容器
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            var boxW = wrapper.clientWidth;
            var boxH = wrapper.clientHeight;
            if (boxW <= 0 || boxH <= 0) return;

            // 标题占的高度
            var titleH = title.offsetHeight || 0;
            var availH = boxH - titleH - 2;   /* 减去 border */
            if (availH <= 0) return;

            // 表头高度（先不设，测量后再用）
            var hdrH = thead.offsetHeight || 28;
            var bodyH = availH - hdrH;
            if (bodyH <= 0) bodyH = availH * 0.9;

            // 列宽：去掉行号列(28px)后均分
            var dataColW = Math.max(16, Math.floor((boxW - 28) / cols));
            // 行高：均分 body 区域
            var cellH = Math.max(18, Math.floor(bodyH / rows));

            var colThs = headRow.querySelectorAll('th');
            for (var ci = 1; ci < colThs.length; ci++) {
                colThs[ci].style.width = dataColW + 'px';
                colThs[ci].style.overflow = 'hidden';
                colThs[ci].style.textOverflow = 'ellipsis';
                colThs[ci].style.whiteSpace = 'nowrap';
            }

            var allRows = tbody.querySelectorAll('tr');
            for (var ri = 0; ri < allRows.length; ri++) {
                allRows[ri].style.height = cellH + 'px';
                var tcells = allRows[ri].querySelectorAll('td, th');
                for (var ci = 0; ci < tcells.length; ci++) {
                    tcells[ci].style.height = cellH + 'px';
                    tcells[ci].style.maxHeight = cellH + 'px';
                    tcells[ci].style.overflow = 'hidden';
                    /* 数据单元格设列宽 */
                    if (tcells[ci].tagName === 'TD') {
                        tcells[ci].style.width = dataColW + 'px';
                        tcells[ci].style.minWidth = dataColW + 'px';
                    }
                }
                var inners = allRows[ri].querySelectorAll('.cd-cell-inner');
                for (var ci = 0; ci < inners.length; ci++) {
                    inners[ci].style.height = (cellH - 4) + 'px';
                    inners[ci].style.maxHeight = (cellH - 4) + 'px';
                    inners[ci].style.overflow = 'hidden';
                    inners[ci].style.whiteSpace = 'normal';
                }
            }

            // 表头行高同步
            headRow.style.height = Math.min(cellH, hdrH) + 'px';
        });
    });
}

function updatePlacementInfo() {
    const info = cardDom.placementInfo;
    if (!info) return;
    let total = 0;
    let state;
    switch (currentDesignMode) {
        case 'ccr_card': state = ccrState; break;
        case 'circuit_card': state = circuitState; break;
        case 'ccr_site': state = ccrSiteState; break;
        case 'circuit_site': state = circuitSiteState; break;
        default: return;
    }
    // 站点模式：只统计当前选中站点的放置数
    var isSiteMode = (currentDesignMode === 'ccr_site' || currentDesignMode === 'circuit_site');
    var siteKey = isSiteMode ? state.selectedSite : null;

    for (const key of Object.keys(state.placements)) {
        // 站点模式下跳过非当前站点
        if (isSiteMode && siteKey && key !== siteKey) continue;
        const rData = state.placements[key];
        for (const r of Object.keys(rData)) {
            total += Object.keys(rData[r]).length;
        }
    }

    if (isSiteMode && siteKey) {
        info.textContent = siteKey + ' - \u5f53\u524d\u5171 ' + total + ' \u4e2a\u653e\u7f6e\u4f4d\u7f6e';
    } else {
        info.textContent = '\u5f53\u524d\u5171 ' + total + ' \u4e2a\u653e\u7f6e\u4f4d\u7f6e';
    }
}

// ===================================================================
// ════════════════════════════════════════════════════════════════
//  模式一：卡片设计器（ccr_card_config / circuit_card_config）
//  原有逻辑不变 — 按 card 定义网格，拖拽写回 row/colum
// ════════════════════════════════════════════════════════════════
// ===================================================================

// --- CCR 卡片 ---

const ccrState = {
    cards: [],
    allCcrs: [],
    placements: {},
    selectedCardId: null,
};

function openCcrCardDesigner() {
    switchToCardModeUI();

    const allConfigs = getAllLoadedConfigs();
    const cardConfig = findConfigByFileName(allConfigs, 'ccr_card_config.json');
    if (!cardConfig || !Array.isArray(cardConfig.data) || cardConfig.data.length === 0) {
        showStatus('\u672a\u627e\u5230\u5361\u7247\u5b9a\u4e49\uff08ccr_card_config.json\uff09', 'error');
        return;
    }
    ccrState.cards = cardConfig.data;

    const ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    ccrState.allCcrs = (ccrConfig && Array.isArray(ccrConfig.data)) ? ccrConfig.data : [];
    if (!ccrConfig) {
        showStatus('\u63d0\u793a: \u672a\u52a0\u8f7d ccr_config.json\uff0c\u8c03\u5149\u5668\u5217\u8868\u4e3a\u7a7a', 'info');
    }

    ccrState.placements = {};
    ccrState.selectedCardId = null;

    if (cardDom.designTitle) cardDom.designTitle.textContent = '\u8c03\u5149\u5668\u5361\u7247 - \u9875\u9762\u8bbe\u8ba1';
    if (cardDom.applyBtn) cardDom.applyBtn.textContent = '\u5e94\u7528\u5230ccr_config';
    if (cardDom.panelTitle) cardDom.panelTitle.textContent = '\u8c03\u5149\u5668\u5217\u8868';
    if (cardDom.ccrFilter) cardDom.ccrFilter.placeholder = '\u641c\u7d22\u8c03\u5149\u5668...';

    renderCardSelector();

    if (cardDom.modal) cardDom.modal.style.display = '';
    if (ccrState.cards.length > 0) selectCard(ccrState.cards[0].id);
}

function renderCardSelector() {
    const sel = cardDom.cardSelector;
    if (!sel) return;
    sel.innerHTML = '<option value="">-- \u9009\u62e9\u5361\u7247 --</option>' +
        ccrState.cards.map(c => '<option value="' + c.id + '">' + c.name + ' (' + c.id + ') ' + c.rows + '\u00d7' + c.columns + '</option>').join('');
    sel.onchange = function(e) {
        if (e.target.value) selectCard(e.target.value);
    };
}

function selectCard(cardId) {
    const card = ccrState.cards.find(c => c.id === cardId);
    if (!card) return;
    ccrState.selectedCardId = cardId;
    if (!ccrState.placements[cardId]) ccrState.placements[cardId] = {};
    if (cardDom.cardSelector) cardDom.cardSelector.value = cardId;

    renderCcrGrid(card);
    renderCcrList(card.site_id);
    updatePlacementInfo();
}

function ccrItemLabel(ccr) { return ccr.name; }

function renderCcrGrid(card) {
    buildGridTable(card.name, card.rows, card.columns, card.id, ccrState.placements, ccrState.allCcrs,
        handleCcrCardDrop, handleCcrCardRemove, ccrItemLabel);
}

function renderCcrList(siteId) {
    const list = cardDom.ccrList;
    const filter = cardDom.ccrFilter;
    if (!list) return;

    const filtered = ccrState.allCcrs.filter(ccr => {
        if (siteId && ccr.site_id !== siteId) return false;
        if (filter && filter.value) {
            const kw = filter.value.toLowerCase();
            return ccr.name.toLowerCase().includes(kw) || ccr.id.toLowerCase().includes(kw);
        }
        return true;
    });

    list.innerHTML = '';
    if (ccrState.allCcrs.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">\u672a\u52a0\u8f7d ccr_config.json<br>\u8bf7\u5148\u9009\u62e9Config\u76ee\u5f55\u6279\u91cf\u52a0\u8f7d</div>';
        return;
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">\u8be5\u7ad9\u70b9\u6682\u65e0\u5339\u914d\u7684\u8c03\u5149\u5668</div>';
        return;
    }

    filtered.sort(getSortComparator(currentCcrSortBy, false));

    var placedIds = {};
    for (var cId in ccrState.placements) {
        var rData = ccrState.placements[cId];
        for (var r in rData) { for (var c in rData[r]) { placedIds[rData[r][c]] = true; } }
    }

    for (const ccr of filtered) {
        const isPlaced = !!placedIds[ccr.id];
        renderItemInList(list, ccr.id, ccr.name, ccr.soc_index, isPlaced, ccrState.placements, 'ccr');
    }
}

async function handleCcrCardDrop(containerKey, row, col, ccrId) {
    if (ccrId === '__REMOVE__') {
        removePlacement(ccrState, containerKey, row, col);
        return;
    }
    if (!containerKey || row == null || col == null || !ccrId) return;
    const r = parseInt(row), c = parseInt(col);
    if (isNaN(r) || isNaN(c)) return;

    for (var cId in ccrState.placements) {
        var rd = ccrState.placements[cId];
        for (var rs in rd) { for (var cs in rd[rs]) { if (rd[rs][cs] === ccrId) { showStatus('\u8be5\u8c03\u5149\u5668\u5df2\u5728\u7f51\u683c\u4e2d', 'warning'); return; } } }
    }
    if (!ccrState.placements[containerKey]) ccrState.placements[containerKey] = {};
    if (!ccrState.placements[containerKey][r]) ccrState.placements[containerKey][r] = {};
    if (ccrState.placements[containerKey][r][c]) { if (!(await dialog.confirm('\u66ff\u6362?'))) return; }
    ccrState.placements[containerKey][r][c] = ccrId;

    const card = ccrState.cards.find(ca => ca.id === containerKey);
    if (card) renderCcrGrid(card);
    renderCcrList(card ? card.site_id : null);
    updatePlacementInfo();
    showStatus('\u5df2\u653e\u7f6e: ' + ccrId + ' \u2192 (' + r + ',' + c + ')', 'success');
}

function handleCcrCardRemove(containerKey, row, col) {
    removePlacement(ccrState, containerKey, row, col);
}

// --- 回路卡片 ---

const circuitState = {
    cards: [],
    allCircuits: [],
    placements: {},
    selectedCardId: null,
};

function openCircuitCardDesigner() {
    switchToCardModeUI();

    const allConfigs = getAllLoadedConfigs();
    const cardConfig = findConfigByFileName(allConfigs, 'circuit_card_config.json');
    if (!cardConfig || !Array.isArray(cardConfig.data) || cardConfig.data.length === 0) {
        showStatus('\u672a\u627e\u5230\u5361\u7247\u5b9a\u4e49\uff08circuit_card_config.json\uff09', 'error');
        return;
    }
    circuitState.cards = cardConfig.data;

    const circuitConfig = findConfigByFileName(allConfigs, 'circuit_config.json');
    circuitState.allCircuits = (circuitConfig && Array.isArray(circuitConfig.data)) ? circuitConfig.data : [];
    if (!circuitConfig) {
        showStatus('\u63d0\u793a: \u672a\u52a0\u8f7d circuit_config.json', 'info');
    }

    circuitState.placements = {};
    circuitState.selectedCardId = null;

    if (cardDom.designTitle) cardDom.designTitle.textContent = '\u56de\u8def\u5361\u7247 - \u9875\u9762\u8bbe\u8ba1';
    if (cardDom.applyBtn) cardDom.applyBtn.textContent = '\u5e94\u7528\u5230circuit_config';
    if (cardDom.panelTitle) cardDom.panelTitle.textContent = '\u56de\u8def\u5217\u8868';
    if (cardDom.ccrFilter) cardDom.ccrFilter.placeholder = '\u641c\u7d22\u56de\u8def...';

    renderCircuitCardSelector();

    if (cardDom.modal) cardDom.modal.style.display = '';
    if (circuitState.cards.length > 0) selectCircuitCard(circuitState.cards[0].id);
}

function renderCircuitCardSelector() {
    const sel = cardDom.cardSelector;
    if (!sel) return;
    sel.innerHTML = '<option value="">-- \u9009\u62e9\u5361\u7247 --</option>' +
        circuitState.cards.map(c => '<option value="' + c.id + '">' + c.name + ' (' + c.id + ') ' + c.rows + '\u00d7' + c.columns + '</option>').join('');
    sel.onchange = function(e) { if (e.target.value) selectCircuitCard(e.target.value); };
}

function selectCircuitCard(cardId) {
    const card = circuitState.cards.find(c => c.id === cardId);
    if (!card) return;
    circuitState.selectedCardId = cardId;
    if (!circuitState.placements[cardId]) circuitState.placements[cardId] = {};
    if (cardDom.cardSelector) cardDom.cardSelector.value = cardId;

    renderCircuitGrid(card);
    renderCircuitList(card.site_id);
    updatePlacementInfo();
}

function circuitItemLabel(circuit) { return circuit.name || circuit.id; }

function renderCircuitGrid(card) {
    buildGridTable(card.name, card.rows, card.columns, card.id, circuitState.placements, circuitState.allCircuits,
        handleCircuitCardDrop, handleCircuitCardRemove, circuitItemLabel);
}

function renderCircuitList(siteId) {
    const list = cardDom.ccrList;
    const filter = cardDom.ccrFilter;
    if (!list) return;

    const filtered = circuitState.allCircuits.filter(cir => {
        if (siteId && cir.site_id !== siteId) return false;
        if (filter && filter.value) {
            const kw = filter.value.toLowerCase();
            return ((cir.name || '').toLowerCase().includes(kw)) || ((cir.id || '').toLowerCase().includes(kw));
        }
        return true;
    });

    list.innerHTML = '';
    if (circuitState.allCircuits.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">\u672a\u52a0\u8f7d circuit_config.json</div>';
        return;
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">\u8be5\u7ad9\u70b9\u6682\u65e0\u56de\u8def</div>';
        return;
    }

    var placedIds = {};
    for (var cId in circuitState.placements) {
        var rData = circuitState.placements[cId];
        for (var r in rData) { for (var c in rData[r]) { placedIds[rData[r][c]] = true; } }
    }

    for (const cir of filtered) {
        const isPlaced = !!placedIds[cir.id];
        renderItemInList(list, cir.id, cir.name || cir.id, cir.select_index, isPlaced, circuitState.placements, 'circuit');
    }
}

async function handleCircuitCardDrop(containerKey, row, col, circuitId) {
    if (circuitId === '__REMOVE__') {
        removePlacement(circuitState, containerKey, row, col);
        return;
    }
    if (!containerKey || row == null || col == null || !circuitId) return;
    const r = parseInt(row), c = parseInt(col);
    if (isNaN(r) || isNaN(c)) return;
    for (var cId in circuitState.placements) {
        var rd = circuitState.placements[cId];
        for (var rs in rd) { for (var cs in rd[rs]) { if (rd[rs][cs] === circuitId) { showStatus('\u8be5\u56de\u8def\u5df2\u5728\u7f51\u683c\u4e2d', 'warning'); return; } } }
    }
    if (!circuitState.placements[containerKey]) circuitState.placements[containerKey] = {};
    if (!circuitState.placements[containerKey][r]) circuitState.placements[containerKey][r] = {};
    if (circuitState.placements[containerKey][r][c]) { if (!(await dialog.confirm('\u66ff\u6362?'))) return; }
    circuitState.placements[containerKey][r][c] = circuitId;

    const card = circuitState.cards.find(ca => ca.id === containerKey);
    if (card) renderCircuitGrid(card);
    renderCircuitList(card ? card.site_id : null);
    updatePlacementInfo();
    showStatus('\u5df2\u653e\u7f6e: ' + circuitId + ' \u2192 (' + r + ',' + c + ')', 'success');
}

function handleCircuitCardRemove(containerKey, row, col) {
    removePlacement(circuitState, containerKey, row, col);
}

// ===================================================================
// ════════════════════════════════════════════════════════════════
//  模式二：站点页面设计器（ccr_config / circuit_config）
//  按 site 分组，用户自定义行/列，拖拽写回 card_row/card_colum
// ════════════════════════════════════════════════════════════════
// ===================================================================

// --- CCR 站点模式 ---

const ccrSiteState = {
    items: [],              // 全部 ccr 数据
    sites: [],              // 提取的唯一 site_id 列表
    selectedSite: null,     // 当前选中站点
    siteRows: {},           // 每个站点用户定义的行数 { siteId: number }
    siteCols: {},           // 每个站点用户定义的列数
    placements: {},         // { [siteId]: { [row]: { [col]: ccrId } } }
};

function openCcrSiteDesigner() {
    switchToSiteModeUI();

    const allConfigs = getAllLoadedConfigs();
    const ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    if (!ccrConfig || !Array.isArray(ccrConfig.data) || ccrConfig.data.length === 0) {
        showStatus('\u672a\u52a0\u8f7d ccr_config.json \u6216\u6570\u636e\u4e3a\u7a7a', 'error');
        return;
    }
    ccrSiteState.items = ccrConfig.data;
    var ccrSiteInfo = getSiteList(allConfigs, ccrSiteState.items);
    ccrSiteState.sites = ccrSiteInfo.ids;
    siteNameMap = ccrSiteInfo.names;
    ccrSiteState.selectedSite = null;
    ccrSiteState.siteRows = {};
    ccrSiteState.siteCols = {};
    ccrSiteState.placements = {};

    // 从已有数据中恢复已放置的位置（读取 card_row/card_colum）
    restoreExistingPlacements(ccrSiteState.items, ccrSiteState.placements, 'card_row', 'card_colum');

    if (cardDom.designTitle) cardDom.designTitle.textContent = '\u8c03\u5149\u5668 - \u7ad9\u70b9\u9875\u9762\u8bbe\u8ba1';
    if (cardDom.applyBtn) cardDom.applyBtn.textContent = '\u5e94\u7528\u5230ccr_config';
    if (cardDom.panelTitle) cardDom.panelTitle.textContent = '\u8c03\u5149\u5668\u5217\u8868\uff08\u6309\u7ad9\u70b9\u8fc7\u6ee4\uff09';
    if (cardDom.ccrFilter) cardDom.ccrFilter.placeholder = '\u641c\u7d22\u8c03\u5149\u5668...';

    renderCcrSiteSelector();

    if (cardDom.modal) cardDom.modal.style.display = '';

    if (ccrSiteState.sites.length > 0) {
        selectCcrSite(ccrSiteState.sites[0]);
    }
}

/** 自定义下拉：生成站点按钮文本 */
function siteLabelText(siteId) {
    var nm = siteNameMap[siteId] || '';
    return siteId + (nm ? ' - ' + nm : '');
}
/** 自定义下拉：切换菜单显隐 */
function toggleSiteDropdown() {
    var menu = document.getElementById('cdSiteMenu');
    if (!menu) return;
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}
/** 自定义下拉：关闭菜单 */
function closeSiteDropdown() {
    var menu = document.getElementById('cdSiteMenu');
    if (menu) menu.style.display = 'none';
}

function renderCcrSiteSelector() {
    const sel = cardDom.siteSelector;
    const menu = document.getElementById('cdSiteMenu');
    if (!sel || !menu) return;
    menu.innerHTML = ccrSiteState.sites.map(function(s) {
        var nm = siteNameMap[s] || '';
        return '<div class="cd-select-item" data-value="' + s + '">' + s + (nm ? ' - ' + nm : '') + ' (' + countItemsBySite(ccrSiteState.items, s) + ' \u4e2a\u8c03\u5149\u5668)</div>';
    }).join('');
    var items = menu.querySelectorAll('.cd-select-item');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function(e) {
            e.stopPropagation();
            selectCcrSite(this.getAttribute('data-value'));
            closeSiteDropdown();
        });
    }
    sel.onclick = function(e) {
        e.stopPropagation();
        toggleSiteDropdown();
    };
}

function selectCcrSite(siteId) {
    ccrSiteState.selectedSite = siteId;

    if (cardDom.siteSelector) {
        var lbl = cardDom.siteSelector.querySelector('.cd-select-label');
        if (lbl) lbl.textContent = siteLabelText(siteId);
    }

    // 设置默认行列
    if (!ccrSiteState.siteRows[siteId]) ccrSiteState.siteRows[siteId] = 11;
    if (!ccrSiteState.siteCols[siteId]) ccrSiteState.siteCols[siteId] = 11;
    if (cardDom.siteRows) cardDom.siteRows.value = ccrSiteState.siteRows[siteId];
    if (cardDom.siteCols) cardDom.siteCols.value = ccrSiteState.siteCols[siteId];

    renderCcrSiteGrid();
    renderCcrSiteList(siteId);
    updatePlacementInfo();
}

/** 用户点击"生成表格"时调用 */
function generateCcrSiteGrid() {
    const siteId = ccrSiteState.selectedSite;
    if (!siteId) {
        showStatus('\u8bf7\u5148\u9009\u62e9\u7ad9\u70b9', 'warning'); return;
    }
    const rows = parseInt(cardDom.siteRows.value);
    const cols = parseInt(cardDom.siteCols.value);
    if (!rows || rows < 1 || rows > 50 || !cols || cols < 1 || cols > 50) {
        showStatus('\u884c/\u5217\u5fc5\u987b\u5728 1~50 \u4e4b\u95f4', 'warning'); return;
    }
    ccrSiteState.siteRows[siteId] = rows;
    ccrSiteState.siteCols[siteId] = cols;
    renderCcrSiteGrid();
    showStatus(siteId + ' \u7f51\u683c: ' + rows + '\u00d7' + cols, 'success');
}

function renderCcrSiteGrid() {
    const siteId = ccrSiteState.selectedSite;
    if (!siteId) return;
    const rows = ccrSiteState.siteRows[siteId] || 11;
    const cols = ccrSiteState.siteCols[siteId] || 11;

    buildGridTable(
        'CCR[' + siteId + ']',
        rows, cols, siteId,
        ccrSiteState.placements,
        ccrSiteState.items,
        handleCcrSiteDrop,
        handleCcrSiteRemove,
        function(ccr) { return ccr.name; }
    );
}

/** 从 id 中提取末尾的数字用于自然排序，如 ccr_10 -> 10、circuit_5 -> 5 */
function getIdNumber(id) {
    if (!id) return 0;
    var m = String(id).match(/(\d+)(?:\D*)$/);
    return m ? parseInt(m[1], 10) : 0;
}

// 右侧调光器/回路列表的排序方式选项
var SORT_OPTIONS = [
    { value: 'id_num',    label: '\u7f16\u53f7' },           // 编号（ccr_ 后的数字）
    { value: 'soc_index', label: '\u56de\u8def\u7d22\u5f15' }, // 回路索引
    { value: 'name',      label: '\u540d\u79f0' },           // 名称
    { value: 'id_str',    label: 'ID' }                       // ID 字符串序
];
var currentCcrSortBy = 'id_num';

// 根据排序方式返回比较函数；isCircuit 时回路索引用 select_index 字段
function getSortComparator(by, isCircuit) {
    switch (by) {
        case 'soc_index':
            return function(a, b) {
                var av = isCircuit ? (a.select_index != null ? a.select_index : 0) : (a.soc_index || 0);
                var bv = isCircuit ? (b.select_index != null ? b.select_index : 0) : (b.soc_index || 0);
                return av - bv;
            };
        case 'name':
            return function(a, b) { return String(a.name || '').localeCompare(String(b.name || ''), 'zh'); };
        case 'id_str':
            return function(a, b) { return String(a.id || '').localeCompare(String(b.id || '')); };
        case 'id_num':
        default:
            return function(a, b) {
                return getIdNumber(a.id) - getIdNumber(b.id) || String(a.id).localeCompare(String(b.id));
            };
    }
}

function renderSortSelector() {
    var menu = cardDom.sortMenu;
    if (!menu) return;
    var html = '';
    for (var i = 0; i < SORT_OPTIONS.length; i++) {
        var o = SORT_OPTIONS[i];
        html += '<div class="cd-select-item' + (o.value === currentCcrSortBy ? ' selected' : '') + '" data-value="' + o.value + '">' + o.label + '</div>';
    }
    menu.innerHTML = html;
    var items = menu.querySelectorAll('.cd-select-item');
    for (var j = 0; j < items.length; j++) {
        items[j].addEventListener('click', function(e) {
            e.stopPropagation();
            selectSort(this.getAttribute('data-value'));
        });
    }
}

function toggleSortDropdown() {
    var menu = cardDom.sortMenu;
    if (!menu) return;
    if (menu.style.display === 'block') { closeSortDropdown(); return; }
    closeSiteDropdown();
    renderSortSelector();
    menu.style.display = 'block';
}

function closeSortDropdown() {
    if (cardDom.sortMenu) cardDom.sortMenu.style.display = 'none';
}

function selectSort(value) {
    var opt = null;
    for (var i = 0; i < SORT_OPTIONS.length; i++) { if (SORT_OPTIONS[i].value === value) { opt = SORT_OPTIONS[i]; break; } }
    if (!opt) return;
    currentCcrSortBy = value;
    if (cardDom.sortLabel) cardDom.sortLabel.textContent = opt.label;
    closeSortDropdown();
    switch (currentDesignMode) {
        case 'ccr_card':
            if (ccrState.selectedCardId) { var cd = ccrState.cards.find(function(c) { return c.id === ccrState.selectedCardId; }); if (cd) renderCcrList(cd.site_id); }
            break;
        case 'circuit_card':
            if (circuitState.selectedCardId) { var cd2 = circuitState.cards.find(function(c) { return c.id === circuitState.selectedCardId; }); if (cd2) renderCircuitList(cd2.site_id); }
            break;
        case 'ccr_site':
            if (ccrSiteState.selectedSite) renderCcrSiteList(ccrSiteState.selectedSite);
            break;
        case 'circuit_site':
            if (circuitSiteState.selectedSite) renderCircuitSiteList(circuitSiteState.selectedSite);
            break;
    }
}

function renderCcrSiteList(siteId) {
    const list = cardDom.ccrList;
    const filter = cardDom.ccrFilter;
    if (!list) return;

    const filtered = ccrSiteState.items.filter(function(ccr) {
        if (ccr.site_id !== siteId) return false;
        if (filter && filter.value) {
            var kw = filter.value.toLowerCase();
            return ccr.name.toLowerCase().includes(kw) || ccr.id.toLowerCase().includes(kw);
        }
        return true;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">\u8be5\u7ad9\u70b9\u65e0\u8c03\u5149\u5668</div>';
        return;
    }
    filtered.sort(getSortComparator(currentCcrSortBy, false));

    // 当前站点的已放置 ID 集合
    var sitePlacements = ccrSiteState.placements[siteId] || {};
    var placedIds = {};
    for (var r in sitePlacements) { for (var c in sitePlacements[r]) { placedIds[sitePlacements[r][c]] = true; } }

    for (const ccr of filtered) {
        const isPlaced = !!placedIds[ccr.id];
        const item = document.createElement('div');
        item.className = 'cd-ccr-item';
        item.draggable = !isPlaced;
        item.dataset.ccrId = ccr.id;
        item.style.cssText = 'padding:4px 8px;margin-bottom:2px;border-radius:4px;cursor:' + (isPlaced ? 'default' : 'grab') + ';font-size:12px;display:flex;align-items:center;gap:6px;transition:background 0.15s;' + (isPlaced ? 'opacity:0.45;' : '');
        item.addEventListener('mouseenter', function() { if (!isPlaced) this.style.background = 'var(--bg-hover)'; });
        item.addEventListener('mouseleave', function() { this.style.background = ''; });

        // 回路索引标签
        const idxLabel = document.createElement('span');
        idxLabel.style.cssText = 'display:inline-block;min-width:28px;padding:1px 4px;border-radius:3px;background:var(--bg-selector);font-size:10px;text-align:center;color:var(--text-secondary);';
        idxLabel.textContent = ccr.soc_index === 256 ? '\u5907' : '\u56de\u8def' + ((ccr.soc_index || 0) + 1);
        item.appendChild(idxLabel);

        // 已放置标记
        if (isPlaced) {
            var pos = findPlacedPosition({ siteId: sitePlacements }, ccr.id);
            const badge = document.createElement('span');
            badge.style.cssText = 'font-size:9px;padding:1px 4px;border-radius:3px;background:var(--accent-color,#0078D4);color:white;white-space:nowrap;';
            badge.textContent = pos ? '(' + pos.row + ',' + pos.col + ')' : '\u5df2\u653e\u7f6e';
            badge.title = ccr.name + ' (' + ccr.id + ')';
            item.appendChild(badge);
        }

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'flex:1;min-width:0;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;white-space:normal;word-break:break-all;line-height:1.3;';
        nameSpan.textContent = ccr.name;
        item.appendChild(nameSpan);

        const idSpan = document.createElement('span');
        idSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);';
        idSpan.textContent = ccr.id;
        item.appendChild(idSpan);

        item.addEventListener('dragstart', function(e) {
            if (isPlaced) {
                e.preventDefault(); showStatus('\u8be5\u8c03\u5149\u5668\u5df2\u5728\u7f51\u683c\u4e2d', 'warning'); return;
            }
            dragSource = null;
            e.dataTransfer.setData('text/plain', ccr.id);
            this.style.opacity = '0.5';
        });
        item.addEventListener('dragend', function(e) { this.style.opacity = '1'; });

        list.appendChild(item);
    }
}

async function handleCcrSiteDrop(siteId, row, col, ccrId) {
    if (ccrId === '__REMOVE__') {
        removeSitePlacement(ccrSiteState, siteId, row, col);
        renderCcrSiteGrid();
        renderCcrSiteList(siteId);
        updatePlacementInfo();
        return;
    }
    if (!siteId || row == null || col == null || !ccrId) return;
    const r = parseInt(row), c = parseInt(col);
    if (isNaN(r) || isNaN(c)) return;

    // 仅在当前站点内检查重复
    var sp = ccrSiteState.placements[siteId];
    if (sp) {
        for (var rs in sp) { for (var cs in sp[rs]) { if (sp[rs][cs] === ccrId) { showStatus('\u8be5\u8c03\u5149\u5668\u5df2\u5728\u672c\u7ad9\u70b9\u7f51\u683c\u4e2d', 'warning'); return; } } }
    }
    if (!ccrSiteState.placements[siteId]) ccrSiteState.placements[siteId] = {};
    if (!ccrSiteState.placements[siteId][r]) ccrSiteState.placements[siteId][r] = {};
    if (ccrSiteState.placements[siteId][r][c]) { if (!(await dialog.confirm('\u66ff\u6362?'))) return; }

    ccrSiteState.placements[siteId][r][c] = ccrId;
    renderCcrSiteGrid();
    renderCcrSiteList(siteId);
    updatePlacementInfo();
    showStatus('\u5df2\u653e\u7f6e: ' + ccrId + ' \u2192 ' + siteId + ' (' + r + ',' + c + ')', 'success');
}

function handleCcrSiteRemove(siteId, row, col) {
    removeSitePlacement(ccrSiteState, siteId, row, col);
    renderCcrSiteGrid();
    renderCcrSiteList(siteId);
    updatePlacementInfo();
}

/** 应用站点放置到 ccr_config 数据 → 写入 card_row / card_colum */
function applyCcrSitePlacements() {
    var allConfigs = getAllLoadedConfigs();
    var ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    if (!ccrConfig || !Array.isArray(ccrConfig.data)) {
        showStatus('\u672a\u627e\u5230 ccr_config.json', 'error'); return;
    }

    // 构建 placementMap: ccrId → { card_row, card_colum }
    var placementMap = {};
    for (var sid in ccrSiteState.placements) {
        var rows = ccrSiteState.placements[sid];
        for (var rStr in rows) {
            var r = parseInt(rStr);
            for (var cStr in rows[rStr]) {
                var c = parseInt(cStr);
                placementMap[rows[rStr][cStr]] = { card_row: r, card_colum: c };
            }
        }
    }

    // 受影响站点 = placements 中有记录的站点（含被清空成空对象的站点）
    var affectedSites = Object.keys(ccrSiteState.placements);

    // 确保 schema 有这两个字段
    var hasCR = ccrConfig.schema.fields.some(function(f) { return f.key === 'card_row'; });
    if (!hasCR) {
        ccrConfig.schema.fields.push({ key: 'card_row', label: 'card_row', type: 1, required: false });
        ccrConfig.schema.fields.push({ key: 'card_colum', label: 'card_colum', type: 1, required: false });
    }

    // 同步：受影响站点的 ccr，在 placementMap 中则写回，否则清空（删除字段，而非设为 0）
    var updatedCount = 0, clearedCount = 0;
    for (var i = 0; i < ccrConfig.data.length; i++) {
        var ccr = ccrConfig.data[i];
        if (affectedSites.indexOf(ccr.site_id) === -1) continue; // 未操作的站点保持原样
        var p = placementMap[ccr.id];
        if (p) {
            ccr.card_row = p.card_row;
            ccr.card_colum = p.card_colum;
            updatedCount++;
        } else {
            if (ccr.card_row !== undefined || ccr.card_colum !== undefined) clearedCount++;
            delete ccr.card_row;
            delete ccr.card_colum;
        }
    }

    ccrConfig.modified = true;
    refreshCurrentView(allConfigs, ccrConfig);
    showStatus('\u5df2\u540c\u6b65 ' + updatedCount + ' \u4e2a\u8c03\u5149\u5668\u4f4d\u7f6e\uff0c\u6e05\u7a7a ' + clearedCount + ' \u4e2a\u8c03\u5149\u5668\u7684 card_row/card_colum', 'success');
}

// --- Circuit 站点模式 ---

const circuitSiteState = {
    items: [],
    sites: [],
    selectedSite: null,
    siteRows: {},
    siteCols: {},
    placements: {},
};

function openCircuitSiteDesigner() {
    switchToSiteModeUI();

    const allConfigs = getAllLoadedConfigs();
    const circuitConfig = findConfigByFileName(allConfigs, 'circuit_config.json');
    if (!circuitConfig || !Array.isArray(circuitConfig.data) || circuitConfig.data.length === 0) {
        showStatus('\u672a\u52a0\u8f7d circuit_config.json \u6216\u6570\u636e\u4e3a\u7a7a', 'error');
        return;
    }
    circuitSiteState.items = circuitConfig.data;
    var circuitSiteInfo = getSiteList(allConfigs, circuitSiteState.items);
    circuitSiteState.sites = circuitSiteInfo.ids;
    siteNameMap = circuitSiteInfo.names;
    circuitSiteState.selectedSite = null;
    circuitSiteState.siteRows = {};
    circuitSiteState.siteCols = {};
    circuitSiteState.placements = {};

    restoreExistingPlacements(circuitSiteState.items, circuitSiteState.placements, 'card_row', 'card_colum');

    if (cardDom.designTitle) cardDom.designTitle.textContent = '\u56de\u8def - \u7ad9\u70b9\u9875\u9762\u8bbe\u8ba1';
    if (cardDom.applyBtn) cardDom.applyBtn.textContent = '\u5e94\u7528\u5230circuit_config';
    if (cardDom.panelTitle) cardDom.panelTitle.textContent = '\u56de\u8def\u5217\u8868\uff08\u6309\u7ad9\u70b9\u8fc7\u6ee4\uff09';
    if (cardDom.ccrFilter) cardDom.ccrFilter.placeholder = '\u641c\u7d22\u56de\u8def...';

    renderCircuitSiteSelector();

    if (cardDom.modal) cardDom.modal.style.display = '';
    if (circuitSiteState.sites.length > 0) {
        selectCircuitSite(circuitSiteState.sites[0]);
    }
}

function renderCircuitSiteSelector() {
    const sel = cardDom.siteSelector;
    const menu = document.getElementById('cdSiteMenu');
    if (!sel || !menu) return;
    menu.innerHTML = circuitSiteState.sites.map(function(s) {
        var nm = siteNameMap[s] || '';
        return '<div class="cd-select-item" data-value="' + s + '">' + s + (nm ? ' - ' + nm : '') + ' (' + countItemsBySite(circuitSiteState.items, s) + ' \u4e2a\u56de\u8def)</div>';
    }).join('');
    var items = menu.querySelectorAll('.cd-select-item');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function(e) {
            e.stopPropagation();
            selectCircuitSite(this.getAttribute('data-value'));
            closeSiteDropdown();
        });
    }
    sel.onclick = function(e) {
        e.stopPropagation();
        toggleSiteDropdown();
    };
}

function selectCircuitSite(siteId) {
    circuitSiteState.selectedSite = siteId;
    if (cardDom.siteSelector) {
        var lbl = cardDom.siteSelector.querySelector('.cd-select-label');
        if (lbl) lbl.textContent = siteLabelText(siteId);
    }
    if (!circuitSiteState.siteRows[siteId]) circuitSiteState.siteRows[siteId] = 11;
    if (!circuitSiteState.siteCols[siteId]) circuitSiteState.siteCols[siteId] = 11;
    if (cardDom.siteRows) cardDom.siteRows.value = circuitSiteState.siteRows[siteId];
    if (cardDom.siteCols) cardDom.siteCols.value = circuitSiteState.siteCols[siteId];

    renderCircuitSiteGrid();
    renderCircuitSiteList(siteId);
    updatePlacementInfo();
}

function generateCircuitSiteGrid() {
    const siteId = circuitSiteState.selectedSite;
    if (!siteId) { showStatus('\u8bf7\u5148\u9009\u62e9\u7ad9\u70b9', 'warning'); return; }
    var rows = parseInt(cardDom.siteRows.value);
    var cols = parseInt(cardDom.siteCols.value);
    if (!rows || rows < 1 || rows > 50 || !cols || cols < 1 || cols > 50) {
        showStatus('\u884c/\u5217\u5fc5\u987b\u5728 1~50 \u4e4b\u95f4', 'warning'); return;
    }
    circuitSiteState.siteRows[siteId] = rows;
    circuitSiteState.siteCols[siteId] = cols;
    renderCircuitSiteGrid();
    showStatus(siteId + ' \u7f51\u683c: ' + rows + '\u00d7' + cols, 'success');
}

function renderCircuitSiteGrid() {
    var siteId = circuitSiteState.selectedSite;
    if (!siteId) return;
    var rows = circuitSiteState.siteRows[siteId] || 11;
    var cols = circuitSiteState.siteCols[siteId] || 11;
    buildGridTable(
        '\u56de\u8def[' + siteId + ']',
        rows, cols, siteId,
        circuitSiteState.placements,
        circuitSiteState.items,
        handleCircuitSiteDrop,
        handleCircuitSiteRemove,
        function(cir) { return cir.name || cir.id; }
    );
}

function renderCircuitSiteList(siteId) {
    const list = cardDom.ccrList;
    const filter = cardDom.ccrFilter;
    if (!list) return;

    const filtered = circuitSiteState.items.filter(function(cir) {
        if (cir.site_id !== siteId) return false;
        if (filter && filter.value) {
            var kw = filter.value.toLowerCase();
            return ((cir.name || '').toLowerCase().includes(kw)) || ((cir.id || '').toLowerCase().includes(kw));
        }
        return true;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">\u8be5\u7ad9\u70b9\u65e0\u56de\u8def</div>'; return;
    }

    filtered.sort(getSortComparator(currentCcrSortBy, true));

    var sp = circuitSiteState.placements[siteId] || {};
    var placedIds = {};
    for (var r in sp) { for (var c in sp) { placedIds[sp[r][c]] = true; } }

    for (const cir of filtered) {
        const isPlaced = !!placedIds[cir.id];
        const item = document.createElement('div');
        item.className = 'cd-ccr-item';
        item.draggable = !isPlaced;
        item.dataset.circuitId = cir.id;
        item.style.cssText = 'padding:4px 8px;margin-bottom:2px;border-radius:4px;cursor:' + (isPlaced ? 'default' : 'grab') + ';font-size:12px;display:flex;align-items:center;gap:6px;transition:background 0.15s;' + (isPlaced ? 'opacity:0.45;' : '');
        item.addEventListener('mouseenter', function() { if (!isPlaced) this.style.background = 'var(--bg-hover)'; });
        item.addEventListener('mouseleave', function() { this.style.background = ''; });

        const idxLabel = document.createElement('span');
        idxLabel.style.cssText = 'display:inline-block;min-width:28px;padding:1px 4px;border-radius:3px;background:var(--bg-selector);font-size:10px;text-align:center;color:var(--text-secondary);';
        idxLabel.textContent = '\u56de\u8def' + (cir.select_index ?? '');
        item.appendChild(idxLabel);

        if (isPlaced) {
            var pos = findPlacedPosition({ siteId: sp }, cir.id);
            const badge = document.createElement('span');
            badge.style.cssText = 'font-size:9px;padding:1px 4px;border-radius:3px;background:var(--accent-color,#0078D4);color:white;white-space:nowrap;';
            badge.textContent = pos ? '(' + pos.row + ',' + pos.col + ')' : '\u5df2\u653e\u7f6e';
            item.appendChild(badge);
        }

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'flex:1;min-width:0;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;white-space:normal;word-break:break-all;line-height:1.3;';
        nameSpan.textContent = cir.name || cir.id;
        item.appendChild(nameSpan);

        const idSpan = document.createElement('span');
        idSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);';
        idSpan.textContent = cir.id;
        item.appendChild(idSpan);

        item.addEventListener('dragstart', function(e) {
            if (isPlaced) { e.preventDefault(); showStatus('\u8be5\u56de\u8def\u5df2\u5728\u7f51\u683c\u4e2d', 'warning'); return; }
            dragSource = null;
            e.dataTransfer.setData('text/plain', cir.id);
            this.style.opacity = '0.5';
        });
        item.addEventListener('dragend', function(e) { this.style.opacity = '1'; });

        list.appendChild(item);
    }
}

async function handleCircuitSiteDrop(siteId, row, col, circuitId) {
    if (circuitId === '__REMOVE__') {
        removeSitePlacement(circuitSiteState, siteId, row, col);
        renderCircuitSiteGrid();
        renderCircuitSiteList(siteId);
        updatePlacementInfo();
        return;
    }
    if (!siteId || row == null || col == null || !circuitId) return;
    var r = parseInt(row), c = parseInt(col);
    if (isNaN(r) || isNaN(c)) return;

    var sp = circuitSiteState.placements[siteId];
    if (sp) {
        for (var rs in sp) { for (var cs in sp[rs]) { if (sp[rs][cs] === circuitId) { showStatus('\u8be5\u56de\u8def\u5df2\u5728\u672c\u7ad9\u70b9\u7f51\u683c\u4e2d', 'warning'); return; } } }
    }
    if (!circuitSiteState.placements[siteId]) circuitSiteState.placements[siteId] = {};
    if (!circuitSiteState.placements[siteId][r]) circuitSiteState.placements[siteId][r] = {};
    if (circuitSiteState.placements[siteId][r][c]) { if (!(await dialog.confirm('\u66ff\u6362?'))) return; }

    circuitSiteState.placements[siteId][r][c] = circuitId;
    renderCircuitSiteGrid();
    renderCircuitSiteList(siteId);
    updatePlacementInfo();
    showStatus('\u5df2\u653e\u7f6e: ' + circuitId + ' \u2192 ' + siteId + ' (' + r + ',' + c + ')', 'success');
}

function handleCircuitSiteRemove(siteId, row, col) {
    removeSitePlacement(circuitSiteState, siteId, row, col);
    renderCircuitSiteGrid();
    renderCircuitSiteList(siteId);
    updatePlacementInfo();
}

function applyCircuitSitePlacements() {
    var allConfigs = getAllLoadedConfigs();
    var circuitConfig = findConfigByFileName(allConfigs, 'circuit_config.json');
    if (!circuitConfig || !Array.isArray(circuitConfig.data)) {
        showStatus('\u672a\u627e\u5230 circuit_config.json', 'error'); return;
    }

    var placementMap = {};
    for (var sid in circuitSiteState.placements) {
        var rows = circuitSiteState.placements[sid];
        for (var rStr in rows) {
            var r = parseInt(rStr);
            for (var cStr in rows[rStr]) {
                var c = parseInt(cStr);
                placementMap[rows[rStr][cStr]] = { card_row: r, card_colum: c };
            }
        }
    }

    var affectedSites = Object.keys(circuitSiteState.placements);

    var hasCR = circuitConfig.schema.fields.some(function(f) { return f.key === 'card_row'; });
    if (!hasCR) {
        circuitConfig.schema.fields.push({ key: 'card_row', label: 'card_row', type: 1, required: false });
        circuitConfig.schema.fields.push({ key: 'card_colum', label: 'card_colum', type: 1, required: false });
    }

    var updatedCount = 0, clearedCount = 0;
    for (var i = 0; i < circuitConfig.data.length; i++) {
        var cir = circuitConfig.data[i];
        if (affectedSites.indexOf(cir.site_id) === -1) continue;
        var p = placementMap[cir.id];
        if (p) {
            cir.card_row = p.card_row;
            cir.card_colum = p.card_colum;
            updatedCount++;
        } else {
            if (cir.card_row !== undefined || cir.card_colum !== undefined) clearedCount++;
            delete cir.card_row;
            delete cir.card_colum;
        }
    }

    circuitConfig.modified = true;
    refreshCurrentView(allConfigs, circuitConfig);
    showStatus('\u5df2\u540c\u6b65 ' + updatedCount + ' \u4e2a\u56de\u8def\u4f4d\u7f6e\uff0c\u6e05\u7a7a ' + clearedCount + ' \u4e2a\u56de\u8def\u7684 card_row/card_colum', 'success');
}

// ===================================================================
// 通用辅助函数
// ===================================================================

/** 统计某站点下的条目数 */
function countItemsBySite(items, siteId) {
    var n = 0;
    for (var i = 0; i < items.length; i++) { if (items[i].site_id === siteId) n++; }
    return n;
}

/** 从已有数据中恢复位置到 placements（读取 rowField/colField 字段值） */
function restoreExistingPlacements(items, placements, rowField, colField) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var r = item[rowField];
        var c = item[colField];
        var sid = item.site_id || '_default_';
        if (r != null && c != null && typeof r === 'number' && typeof c === 'number' && r >= 0 && c >= 0) {
            if (!placements[sid]) placements[sid] = {};
            if (!placements[sid][r]) placements[sid][r] = {};
            placements[sid][r][c] = item.id;
        }
    }
}

/** 从 placements 中移除一个位置 */
function removePlacement(state, containerKey, row, col) {
    if (!state.placements[containerKey]) return;
    if (!state.placements[containerKey][row]) return;
    delete state.placements[containerKey][row][col];
    if (Object.keys(state.placements[containerKey][row]).length === 0) delete state.placements[containerKey][row];

    // 找当前容器重新渲染（仅卡片模式需要）
    var refObj = null;
    if (state === ccrState) refObj = ccrState.cards.find(c => c.id === containerKey);
    else if (state === circuitState) refObj = circuitState.cards.find(c => c.id === containerKey);

    if (refObj) {
        if (state === ccrState) { renderCcrGrid(refObj); renderCcrList(refObj.site_id); }
        else { renderCircuitGrid(refObj); renderCircuitList(refObj.site_id); }
    }
    updatePlacementInfo();
    showStatus('\u5df2\u79fb\u9664 (' + row + ',' + col + ')', 'info');
}

/** 从站点 placements 中移除 */
function removeSitePlacement(state, siteId, row, col) {
    if (!state.placements[siteId]) return;
    if (!state.placements[siteId][row]) return;
    delete state.placements[siteId][row][col];
    if (Object.keys(state.placements[siteId][row]).length === 0) delete state.placements[siteId][row];
    showStatus('\u5df2\u79fb\u9664 ' + siteId + ' (' + row + ',' + col + ')', 'info');
}

/** 渲染右侧列表项（共用模板） */
function renderItemInList(list, id, name, indexVal, isPlaced, placements, mode) {
    const item = document.createElement('div');
    item.className = 'cd-ccr-item';
    item.draggable = !isPlaced;
    item.style.cssText = 'padding:4px 8px;margin-bottom:2px;border-radius:4px;cursor:' + (isPlaced ? 'default' : 'grab') + ';font-size:12px;display:flex;align-items:center;gap:6px;transition:background 0.15s;' + (isPlaced ? 'opacity:0.45;' : '');
    item.addEventListener('mouseenter', function() { if (!isPlaced) this.style.background = 'var(--bg-hover)'; });
    item.addEventListener('mouseleave', function() { this.style.background = ''; });

    const idxLabel = document.createElement('span');
    idxLabel.style.cssText = 'display:inline-block;min-width:28px;padding:1px 4px;border-radius:3px;background:var(--bg-selector);font-size:10px;text-align:center;color:var(--text-secondary);';
    if (mode === 'ccr') {
        idxLabel.textContent = indexVal === 256 ? '\u5907' : '\u56de\u8def' + ((indexVal || 0) + 1);
    } else {
        idxLabel.textContent = '\u56de\u8def' + (indexVal ?? '');
    }
    item.appendChild(idxLabel);

    if (isPlaced) {
        var pos = findPlacedPosition(placements, id);
        const badge = document.createElement('span');
        badge.style.cssText = 'font-size:9px;padding:1px 4px;border-radius:3px;background:var(--accent-color,#0078D4);color:white;white-space:nowrap;';
        badge.textContent = pos ? '(' + pos.row + ',' + pos.col + ')' : '\u5df2\u653e\u7f6e';
        badge.title = name + ' (' + id + ')';
        item.appendChild(badge);
    }

    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    nameSpan.textContent = name;
    item.appendChild(nameSpan);

    const idSpan = document.createElement('span');
    idSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);';
    idSpan.textContent = id;
    item.appendChild(idSpan);

    item.addEventListener('dragstart', function(e) {
        if (isPlaced) {
            e.preventDefault();
            showStatus(mode === 'ccr' ? '\u8be5\u8c03\u5149\u5668\u5df2\u5728\u7f51\u683c\u4e2d' : '\u8be5\u56de\u8def\u5df2\u5728\u7f51\u683c\u4e2d', 'warning');
            return;
        }
        dragSource = null;
        e.dataTransfer.setData('text/plain', id);
        this.style.opacity = '0.5';
    });
    item.addEventListener('dragend', function(e) { this.style.opacity = '1'; });

    list.appendChild(item);
}

/** UI 切换：显示卡片模式控件 */
function switchToCardModeUI() {
    if (cardDom.siteMode) cardDom.siteMode.style.display = 'none';
    if (cardDom.cardMode) cardDom.cardMode.style.display = '';
    if (cardDom.ccrPanel) cardDom.ccrPanel.style.display = '';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
    if (cardDom.generateBtn) cardDom.generateBtn.style.display = '';
}

/** UI 切换：显示站点模式控件 */
function switchToSiteModeUI() {
    if (cardDom.siteMode) cardDom.siteMode.style.display = '';
    if (cardDom.cardMode) cardDom.cardMode.style.display = 'none';
    if (cardDom.ccrPanel) cardDom.ccrPanel.style.display = '';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
    if (cardDom.generateBtn) cardDom.generateBtn.style.display = 'none';
}

/** 刷新当前编辑视图 */
function refreshCurrentView(allConfigs, configObj) {
    var currentKey = getCurrentKey();
    for (var key in allConfigs) {
        if (allConfigs[key] === configObj) {
            if (key === currentKey) {
                document.dispatchEvent(new CustomEvent('config-selected', {
                    detail: { key: key, data: configObj.data, schema: configObj.schema, fileName: configObj.fileName }
                }));
            }
            break;
        }
    }
}

// ===================================================================
// 初始化 & 事件绑定
// ===================================================================

export function initCardDesigner() {
    bindCardDom();

    if (cardDom.designerBtn) {
        cardDom.designerBtn.addEventListener('click', openCardDesigner);
    }

    if (cardDom.closeBtn) {
        cardDom.closeBtn.addEventListener('click', closeDesigner);
    }
    if (cardDom.modal) {
        // 模态弹窗：点击弹窗之外的遮罩不再关闭，避免误触丢失编辑数据；仅保留点击外部时收起下拉菜单
        cardDom.modal.addEventListener('click', function() { closeSiteDropdown(); });
        cardDom.modal.addEventListener('click', function() { closeSortDropdown(); });
    }

    // 站点模式：生成表格按钮
    if (cardDom.siteGenerateBtn) {
        cardDom.siteGenerateBtn.addEventListener('click', function() {
            if (currentDesignMode === 'ccr_site') generateCcrSiteGrid();
            else if (currentDesignMode === 'circuit_site') generateCircuitSiteGrid();
        });
    }

    // 搜索过滤
    if (cardDom.ccrFilter) {
        cardDom.ccrFilter.addEventListener('input', function() {
            switch (currentDesignMode) {
                case 'ccr_card':
                    if (ccrState.selectedCardId) { var cd = ccrState.cards.find(c => c.id === ccrState.selectedCardId); if (cd) renderCcrList(cd.site_id); }
                    break;
                case 'circuit_card':
                    if (circuitState.selectedCardId) { var cd2 = circuitState.cards.find(c => c.id === circuitState.selectedCardId); if (cd2) renderCircuitList(cd2.site_id); }
                    break;
                case 'ccr_site':
                    if (ccrSiteState.selectedSite) renderCcrSiteList(ccrSiteState.selectedSite);
                    break;
                case 'circuit_site':
                    if (circuitSiteState.selectedSite) renderCircuitSiteList(circuitSiteState.selectedSite);
                    break;
            }
        });
    }

    // 生成映射 JSON（仅卡片模式使用）
    if (cardDom.generateBtn) {
        cardDom.generateBtn.addEventListener('click', function() {
            if (currentDesignMode === 'ccr_card') {
                const json = generateMappingJSON(ccrState, 'card_id', 'card_row', 'card_columns', 'ccr_id');
                showStatus('\u5df2\u751f\u6210 ' + JSON.parse(json).length + ' \u6761\u6620\u5c04', 'success');
            } else if (currentDesignMode === 'circuit_card') {
                const json = generateMappingJSON(circuitState, 'card_id', 'card_row', 'card_columns', 'circuit_id');
                showStatus('\u5df2\u751f\u6210 ' + JSON.parse(json).length + ' \u6761\u6620\u5c04', 'success');
            }
        });
    }

    // 应用按钮
    if (cardDom.applyBtn) {
        cardDom.applyBtn.addEventListener('click', function() {
            switch (currentDesignMode) {
                case 'ccr_card': applyPlacementsToCcrConfig(); break;
                case 'circuit_card': applyPlacementsToCircuitConfig(); break;
                case 'ccr_site': applyCcrSitePlacements(); break;
                case 'circuit_site': applyCircuitSitePlacements(); break;
            }
        });
    }

    // 清空按钮
    if (cardDom.clearBtn) {
        cardDom.clearBtn.addEventListener('click', async function() {
            if (!(await dialog.confirm('\u6e05\u7a7a\u6240\u6709\u653e\u7f6e?'))) return;
            switch (currentDesignMode) {
                case 'ccr_card':
                    ccrState.placements = {};
                    if (ccrState.selectedCardId) { var c = ccrState.cards.find(ca => ca.id === ccrState.selectedCardId); if (c) renderCcrGrid(c); }
                    break;
                case 'circuit_card':
                    circuitState.placements = {};
                    if (circuitState.selectedCardId) { var c2 = circuitState.cards.find(ca => ca.id === circuitState.selectedCardId); if (c2) renderCircuitGrid(c2); }
                    break;
                case 'ccr_site':
                    if (ccrSiteState.selectedSite) ccrSiteState.placements[ccrSiteState.selectedSite] = {};
                    if (ccrSiteState.selectedSite) renderCcrSiteGrid();
                    renderCcrSiteList(ccrSiteState.selectedSite);
                    break;
                case 'circuit_site':
                    if (circuitSiteState.selectedSite) circuitSiteState.placements[circuitSiteState.selectedSite] = {};
                    if (circuitSiteState.selectedSite) renderCircuitSiteGrid();
                    renderCircuitSiteList(circuitSiteState.selectedSite);
                    break;
            }
            updatePlacementInfo();
            if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
            showStatus('\u5df2\u6e05\u7a7a', 'info');
        });
    }

    // 初始化排序下拉（右侧调光器/回路列表）
    if (cardDom.sortSelector) {
        cardDom.sortSelector.onclick = function(e) { e.stopPropagation(); toggleSortDropdown(); };
        renderSortSelector();
        var initOpt = null;
        for (var i = 0; i < SORT_OPTIONS.length; i++) { if (SORT_OPTIONS[i].value === currentCcrSortBy) { initOpt = SORT_OPTIONS[i]; break; } }
        if (initOpt && cardDom.sortLabel) cardDom.sortLabel.textContent = initOpt.label;
    }

    if (cardDom.designerBtn) cardDom.designerBtn.style.display = 'none';
}

function closeDesigner() {
    if (cardDom.modal) cardDom.modal.style.display = 'none';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
    closeSiteDropdown();
    closeSortDropdown();
}

// ===================================================================
// 卡片模式的映射生成与应用（保持原有逻辑不变）
// ===================================================================

function generateMappingJSON(state, cardKey, rowKey, colKey, itemKey) {
    const result = [];
    for (const containerKey of Object.keys(state.placements)) {
        const rows = state.placements[containerKey];
        for (const rStr of Object.keys(rows)) {
            const r = parseInt(rStr);
            for (const cStr of Object.keys(rows[r])) {
                const c = parseInt(cStr);
                const itemId = rows[r][cStr];
                var entry = {};
                entry[cardKey] = containerKey;
                entry[rowKey] = r;
                entry[colKey] = c;
                entry[itemKey] = itemId;
                result.push(entry);
            }
        }
    }
    result.sort((a, b) => {
        if (a[cardKey] !== b[cardKey]) return String(a[cardKey]).localeCompare(String(b[cardKey]));
        if (a[rowKey] !== b[rowKey]) return a[rowKey] - b[rowKey];
        return a[colKey] - b[colKey];
    });
    const json = JSON.stringify(result, null, 4);
    if (cardDom.outputArea) { cardDom.outputArea.textContent = json; cardDom.outputArea.style.display = ''; }
    return json;
}

function applyPlacementsToCcrConfig() {
    var allConfigs = getAllLoadedConfigs();
    var ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    if (!ccrConfig || !Array.isArray(ccrConfig.data)) { showStatus('\u672a\u627e\u5230 ccr_config.json', 'error'); return; }

    var total = 0;
    for (var cardId in ccrState.placements) {
        for (var r in ccrState.placements[cardId]) { total += Object.keys(ccrState.placements[cardId][r]).length; }
    }
    if (total === 0) { showStatus('\u6ca1\u6709\u653e\u7f6e\u8bb0\u5f55', 'error'); return; }

    var placementMap = {};
    for (var cardId in ccrState.placements) {
        var rows = ccrState.placements[cardId];
        for (var rStr in rows) {
            var r = parseInt(rStr);
            for (var cStr in rows[rStr]) {
                var c = parseInt(cStr);
                placementMap[rows[rStr][cStr]] = { row: r, colum: c };
            }
        }
    }

    var hasRow = ccrConfig.schema.fields.some(function(f) { return f.key === 'row'; });
    if (!hasRow) {
        ccrConfig.schema.fields.push({ key: 'row', label: 'row', type: 1, required: false });
        ccrConfig.schema.fields.push({ key: 'colum', label: 'colum', type: 1, required: false });
    }

    var updatedCount = 0;
    for (var i = 0; i < ccrConfig.data.length; i++) {
        var ccr = ccrConfig.data[i];
        var p = placementMap[ccr.id];
        if (p) { ccr.row = p.row; ccr.colum = p.colum; updatedCount++; }
    }
    ccrConfig.modified = true;
    refreshCurrentView(allConfigs, ccrConfig);
    showStatus('\u5df2\u5e94\u7528 ' + updatedCount + ' \u4e2a\u8c03\u5149\u5668\uff08row/colum\uff09', 'success');
}

function applyPlacementsToCircuitConfig() {
    var allConfigs = getAllLoadedConfigs();
    var circuitConfig = findConfigByFileName(allConfigs, 'circuit_config.json');
    if (!circuitConfig || !Array.isArray(circuitConfig.data)) { showStatus('\u672a\u627e\u5230 circuit_config.json', 'error'); return; }

    var total = 0;
    for (var cardId in circuitState.placements) {
        for (var r in circuitState.placements[cardId]) { total += Object.keys(circuitState.placements[cardId][r]).length; }
    }
    if (total === 0) { showStatus('\u6ca1\u6709\u653e\u7f6e\u8bb0\u5f55', 'error'); return; }

    var placementMap = {};
    for (var cardId in circuitState.placements) {
        var rows = circuitState.placements[cardId];
        for (var rStr in rows) {
            var r = parseInt(rStr);
            for (var cStr in rows[rStr]) {
                var c = parseInt(cStr);
                placementMap[rows[rStr][cStr]] = { row: r, colum: c };
            }
        }
    }

    var hasRow = circuitConfig.schema.fields.some(function(f) { return f.key === 'row'; });
    if (!hasRow) {
        circuitConfig.schema.fields.push({ key: 'row', label: 'row', type: 1, required: false });
        circuitConfig.schema.fields.push({ key: 'colum', label: 'colum', type: 1, required: false });
    }

    var updatedCount = 0;
    for (var i = 0; i < circuitConfig.data.length; i++) {
        var cir = circuitConfig.data[i];
        var p = placementMap[cir.id];
        if (p) { cir.row = p.row; cir.colum = p.colum; updatedCount++; }
    }
    circuitConfig.modified = true;
    refreshCurrentView(allConfigs, circuitConfig);
    showStatus('\u5df2\u5e94\u7528 ' + updatedCount + ' \u4e2a\u56de\u8def\uff08row/colum\uff09', 'success');
}
