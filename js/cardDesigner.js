// cardDesigner.js — 卡片页面设计器（调光器卡片网格 / 回路卡片网格）
// 支持 ccr_card_config → ccr_config 和 circuit_card_config → circuit_config 的拖拽放置

import { showStatus } from './core.js';
import { getAllLoadedConfigs, getCurrentKey } from './configProject.js';

// ========== 状态 ==========
let currentCardType = null;   // 'ccr_card' | 'circuit_card'
let cardDom = {};

/** 拖动来源记录：null=从右侧列表拖拽，{cardId,row,col}=从网格拖拽（移动/交换） */
let dragSource = null;

function bindCardDom() {
    cardDom = {
        designerBtn: document.getElementById('cardDesignerBtn'),
        modal: document.getElementById('cardDesignerModal'),
        closeBtn: document.getElementById('cardDesignerClose'),
        cardSelector: document.getElementById('cdCardSelector'),
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
    };
}

// ========== 卡片检测 ==========

export function isCardConfig(key, schema) {
    if (!key || !schema) return false;
    return key === 'ccr_card_config' || key === 'circuit_card_config' ||
           (schema.label && schema.label.includes('card'));
}

function getCardType(key) {
    if (key === 'ccr_card_config') return 'ccr_card';
    if (key === 'circuit_card_config') return 'circuit_card';
    if (key && key.includes('card')) return 'ccr_card';
    return null;
}

// ========== 页面设计按钮显示控制 ==========

export function onConfigSelected(detail) {
    if (!detail || !detail.key || !detail.schema) {
        if (cardDom.designerBtn) cardDom.designerBtn.style.display = 'none';
        return;
    }
    const isCard = isCardConfig(detail.key, detail.schema);
    if (cardDom.designerBtn) {
        cardDom.designerBtn.style.display = isCard ? '' : 'none';
    }
    if (isCard) {
        currentCardType = getCardType(detail.key);
    } else {
        currentCardType = null;
    }
}

// ========== 打开设计器 ==========

export function openCardDesigner() {
    const allConfigs = getAllLoadedConfigs();
    if (!allConfigs || Object.keys(allConfigs).length === 0) {
        showStatus('请先加载配置文件', 'error');
        return;
    }

    if (!currentCardType) {
        const key = getCurrentKey();
        currentCardType = getCardType(key);
    }

    if (currentCardType === 'ccr_card') {
        openCcrCardDesigner();
    } else if (currentCardType === 'circuit_card') {
        openCircuitCardDesigner();
    } else {
        showStatus('未识别卡片类型', 'error');
    }
}

// ===================================================================
// 通用网格构建器
// ===================================================================

function findConfigByFileName(allConfigs, fileName) {
    for (const key of Object.keys(allConfigs)) {
        if (allConfigs[key].fileName === fileName) return allConfigs[key];
    }
    return null;
}

/** 在 placements 中查找 itemId 所在的网格坐标 */
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
 * 构建通用网格表格
 * @param {object} card       - 卡片定义 { id, name, rows, columns }
 * @param {object} placements - { row: { col: itemId } }
 * @param {array}  items      - 全部数据条目
 * @param {function} onDrop   - (cardId, row, col, itemId) => void
 * @param {function} onRemove - (cardId, row, col) => void
 * @param {function} itemLabel - (item) => string  显示文本
 */
