// ============================================================
// 快捷编辑 - 管理用户自定义文本片段（含删除功能）
// ============================================================
import { showStatus } from './core.js';

const STORAGE_KEY = 'quick_edit_texts';

// 追踪最后聚焦的输入框（解决点击按钮时焦点丢失问题）
let lastFocusedInput = null;
document.addEventListener('mousedown', (e) => {
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') &&
        !el.closest('#quickEditInput') && !el.closest('.right-panel')) {
        lastFocusedInput = el;
    }
}, true); // 捕获阶段，在 blur 之前执行

// 获取所有快捷文本
export function getQuickEditTexts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

// 保存快捷文本列表
export function saveQuickEditTexts(texts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
}

// 在光标位置插入文本
export function insertTextAtCursor(text) {
    const active = document.activeElement;
    let target = null;
    // 优先使用当前聚焦的输入框，其次使用最后记录的输入框
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        target = active;
    } else if (lastFocusedInput && document.body.contains(lastFocusedInput)) {
        target = lastFocusedInput;
    }
    if (target) {
        target.focus();
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const val = target.value;
        target.value = val.substring(0, start) + text + val.substring(end);
        const newPos = start + text.length;
        target.selectionStart = target.selectionEnd = newPos;
        showStatus(`已插入”${text}”`, 'success');
    } else {
        showStatus('请先点击表格中的输入框', 'error');
    }
}

// 删除单个快捷文本
function deleteQuickEditText(text) {
    const texts = getQuickEditTexts();
    const index = texts.indexOf(text);
    if (index === -1) return;
    texts.splice(index, 1);
    saveQuickEditTexts(texts);
    renderQuickEditButtons(); // 重新渲染
    showStatus(`已删除“${text}”`, 'info');
}

// 渲染所有快捷按钮
export function renderQuickEditButtons() {
    const container = document.getElementById('quickEditContainer');
    if (!container) {
        console.warn('快捷编辑容器 #quickEditContainer 未找到');
        return;
    }
    const texts = getQuickEditTexts();
    container.innerHTML = '';
    if (texts.length === 0) {
        container.innerHTML = '<span style="color:var(--text-secondary); font-size:12px; padding:4px 0;">暂无快捷文本，请添加</span>';
        return;
    }
    texts.forEach(text => {
        const wrapper = document.createElement('span');
        wrapper.style.cssText = 'display:inline-flex; align-items:center; gap:2px;';
        
        const btn = document.createElement('button');
        btn.className = 'quick-edit-btn';
        btn.textContent = text;
        btn.style.cssText = 'padding:2px 10px; border:1px solid var(--border-color); border-radius:12px; background:var(--bg-input); color:var(--text-primary); cursor:pointer; font-size:12px;';
        btn.addEventListener('click', () => insertTextAtCursor(text));
        wrapper.appendChild(btn);
        
        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.style.cssText = 'padding:0 4px; border:none; background:transparent; color:var(--msg-error-text); cursor:pointer; font-size:12px; line-height:1;';
        delBtn.title = '删除此快捷文本';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteQuickEditText(text);
        });
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });
}

// 添加新的快捷文本
export function addQuickEditText() {
    const input = document.getElementById('quickEditInput');
    if (!input) {
        showStatus('输入框 #quickEditInput 未找到', 'error');
        return;
    }
    const text = input.value.trim();
    if (!text) {
        showStatus('请输入文本', 'error');
        return;
    }
    const texts = getQuickEditTexts();
    if (texts.includes(text)) {
        showStatus(`文本“${text}”已存在`, 'info');
        return;
    }
    texts.push(text);
    saveQuickEditTexts(texts);
    renderQuickEditButtons();
    input.value = '';
    showStatus(`已添加快捷文本“${text}”`, 'success');
}