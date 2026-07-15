// cardDesigner.js — 卡片页面设计器（调光器卡片网格布局 / CGD布局）
// 用于 ccr_card_config（网格放置CCR）和 circuit_card_config（CGD视觉布局）

import { showStatus } from './core.js';
import { getAllLoadedConfigs, getCurrentKey } from './configProject.js';

// ========== 状态 ==========
let currentCardType = null;   // 'ccr_card' | 'circuit_card'
let cardDom = {};

function bindCardDom() {
    cardDom = {
        designerBtn: document.getElementById('cardDesignerBtn'),
        modal: document.getElementById('cardDesignerModal'),
        closeBtn: document.getElementById('cardDesignerClose'),
        cardSelector: document.getElementById('cdCardSelector'),
        gridContainer: document.getElementById('cdGridContainer'),
        ccrPanel: document.getElementById('cdCcrPanel'),
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

/** 检查当前选中配置是否为卡片类型 */
export function isCardConfig(key, schema) {
    if (!key || !schema) return false;
    // ccr_card_config / circuit_card_config
    return key === 'ccr_card_config' || key === 'circuit_card_config' ||
           (schema.label && schema.label.includes('card'));
}

/** 获取卡片类型标识 */
function getCardType(key) {
    if (key === 'ccr_card_config') return 'ccr_card';
    if (key === 'circuit_card_config') return 'circuit_card';
    if (key && key.includes('card')) return 'ccr_card'; // 默认
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
// CCR 卡片设计器（调光器卡片网格）
// ===================================================================

const ccrState = {
    cards: [],          // ccr_card_config 数据
    allCcrs: [],        // ccr_config 数据
    placements: {},     // { cardId: { row: { col: ccrId } } }
    selectedCardId: null,
};

function findConfigByFileName(allConfigs, fileName) {
    for (const key of Object.keys(allConfigs)) {
        if (allConfigs[key].fileName === fileName) return allConfigs[key];
    }
    return null;
}

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

    // 恢复面板显示
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

function renderCcrGrid(card) {
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
    wrapper.style.cssText = 'overflow:auto;max-height:500px;border:1px solid var(--border-color);border-radius:6px;';

    const table = document.createElement('table');
    table.className = 'cd-grid-table';
    table.style.cssText = 'border-collapse:collapse;font-size:11px;min-width:100%;';

    // 列头
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const thCorner = document.createElement('th');
    thCorner.style.cssText = 'position:sticky;top:0;left:0;z-index:3;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;min-width:24px;';
    thCorner.textContent = '';
    headRow.appendChild(thCorner);

    const thRowLabel = document.createElement('th');
    thRowLabel.style.cssText = 'position:sticky;top:0;z-index:2;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;min-width:24px;font-size:10px;color:var(--text-secondary);';
    thRowLabel.textContent = '行\\列';
    headRow.appendChild(thRowLabel);

    for (let c = 1; c <= cols; c++) {
        const th = document.createElement('th');
        th.style.cssText = 'position:sticky;top:0;z-index:2;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;min-width:32px;font-size:10px;color:var(--text-secondary);';
        th.textContent = c;
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const placements = ccrState.placements[card.id] || {};

    for (let r = 1; r <= rows; r++) {
        const tr = document.createElement('tr');
        // 行号（sticky）
        const tdRowNum = document.createElement('td');
        tdRowNum.style.cssText = 'position:sticky;left:0;z-index:1;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);min-width:24px;';
        tdRowNum.textContent = r;
        tr.appendChild(tdRowNum);

        const tdRowLabel = document.createElement('td');
        tdRowLabel.style.cssText = 'position:sticky;left:24px;z-index:1;background:var(--bg-selector);border:1px solid var(--border-color);padding:2px 4px;text-align:center;font-size:10px;color:var(--text-secondary);min-width:24px;';
        tdRowLabel.textContent = r;
        tr.appendChild(tdRowLabel);

        for (let c = 1; c <= cols; c++) {
            const td = document.createElement('td');
            td.className = 'cd-grid-cell';
            td.dataset.row = r;
            td.dataset.col = c;
            td.style.cssText = 'border:1px solid var(--border-color);padding:2px;text-align:center;min-width:32px;height:30px;cursor:pointer;transition:background 0.15s;font-size:10px;vertical-align:middle;';

            const rowData = placements[r];
            const ccrId = rowData ? rowData[c] : null;
            if (ccrId) {
                const ccr = ccrState.allCcrs.find(cc => cc.id === ccrId);
                td.textContent = ccr ? ccr.name : ccrId;
                td.title = ccrId;
                td.style.background = 'var(--accent-color, #0078D4)';
                td.style.color = 'white';
                td.style.fontWeight = '600';
            }

            // 拖放
            td.addEventListener('dragover', function(e) { e.preventDefault(); this.style.background = 'var(--bg-hover)'; });
            td.addEventListener('dragleave', function(e) {
                this.style.background = this.textContent ? 'var(--accent-color, #0078D4)' : '';
            });
            td.addEventListener('drop', function(e) {
                e.preventDefault();
                handleCcrDrop(card.id, this.dataset.row, this.dataset.col, e.dataTransfer.getData('text/plain'));
            });
            // 双击移除
            td.addEventListener('dblclick', function(e) {
                const rid = parseInt(this.dataset.row);
                const cid = parseInt(this.dataset.col);
                const rowData2 = placements[rid];
                if (rowData2 && rowData2[cid]) {
                    if (confirm('移除该位置的CCR吗？')) {
                        removePlacement(card.id, rid, cid);
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

    for (const ccr of filtered) {
        const item = document.createElement('div');
        item.className = 'cd-ccr-item';
        item.draggable = true;
        item.dataset.ccrId = ccr.id;
        item.style.cssText = 'padding:4px 8px;margin-bottom:2px;border-radius:4px;cursor:grab;font-size:12px;display:flex;align-items:center;gap:6px;transition:background 0.15s;';
        item.addEventListener('mouseenter', function() { this.style.background = 'var(--bg-hover)'; });
        item.addEventListener('mouseleave', function() { this.style.background = ''; });

        const idxLabel = document.createElement('span');
        idxLabel.style.cssText = 'display:inline-block;min-width:28px;padding:1px 4px;border-radius:3px;background:var(--bg-selector);font-size:10px;text-align:center;color:var(--text-secondary);';
        idxLabel.textContent = ccr.soc_index === 256 ? '备' : 'CH' + ((ccr.soc_index || 0) + 1);
        item.appendChild(idxLabel);

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameSpan.textContent = ccr.name;
        item.appendChild(nameSpan);

        const idSpan = document.createElement('span');
        idSpan.style.cssText = 'font-size:10px;color:var(--text-secondary);';
        idSpan.textContent = ccr.id;
        item.appendChild(idSpan);

        item.addEventListener('dragstart', function(e) {
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

    if (!ccrState.placements[cardId]) ccrState.placements[cardId] = {};
    if (!ccrState.placements[cardId][r]) ccrState.placements[cardId][r] = {};

    if (ccrState.placements[cardId][r][c]) {
        if (!confirm('该位置已有CCR，是否替换？')) return;
    }

    ccrState.placements[cardId][r][c] = ccrId;

    const card = ccrState.cards.find(ca => ca.id === cardId);
    if (card) renderCcrGrid(card);
    updatePlacementInfo();
    showStatus('已放置: ' + ccrId + ' → (' + r + ',' + c + ')', 'success');
}

function removePlacement(cardId, row, col) {
    if (!ccrState.placements[cardId]) return;
    if (!ccrState.placements[cardId][row]) return;
    delete ccrState.placements[cardId][row][col];
    if (Object.keys(ccrState.placements[cardId][row]).length === 0) {
        delete ccrState.placements[cardId][row];
    }
    const card = ccrState.cards.find(c => c.id === cardId);
    if (card) renderCcrGrid(card);
    updatePlacementInfo();
    showStatus('已移除 (' + row + ',' + col + ')', 'info');
}

function updatePlacementInfo() {
    const info = cardDom.placementInfo;
    if (!info) return;
    let total = 0;
    for (const cardId of Object.keys(ccrState.placements)) {
        const rows = ccrState.placements[cardId];
        for (const r of Object.keys(rows)) {
            total += Object.keys(rows[r]).length;
        }
    }
    info.textContent = '当前共 ' + total + ' 个放置位置';
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
                    card_colum: c,
                    ccr_id: ccrId,
                });
            }
        }
    }
    result.sort((a, b) => {
        if (a.card_id !== b.card_id) return a.card_id.localeCompare(b.card_id);
        if (a.card_row !== b.card_row) return a.card_row - b.card_row;
        return a.card_colum - b.card_colum;
    });

    const json = JSON.stringify(result, null, 4);
    if (cardDom.outputArea) {
        cardDom.outputArea.textContent = json;
        cardDom.outputArea.style.display = '';
    }
    return json;
}

/**
 * 将网格放置的row/colum应用到ccr_config数据
 * 只有被拖拽到网格的CCR会获得row/colum字段
 */
function applyPlacementsToCcrConfig() {
    var allConfigs = getAllLoadedConfigs();
    var ccrConfig = findConfigByFileName(allConfigs, 'ccr_config.json');
    if (!ccrConfig || !Array.isArray(ccrConfig.data)) {
        showStatus('未找到 ccr_config.json', 'error');
        return;
    }

    // 统计放置总数
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

    // 构建放置映射: ccrId -> {row, colum}
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

    // 确保schema包含row/colum字段（防止旧模块缓存不含新字段）
    var hasRow = ccrConfig.schema.fields.some(function(f) { return f.key === 'row'; });
    if (!hasRow) {
        ccrConfig.schema.fields.push({ key: 'row', label: 'row', type: FieldType.INT, required: false });
        ccrConfig.schema.fields.push({ key: 'colum', label: 'colum', type: FieldType.INT, required: false });
    }

    // 更新ccr_config数据——只有被放置的CCR添加row/colum
    var updatedCount = 0;
    for (var i = 0; i < ccrConfig.data.length; i++) {
        var ccr = ccrConfig.data[i];
        var placement = placementMap[ccr.id];
        if (placement) {
            ccr.row = placement.row;
            ccr.colum = placement.colum;
            updatedCount++;
        }
        // 未放置的CCR不添加row/colum字段（用户要求：只有拖拽的生成）
    }

    ccrConfig.modified = true;

    // 如果当前正在查看ccr_config，刷新编辑器以显示新列和数据
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
// 回路卡片设计器（CGD 布局）
// ===================================================================

function openCircuitCardDesigner() {
    const allConfigs = getAllLoadedConfigs();
    const cardConfig = findConfigByFileName(allConfigs, 'circuit_card_config.json');
    if (!cardConfig || !Array.isArray(cardConfig.data) || cardConfig.data.length === 0) {
        showStatus('未找到 CGD 数据（circuit_card_config.json）', 'error');
        return;
    }

    if (cardDom.designTitle) cardDom.designTitle.textContent = 'CGD 布局 - 页面设计';

    if (cardDom.cardSelector) cardDom.cardSelector.style.display = 'none';
    if (cardDom.ccrPanel) cardDom.ccrPanel.style.display = 'none';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';

    if (cardDom.modal) cardDom.modal.style.display = '';

    renderCircuitCardView(cardConfig.data);
}

function renderCircuitCardView(data) {
    const container = cardDom.gridContainer;
    if (!container) return;
    container.innerHTML = '';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:600;font-size:14px;margin-bottom:8px;';
    title.textContent = 'CGD 布局（' + data.length + ' 个设备）';
    container.appendChild(title);

    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;width:100%;font-size:12px;';
    table.innerHTML = '<thead><tr>' +
        '<th style="border:1px solid var(--border-color);padding:4px 8px;background:var(--bg-selector);text-align:left;">ID</th>' +
        '<th style="border:1px solid var(--border-color);padding:4px 8px;background:var(--bg-selector);text-align:left;">名称</th>' +
        '<th style="border:1px solid var(--border-color);padding:4px 8px;background:var(--bg-selector);text-align:center;">行</th>' +
        '<th style="border:1px solid var(--border-color);padding:4px 8px;background:var(--bg-selector);text-align:center;">列</th>' +
        '<th style="border:1px solid var(--border-color);padding:4px 8px;background:var(--bg-selector);text-align:center;">X</th>' +
        '<th style="border:1px solid var(--border-color);padding:4px 8px;background:var(--bg-selector);text-align:center;">Y</th>' +
        '</tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');

    for (const item of data) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td style="border:1px solid var(--border-color);padding:4px 8px;">' + (item.id || '') + '</td>' +
            '<td style="border:1px solid var(--border-color);padding:4px 8px;">' + (item.name || '') + '</td>' +
            '<td style="border:1px solid var(--border-color);padding:4px 8px;text-align:center;">' + (item.row ?? '') + '</td>' +
            '<td style="border:1px solid var(--border-color);padding:4px 8px;text-align:center;">' + (item.colum ?? '') + '</td>' +
            '<td style="border:1px solid var(--border-color);padding:4px 8px;text-align:center;">' + (item.x ?? '') + '</td>' +
            '<td style="border:1px solid var(--border-color);padding:4px 8px;text-align:center;">' + (item.y ?? '') + '</td>';
        tbody.appendChild(tr);
    }

    container.appendChild(table);
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
            if (ccrState.selectedCardId) {
                const card = ccrState.cards.find(c => c.id === ccrState.selectedCardId);
                if (card) renderCcrList(card.site_id);
            }
        });
    }

    if (cardDom.generateBtn) {
        cardDom.generateBtn.addEventListener('click', function() {
            if (currentCardType === 'ccr_card') {
                const json = generateCcrMapping();
                showStatus('已生成 ' + JSON.parse(json).length + ' 条映射', 'success');
            }
        });
    }

    if (cardDom.applyBtn) {
        cardDom.applyBtn.addEventListener('click', function() {
            if (currentCardType === 'ccr_card') {
                applyPlacementsToCcrConfig();
            }
        });
    }

    if (cardDom.clearBtn) {
        cardDom.clearBtn.addEventListener('click', function() {
            if (!currentCardType) return;
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
            }
        });
    }

    if (cardDom.designerBtn) cardDom.designerBtn.style.display = 'none';
}

function closeDesigner() {
    if (cardDom.modal) cardDom.modal.style.display = 'none';
    if (cardDom.outputArea) cardDom.outputArea.style.display = 'none';
    // 恢复面板（下次打开时由 open* 方法控制）
}