function buildGridTable(card, placements, items, onDrop, onRemove, itemLabel) {
    const container = cardDom.gridContainer;
    if (!container) return;
    const rows = card.rows || 11;
    const cols = card.columns || 11;

    container.innerHTML = '';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;font-size:14px;margin-bottom:8px;color:var(--text-primary);';
    title.textContent = card.name + ' (' + rows + '×' + cols + ')';
    container.appendChild(title);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border:1px solid var(--border-color);border-radius:6px;flex:1;min-height:0;overflow:hidden;';

    const table = document.createElement('table');
    table.className = 'cd-grid-table';
    table.style.cssText = 'border-collapse:collapse;font-size:11px;';

    // 列头（空角 + 列号）
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    // 左上角空单元格（width:28px 显式固定列宽）
    const cornerTh = document.createElement('th');
    cornerTh.style.cssText = 'position:sticky;top:0;left:0;z-index:3;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);width:28px;overflow:hidden;';
    cornerTh.textContent = '';
    headRow.appendChild(cornerTh);

    for (let c = 1; c <= cols; c++) {
        const th = document.createElement('th');
        th.style.cssText = 'position:sticky;top:0;z-index:2;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);';
        th.textContent = c;
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    // 表格体（行号列 + 数据格）
    const tbody = document.createElement('tbody');
    const cardPlacements = placements || {};
    const theCardId = card.id;

    for (let r = 1; r <= rows; r++) {
        const tr = document.createElement('tr');

        // 行号标签（width:28px 显式固定列宽）
        const rowLabel = document.createElement('th');
        rowLabel.style.cssText = 'position:sticky;left:0;z-index:1;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);width:28px;overflow:hidden;';
        rowLabel.textContent = r;
        tr.appendChild(rowLabel);

        for (let c = 1; c <= cols; c++) {
            const td = document.createElement('td');
            td.className = 'cd-grid-cell';
            td.dataset.row = r;
            td.dataset.col = c;
            td.tabIndex = 0;  // 可聚焦，支持键盘操作
            td.style.cssText = 'border:1px solid var(--border-color);text-align:center;vertical-align:middle;cursor:pointer;transition:background 0.15s;';

            const rowData = cardPlacements[r];
            const itemId = rowData ? rowData[c] : null;
            if (itemId) {
                const item = items.find(it => it.id === itemId);
                // 内层 div 强制裁剪，不受表格撑开影响
                const inner = document.createElement('div');
                inner.className = 'cd-cell-inner';
                inner.textContent = item ? itemLabel(item) : itemId;
                inner.title = item ? itemLabel(item) + ' (' + itemId + ')' : itemId;
                inner.style.cssText = 'width:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;';
                td.appendChild(inner);
                td.style.background = 'var(--accent-color, #0078D4)';
                td.style.color = 'white';
                td.style.fontWeight = '600';
                td.classList.add('cd-cell-occupied');
                // 已占用格可拖拽（用于移动/交换）
                td.draggable = true;
                td.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', itemId);
                    dragSource = { cardId: theCardId, row: r, col: c };
                    this.style.opacity = '0.6';
                });
                td.addEventListener('dragend', function(e) {
                    this.style.opacity = '1';
                    // 不重置 dragSource 在这里——drop 处理器会处理
                });
            }

            // 拖放目标
            td.addEventListener('dragover', function(e) { e.preventDefault(); this.style.background = 'var(--bg-hover)'; });
            td.addEventListener('dragleave', function(e) {
                this.style.background = this.textContent ? 'var(--accent-color, #0078D4)' : '';
            });
            td.addEventListener('drop', function(e) {
                e.preventDefault();
                const droppedId = e.dataTransfer.getData('text/plain');
                if (!droppedId) return;
                const targetR = parseInt(this.dataset.row);
                const targetC = parseInt(this.dataset.col);
                if (isNaN(targetR) || isNaN(targetC)) return;

                // 如果来自网格自身 → 移动/交换
                if (dragSource && dragSource.cardId === theCardId) {
                    const srcR = dragSource.row;
                    const srcC = dragSource.col;
                    // 拖到同一格 → 忽略
                    if (srcR === targetR && srcC === targetC) {
                        dragSource = null;
                        return;
                    }
                    // 检查目标格是否已被占用
                    const existingId = cardPlacements[targetR] ? cardPlacements[targetR][targetC] : null;
                    if (existingId) {
                        if (!confirm('该位置已有项目，是否交换？')) {
                            dragSource = null;
                            return;
                        }
                        // 交换：把现有的放到源位置
                        if (!cardPlacements[srcR]) cardPlacements[srcR] = {};
                        cardPlacements[srcR][srcC] = existingId;
                    } else {
                        // 目标为空 → 移动，清空源位置
                        delete cardPlacements[srcR][srcC];
                        if (Object.keys(cardPlacements[srcR]).length === 0) delete cardPlacements[srcR];
                    }
                    // 放置到目标
                    if (!cardPlacements[targetR]) cardPlacements[targetR] = {};
                    cardPlacements[targetR][targetC] = droppedId;
                    dragSource = null;
                    // 重新渲染
                    buildGridTable(card, cardPlacements, items, onDrop, onRemove, itemLabel);
                    updatePlacementInfo();
                    showStatus('已移动: ' + droppedId + ' → (' + targetR + ',' + targetC + ')', 'success');
                } else {
                    // 来自右侧列表 → 正常放置
                    onDrop(theCardId, targetR, targetC, droppedId);
                }
                dragSource = null;
            });
            // 双击移除
            td.addEventListener('dblclick', function(e) {
                const rid = parseInt(this.dataset.row);
                const cid = parseInt(this.dataset.col);
                if (cardPlacements[rid] && cardPlacements[rid][cid]) {
                    if (confirm('移除该位置的项目吗？')) {
                        onRemove(theCardId, rid, cid);
                    }
                }
            });
            // 右键删除
            td.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                const rid = parseInt(this.dataset.row);
                const cid = parseInt(this.dataset.col);
                if (cardPlacements[rid] && cardPlacements[rid][cid]) {
                    if (confirm('移除该位置的项目吗？')) {
                        onRemove(theCardId, rid, cid);
                    }
                }
            });
            // 键盘 Delete/Backspace 删除
            td.addEventListener('keydown', function(e) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    const rid = parseInt(this.dataset.row);
                    const cid = parseInt(this.dataset.col);
                    if (cardPlacements[rid] && cardPlacements[rid][cid]) {
                        if (confirm('移除该位置 (' + rid + ',' + cid + ') 的项目吗？')) {
                            onRemove(theCardId, rid, cid);
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

    // 自适应后固定行列尺寸（双 RAF 确保布局完成）
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            var boxH = container.clientHeight;
            var boxW = container.clientWidth;
            if (boxH <= 0 || boxW <= 0) return;

            // ---- 固定列宽 ----
            var dataColW = Math.floor((boxW - 28) / cols);
            if (dataColW >= 12) {
                // 表头列（除第一个角格外）全部设死宽度
                var colThs = headRow.querySelectorAll('th');
                for (var ci = 1; ci < colThs.length; ci++) {
                    colThs[ci].style.width = dataColW + 'px';
                    colThs[ci].style.maxWidth = dataColW + 'px';
                    colThs[ci].style.overflow = 'hidden';
                }
                // 数据格也设死宽度
                var dataRows = tbody.querySelectorAll('tr');
                for (var ri = 0; ri < dataRows.length; ri++) {
                    var cells = dataRows[ri].querySelectorAll('td');
                    for (var ci = 0; ci < cells.length; ci++) {
                        cells[ci].style.width = dataColW + 'px';
                        cells[ci].style.maxWidth = dataColW + 'px';
                    }
                }
            }

            // ---- 固定行高 ----
            var titleH = title.offsetHeight || 0;
            var remainH = boxH - titleH - 10; // title margin 8px + wrapper border 2px
            if (remainH <= 0) return;
            var hdrH = thead.offsetHeight || 0;
            var bodyH = remainH - hdrH;
            if (bodyH <= 0) return;
            var cellH = Math.floor(bodyH / rows);
            if (cellH < 12) return;
            var allRows = tbody.querySelectorAll('tr');
            for (var ri = 0; ri < allRows.length; ri++) {
                allRows[ri].style.height = cellH + 'px';
                allRows[ri].style.maxHeight = cellH + 'px';
                var cells = allRows[ri].querySelectorAll('td, th');
                for (var ci = 0; ci < cells.length; ci++) {
                    cells[ci].style.height = cellH + 'px';
                    cells[ci].style.maxHeight = cellH + 'px';
                    cells[ci].style.overflow = 'hidden';
                }
                // 内层 div 设死高度，确保裁剪
                var inners = allRows[ri].querySelectorAll('.cd-cell-inner');
                for (var ci = 0; ci < inners.length; ci++) {
                    inners[ci].style.height = cellH + 'px';
                    inners[ci].style.maxHeight = cellH + 'px';
                }
            }
        });
    });
}

function updatePlacementInfo() {
    const info = cardDom.placementInfo;
    if (!info) return;
    const state = currentCardType === 'ccr_card' ? ccrState : circuitState;
    let total = 0;
    for (const cardId of Object.keys(state.placements)) {
        const rows = state.placements[cardId];
        for (const r of Object.keys(rows)) {
            total += Object.keys(rows[r]).length;
        }
    }
    info.textContent = '当前共 ' + total + ' 个放置位置';
}

// ===================================================================
// CCR 卡片设计器（调光器卡片网格）
// ===================================================================

const ccrState = {
    cards: [],
    allCcrs: [],
    placements: {},
    selectedCardId: null,
};

function openCcrCardDesigner() {
    const allConfigs = getAllLoadedConfigs();

    const cardConfig = findConfigByFileName(allConfigs, 'ccr_card_config.json');
    if (!cardConfig || !Array.isArray(cardConfig.data) || cardConfig.data.length === 0) {
        showStatus('未找到卡片定义（ccr_card_config.json）', 'error');
        return;
    }
    ccrState.cards = cardConfig.data;

    const ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    ccrState.allCcrs = (ccrConfig && Array.isArray(ccrConfig.data)) ? ccrConfig.data : [];
    if (!ccrConfig) {
        showStatus('提示: 未加载 ccr_config.json，调光器列表为空。建议选择Config目录批量加载', 'info');
    }

    ccrState.placements = {};
    ccrState.selectedCardId = null;

    if (cardDom.designTitle) cardDom.designTitle.textContent = '调光器卡片 - 页面设计';
    if (cardDom.applyBtn) cardDom.applyBtn.textContent = '应用到ccr_config';
    if (cardDom.panelTitle) cardDom.panelTitle.textContent = '调光器列表';
    if (cardDom.ccrFilter) cardDom.ccrFilter.placeholder = '搜索调光器...';

    if (cardDom.cardSelector) cardDom.cardSelector.style.display = '';
    if (cardDom.ccrPanel) cardDom.ccrPanel.style.display = '';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';

    renderCardSelector();

    if (cardDom.modal) cardDom.modal.style.display = '';

    if (ccrState.cards.length > 0) {
        selectCard(ccrState.cards[0].id);
    }
}

function renderCardSelector() {
    const sel = cardDom.cardSelector;
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 选择卡片 --</option>' +
        ccrState.cards.map(c => '<option value="' + c.id + '">' + c.name + ' (' + c.id + ') ' + c.rows + '×' + c.columns + '</option>').join('');
    sel.onchange = function(e) {
        if (e.target.value) selectCard(e.target.value);
    };
}

function selectCard(cardId) {
    const card = ccrState.cards.find(c => c.id === cardId);
    if (!card) return;
    ccrState.selectedCardId = cardId;

    if (!ccrState.placements[cardId]) {
        ccrState.placements[cardId] = {};
    }

    if (cardDom.cardSelector) cardDom.cardSelector.value = cardId;

    renderCcrGrid(card);
    renderCcrList(card.site_id);
    updatePlacementInfo();
}

function ccrItemLabel(ccr) {
    return ccr.name;
}

function renderCcrGrid(card) {
    buildGridTable(
        card,
        ccrState.placements[card.id],
        ccrState.allCcrs,
        handleCcrDrop,
        handleCcrRemove,
        ccrItemLabel
    );
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
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">未加载 ccr_config.json<br>请先选择Config目录批量加载</div>';
        return;
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">该站点暂无匹配的调光器</div>';
        return;
    }

    filtered.sort((a, b) => (a.soc_index || 0) - (b.soc_index || 0));

    // 收集已放置在网格中的 CCR ID
    var placedCcrIds = {};
    for (var cId in ccrState.placements) {
        var rData = ccrState.placements[cId];
        for (var r in rData) {
            for (var c in rData[r]) {
                placedCcrIds[rData[r][c]] = true;
            }
        }
    }

    for (const ccr of filtered) {
        const isPlaced = !!placedCcrIds[ccr.id];
        const item = document.createElement('div');
        item.className = 'cd-ccr-item';
        item.draggable = !isPlaced;
        item.dataset.ccrId = ccr.id;
        item.style.cssText = 'padding:4px 8px;margin-bottom:2px;border-radius:4px;cursor:' + (isPlaced ? 'default' : 'grab') + ';font-size:12px;display:flex;align-items:center;gap:6px;transition:background 0.15s;' + (isPlaced ? 'opacity:0.45;' : '');
        item.addEventListener('mouseenter', function() {
            if (!isPlaced) this.style.background = 'var(--bg-hover)';
        });
        item.addEventListener('mouseleave', function() { this.style.background = ''; });

        const idxLabel = document.createElement('span');
        idxLabel.style.cssText = 'display:inline-block;min-width:28px;padding:1px 4px;border-radius:3px;background:var(--bg-selector);font-size:10px;text-align:center;color:var(--text-secondary);';
        idxLabel.textContent = ccr.soc_index === 256 ? '备' : '回路' + ((ccr.soc_index || 0) + 1);
        item.appendChild(idxLabel);

        if (isPlaced) {
            const pos = findPlacedPosition(ccrState.placements, ccr.id);
            const badge = document.createElement('span');
            badge.style.cssText = 'font-size:9px;padding:1px 4px;border-radius:3px;background:var(--accent-color,#0078D4);color:white;white-space:nowrap;';
            badge.textContent = pos ? '(' + pos.row + ',' + pos.col + ')' : '已放置';
            badge.title = ccr.name + ' (' + ccr.id + ')';
            item.appendChild(badge);
            if (pos) item.title = ccr.name + ' (' + ccr.id + ') 已放置于 (' + pos.row + ',' + pos.col + ')';
        }

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameSpan.textContent = ccr.name;
        item.appendChild(nameSpan);

        const idSpan = document.createElement('span');
        idSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);';
        idSpan.textContent = ccr.id;
        item.appendChild(idSpan);

        item.addEventListener('dragstart', function(e) {
            if (isPlaced) {
                e.preventDefault();
                showStatus('该调光器已在网格中，不能重复放置', 'warning');
                return;
            }
            dragSource = null; // 来自右侧列表
            e.dataTransfer.setData('text/plain', ccr.id);
            this.style.opacity = '0.5';
        });
        item.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });

        list.appendChild(item);
    }
}

function handleCcrDrop(cardId, row, col, ccrId) {
    if (!cardId || !row || !col || !ccrId) return;
    const r = parseInt(row);
    const c = parseInt(col);
    if (isNaN(r) || isNaN(c)) return;

    // 检查是否已在整个网格中存在
    for (var cId in ccrState.placements) {
        var rData = ccrState.placements[cId];
        for (var rStr in rData) {
            for (var cStr in rData[rStr]) {
                if (rData[rStr][cStr] === ccrId) {
                    showStatus('该调光器已在网格中，不能重复放置', 'warning');
                    return;
                }
            }
        }
    }

    if (!ccrState.placements[cardId]) ccrState.placements[cardId] = {};
    if (!ccrState.placements[cardId][r]) ccrState.placements[cardId][r] = {};

    if (ccrState.placements[cardId][r][c]) {
        if (!confirm('该位置已有调光器，是否替换？')) return;
    }

    ccrState.placements[cardId][r][c] = ccrId;

    const card = ccrState.cards.find(ca => ca.id === cardId);
    if (card) renderCcrGrid(card);
    renderCcrList(card ? card.site_id : null);
    updatePlacementInfo();
    showStatus('已放置: ' + ccrId + ' → (' + r + ',' + c + ')', 'success');
}

function handleCcrRemove(cardId, row, col) {
    if (!ccrState.placements[cardId]) return;
    if (!ccrState.placements[cardId][row]) return;
    delete ccrState.placements[cardId][row][col];
    if (Object.keys(ccrState.placements[cardId][row]).length === 0) {
        delete ccrState.placements[cardId][row];
    }
    const card = ccrState.cards.find(c => c.id === cardId);
    if (card) renderCcrGrid(card);
    renderCcrList(card ? card.site_id : null);
    updatePlacementInfo();
    showStatus('已移除 (' + row + ',' + col + ')', 'info');
}

function generateCcrMapping() {
    const result = [];
    for (const cardId of Object.keys(ccrState.placements)) {
        const rows = ccrState.placements[cardId];
        for (const rStr of Object.keys(rows)) {
            const r = parseInt(rStr);
            for (const cStr of Object.keys(rows[r])) {
                const c = parseInt(cStr);
                const ccrId = rows[r][cStr];
                result.push({
                    card_id: cardId,
                    card_row: r,
                    card_columns: c,
                    ccr_id: ccrId,
                });
            }
        }
    }
    result.sort((a, b) => {
        if (a.card_id !== b.card_id) return a.card_id.localeCompare(b.card_id);
        if (a.card_row !== b.card_row) return a.card_row - b.card_row;
        return a.card_columns - b.card_columns;
    });

    const json = JSON.stringify(result, null, 4);
    if (cardDom.outputArea) {
        cardDom.outputArea.textContent = json;
        cardDom.outputArea.style.display = '';
    }
    return json;
}

function applyPlacementsToCcrConfig() {
    var allConfigs = getAllLoadedConfigs();
    var ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    if (!ccrConfig || !Array.isArray(ccrConfig.data)) {
        showStatus('未找到 ccr_config.json', 'error');
        return;
    }

    var totalPlacements = 0;
    for (var cardId in ccrState.placements) {
        for (var r in ccrState.placements[cardId]) {
            totalPlacements += Object.keys(ccrState.placements[cardId][r]).length;
        }
    }
    if (totalPlacements === 0) {
        showStatus('当前没有放置任何调光器，请先从右侧列表拖拽到网格', 'error');
        return;
    }

    var placementMap = {};
    for (var cardId in ccrState.placements) {
        var rows = ccrState.placements[cardId];
        for (var rStr in rows) {
            var r = parseInt(rStr);
            for (var cStr in rows[rStr]) {
                var c = parseInt(cStr);
                var ccrId = rows[rStr][cStr];
                placementMap[ccrId] = { row: r, colum: c };
            }
        }
    }

    var hasRow = ccrConfig.schema.fields.some(function(f) { return f.key === 'row'; });
    if (!hasRow) {
        ccrConfig.schema.fields.push({ key: 'row', label: 'row', type: 1 /*INT*/, required: false });
        ccrConfig.schema.fields.push({ key: 'colum', label: 'colum', type: 1 /*INT*/, required: false });
    }

    var updatedCount = 0;
    for (var i = 0; i < ccrConfig.data.length; i++) {
        var ccr = ccrConfig.data[i];
        var placement = placementMap[ccr.id];
        if (placement) {
            ccr.row = placement.row;
            ccr.colum = placement.colum;
            updatedCount++;
        }
    }

    ccrConfig.modified = true;

    var currentKey = getCurrentKey();
    for (var key in allConfigs) {
        if (allConfigs[key] === ccrConfig) {
            if (key === currentKey) {
                document.dispatchEvent(new CustomEvent('config-selected', {
                    detail: { key: key, data: ccrConfig.data, schema: ccrConfig.schema, fileName: ccrConfig.fileName }
                }));
            }
            break;
        }
    }

    showStatus('已应用 ' + updatedCount + ' 个调光器的行列位置到 ccr_config（仅放置的条目）', 'success');
}

// ===================================================================
// 回路卡片设计器（回路卡片网格）
// ===================================================================

const circuitState = {
    cards: [],
    allCircuits: [],
    placements: {},
    selectedCardId: null,
};

function openCircuitCardDesigner() {
    const allConfigs = getAllLoadedConfigs();

    const cardConfig = findConfigByFileName(allConfigs, 'circuit_card_config.json');
    if (!cardConfig || !Array.isArray(cardConfig.data) || cardConfig.data.length === 0) {
        showStatus('未找到卡片定义（circuit_card_config.json）', 'error');
        return;
    }
    circuitState.cards = cardConfig.data;

    const circuitConfig = findConfigByFileName(allConfigs, 'circuit_config.json');
    circuitState.allCircuits = (circuitConfig && Array.isArray(circuitConfig.data)) ? circuitConfig.data : [];
    if (!circuitConfig) {
        showStatus('提示: 未加载 circuit_config.json，回路列表为空', 'info');
    }

    circuitState.placements = {};
    circuitState.selectedCardId = null;

    if (cardDom.designTitle) cardDom.designTitle.textContent = '回路卡片 - 页面设计';
    if (cardDom.applyBtn) cardDom.applyBtn.textContent = '应用到circuit_config';
    if (cardDom.panelTitle) cardDom.panelTitle.textContent = '回路列表';
    if (cardDom.ccrFilter) cardDom.ccrFilter.placeholder = '搜索回路...';

    if (cardDom.cardSelector) cardDom.cardSelector.style.display = '';
    if (cardDom.ccrPanel) cardDom.ccrPanel.style.display = '';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';

    renderCircuitCardSelector();

    if (cardDom.modal) cardDom.modal.style.display = '';

    if (circuitState.cards.length > 0) {
        selectCircuitCard(circuitState.cards[0].id);
    }
}

function renderCircuitCardSelector() {
    const sel = cardDom.cardSelector;
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 选择卡片 --</option>' +
        circuitState.cards.map(c => '<option value="' + c.id + '">' + c.name + ' (' + c.id + ') ' + c.rows + '×' + c.columns + '</option>').join('');
    sel.onchange = function(e) {
        if (e.target.value) selectCircuitCard(e.target.value);
    };
}

function selectCircuitCard(cardId) {
    const card = circuitState.cards.find(c => c.id === cardId);
    if (!card) return;
    circuitState.selectedCardId = cardId;

    if (!circuitState.placements[cardId]) {
        circuitState.placements[cardId] = {};
    }

    if (cardDom.cardSelector) cardDom.cardSelector.value = cardId;

    renderCircuitGrid(card);
    renderCircuitList(card.site_id);
    updatePlacementInfo();
}

function circuitItemLabel(circuit) {
    return circuit.name;
}

function renderCircuitGrid(card) {
    buildGridTable(
        card,
        circuitState.placements[card.id],
        circuitState.allCircuits,
        handleCircuitDrop,
        handleCircuitRemove,
        circuitItemLabel
    );
}

function renderCircuitList(siteId) {
    const list = cardDom.ccrList;
    const filter = cardDom.ccrFilter;
    if (!list) return;

    const filtered = circuitState.allCircuits.filter(circuit => {
        if (siteId && circuit.site_id !== siteId) return false;
        if (filter && filter.value) {
            const kw = filter.value.toLowerCase();
            return (circuit.name && circuit.name.toLowerCase().includes(kw)) ||
                   (circuit.id && circuit.id.toLowerCase().includes(kw));
        }
        return true;
    });

    list.innerHTML = '';
    if (circuitState.allCircuits.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">未加载 circuit_config.json<br>请先选择Config目录批量加载</div>';
        return;
    }
    if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-secondary);font-size:12px;">该站点暂无匹配的回路</div>';
        return;
    }

    // 收集已放置在网格中的回路 ID
    var placedCircuitIds = {};
    for (var cId in circuitState.placements) {
        var rData = circuitState.placements[cId];
        for (var r in rData) {
            for (var c in rData[r]) {
                placedCircuitIds[rData[r][c]] = true;
            }
        }
    }

    for (const circuit of filtered) {
        const isPlaced = !!placedCircuitIds[circuit.id];
        const item = document.createElement('div');
        item.className = 'cd-ccr-item';
        item.draggable = !isPlaced;
        item.dataset.circuitId = circuit.id;
        item.style.cssText = 'padding:4px 8px;margin-bottom:2px;border-radius:4px;cursor:' + (isPlaced ? 'default' : 'grab') + ';font-size:12px;display:flex;align-items:center;gap:6px;transition:background 0.15s;' + (isPlaced ? 'opacity:0.45;' : '');
        item.addEventListener('mouseenter', function() {
            if (!isPlaced) this.style.background = 'var(--bg-hover)';
        });
        item.addEventListener('mouseleave', function() { this.style.background = ''; });

        const idxLabel = document.createElement('span');
        idxLabel.style.cssText = 'display:inline-block;min-width:28px;padding:1px 4px;border-radius:3px;background:var(--bg-selector);font-size:10px;text-align:center;color:var(--text-secondary);';
        idxLabel.textContent = '回路' + (circuit.select_index ?? '');
        item.appendChild(idxLabel);

        if (isPlaced) {
            const pos = findPlacedPosition(circuitState.placements, circuit.id);
            const badge = document.createElement('span');
            badge.style.cssText = 'font-size:9px;padding:1px 4px;border-radius:3px;background:var(--accent-color,#0078D4);color:white;white-space:nowrap;';
            badge.textContent = pos ? '(' + pos.row + ',' + pos.col + ')' : '已放置';
            badge.title = circuit.name + ' (' + circuit.id + ')';
            item.appendChild(badge);
            if (pos) item.title = circuit.name + ' (' + circuit.id + ') 已放置于 (' + pos.row + ',' + pos.col + ')';
        }

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameSpan.textContent = circuit.name || circuit.id;
        item.appendChild(nameSpan);

        const idSpan = document.createElement('span');
        idSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);';
        idSpan.textContent = circuit.id;
        item.appendChild(idSpan);

        item.addEventListener('dragstart', function(e) {
            if (isPlaced) {
                e.preventDefault();
                showStatus('该回路已在网格中，不能重复放置', 'warning');
                return;
            }
            dragSource = null;
            e.dataTransfer.setData('text/plain', circuit.id);
            this.style.opacity = '0.5';
        });
        item.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });

        list.appendChild(item);
    }
}

function handleCircuitDrop(cardId, row, col, circuitId) {
    if (!cardId || !row || !col || !circuitId) return;
    const r = parseInt(row);
    const c = parseInt(col);
    if (isNaN(r) || isNaN(c)) return;

    // 检查是否已在整个网格中存在
    for (var cId in circuitState.placements) {
        var rData = circuitState.placements[cId];
        for (var rStr in rData) {
            for (var cStr in rData[rStr]) {
                if (rData[rStr][cStr] === circuitId) {
                    showStatus('该回路已在网格中，不能重复放置', 'warning');
                    return;
                }
            }
        }
    }

    if (!circuitState.placements[cardId]) circuitState.placements[cardId] = {};
    if (!circuitState.placements[cardId][r]) circuitState.placements[cardId][r] = {};

    if (circuitState.placements[cardId][r][c]) {
        if (!confirm('该位置已有回路，是否替换？')) return;
    }

    circuitState.placements[cardId][r][c] = circuitId;

    const card = circuitState.cards.find(ca => ca.id === cardId);
    if (card) renderCircuitGrid(card);
    renderCircuitList(card ? card.site_id : null);
    updatePlacementInfo();
    showStatus('已放置: ' + circuitId + ' → (' + r + ',' + c + ')', 'success');
}

function handleCircuitRemove(cardId, row, col) {
    if (!circuitState.placements[cardId]) return;
    if (!circuitState.placements[cardId][row]) return;
    delete circuitState.placements[cardId][row][col];
    if (Object.keys(circuitState.placements[cardId][row]).length === 0) {
        delete circuitState.placements[cardId][row];
    }
    const card = circuitState.cards.find(c => c.id === cardId);
    if (card) renderCircuitGrid(card);
    renderCircuitList(card ? card.site_id : null);
    updatePlacementInfo();
    showStatus('已移除 (' + row + ',' + col + ')', 'info');
}

function generateCircuitMapping() {
    const result = [];
    for (const cardId of Object.keys(circuitState.placements)) {
        const rows = circuitState.placements[cardId];
        for (const rStr of Object.keys(rows)) {
            const r = parseInt(rStr);
            for (const cStr of Object.keys(rows[r])) {
                const c = parseInt(cStr);
                const circuitId = rows[r][cStr];
                result.push({
                    card_id: cardId,
                    card_row: r,
                    card_columns: c,
                    circuit_id: circuitId,
                });
            }
        }
    }
    result.sort((a, b) => {
        if (a.card_id !== b.card_id) return a.card_id.localeCompare(b.card_id);
        if (a.card_row !== b.card_row) return a.card_row - b.card_row;
        return a.card_columns - b.card_columns;
    });

    const json = JSON.stringify(result, null, 4);
    if (cardDom.outputArea) {
        cardDom.outputArea.textContent = json;
        cardDom.outputArea.style.display = '';
    }
    return json;
}

function applyPlacementsToCircuitConfig() {
    var allConfigs = getAllLoadedConfigs();
    var circuitConfig = findConfigByFileName(allConfigs, 'circuit_config.json');
    if (!circuitConfig || !Array.isArray(circuitConfig.data)) {
        showStatus('未找到 circuit_config.json', 'error');
        return;
    }

    var totalPlacements = 0;
    for (var cardId in circuitState.placements) {
        for (var r in circuitState.placements[cardId]) {
            totalPlacements += Object.keys(circuitState.placements[cardId][r]).length;
        }
    }
    if (totalPlacements === 0) {
        showStatus('当前没有放置任何回路，请先从右侧列表拖拽到网格', 'error');
        return;
    }

    var placementMap = {};
    for (var cardId in circuitState.placements) {
        var rows = circuitState.placements[cardId];
        for (var rStr in rows) {
            var r = parseInt(rStr);
            for (var cStr in rows[rStr]) {
                var c = parseInt(cStr);
                var circuitId = rows[rStr][cStr];
                placementMap[circuitId] = { row: r, colum: c };
            }
        }
    }

    var hasRow = circuitConfig.schema.fields.some(function(f) { return f.key === 'row'; });
    if (!hasRow) {
        circuitConfig.schema.fields.push({ key: 'row', label: 'row', type: 1 /*INT*/, required: false });
        circuitConfig.schema.fields.push({ key: 'colum', label: 'colum', type: 1 /*INT*/, required: false });
    }

    var updatedCount = 0;
    for (var i = 0; i < circuitConfig.data.length; i++) {
        var circuit = circuitConfig.data[i];
        var placement = placementMap[circuit.id];
        if (placement) {
            circuit.row = placement.row;
            circuit.colum = placement.colum;
            updatedCount++;
        }
    }

    circuitConfig.modified = true;

    var currentKey = getCurrentKey();
    for (var key in allConfigs) {
        if (allConfigs[key] === circuitConfig) {
            if (key === currentKey) {
                document.dispatchEvent(new CustomEvent('config-selected', {
                    detail: { key: key, data: circuitConfig.data, schema: circuitConfig.schema, fileName: circuitConfig.fileName }
                }));
            }
            break;
        }
    }

    showStatus('已应用 ' + updatedCount + ' 个回路的行列位置到 circuit_config（仅放置的条目）', 'success');
}

// ===================================================================
// 初始化
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
        cardDom.modal.addEventListener('click', function(e) {
            if (e.target === cardDom.modal) closeDesigner();
        });
    }

    if (cardDom.ccrFilter) {
        cardDom.ccrFilter.addEventListener('input', function() {
            if (currentCardType === 'ccr_card' && ccrState.selectedCardId) {
                const card = ccrState.cards.find(c => c.id === ccrState.selectedCardId);
                if (card) renderCcrList(card.site_id);
            } else if (currentCardType === 'circuit_card' && circuitState.selectedCardId) {
                const card = circuitState.cards.find(c => c.id === circuitState.selectedCardId);
                if (card) renderCircuitList(card.site_id);
            }
        });
    }

    if (cardDom.generateBtn) {
        cardDom.generateBtn.addEventListener('click', function() {
            if (currentCardType === 'ccr_card') {
                const json = generateCcrMapping();
                showStatus('已生成 ' + JSON.parse(json).length + ' 条映射', 'success');
            } else if (currentCardType === 'circuit_card') {
                const json = generateCircuitMapping();
                showStatus('已生成 ' + JSON.parse(json).length + ' 条映射', 'success');
            }
        });
    }

    if (cardDom.applyBtn) {
        cardDom.applyBtn.addEventListener('click', function() {
            if (currentCardType === 'ccr_card') {
                applyPlacementsToCcrConfig();
            } else if (currentCardType === 'circuit_card') {
                applyPlacementsToCircuitConfig();
            }
        });
    }

    if (cardDom.clearBtn) {
        cardDom.clearBtn.addEventListener('click', function() {
            if (currentCardType === 'ccr_card') {
                if (!confirm('清空所有放置？')) return;
                ccrState.placements = {};
                if (ccrState.selectedCardId) {
                    const card = ccrState.cards.find(c => c.id === ccrState.selectedCardId);
                    if (card) renderCcrGrid(card);
                }
                updatePlacementInfo();
                if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
                showStatus('已清空', 'info');
            } else if (currentCardType === 'circuit_card') {
                if (!confirm('清空所有放置？')) return;
                circuitState.placements = {};
                if (circuitState.selectedCardId) {
                    const card = circuitState.cards.find(c => c.id === circuitState.selectedCardId);
                    if (card) renderCircuitGrid(card);
                }
                updatePlacementInfo();
                if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
                showStatus('已清空', 'info');
            }
        });
    }

    if (cardDom.designerBtn) cardDom.designerBtn.style.display = 'none';
}

function closeDesigner() {
    if (cardDom.modal) cardDom.modal.style.display = 'none';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
}
