import { dom, showStatus } from './core.js';

export let isEditingPreview = false;

/**
 * 集中式预览更新 — 所有模块统一调用此函数刷新右侧预览
 * @param {Array|Object} data  JSON 数据
 * @param {string} [label]     可选标签，如 “（共 N 条）”
 */
export function setPreview(data, label) {
    if (dom.previewEditor.style.display !== 'none') return; // 编辑模式下不覆盖
    var arr = Array.isArray(data) ? data : [data];
    dom.previewDisplay.textContent = JSON.stringify(arr, null, 2);
    dom.previewCount.textContent = label || ('（共 ' + arr.length + ' 条）');
}

/** 清空预览显示 */
export function clearPreview() {
    if (isEditingPreview) exitPreviewEdit();
    dom.previewDisplay.textContent = '// 等待生成配置...';
    dom.previewCount.textContent = '';
    showStatus('预览已清空', 'info');
}

export function enablePreviewEdit() {
    if (isEditingPreview) return;
    isEditingPreview = true;
    const currentText = dom.previewDisplay.textContent;
    dom.previewEditor.value = currentText;
    dom.previewDisplay.style.display = 'none';
    dom.previewEditor.style.display = 'block';
    dom.previewContainer.style.outline = '2px solid var(--accent-color)';
    dom.editPreviewBtn.style.display = 'none';
    dom.applyPreviewBtn.style.display = 'inline-block';
    dom.previewEditor.focus();
    showStatus('预览可编辑，修改后点击”应用修改”', 'info');
}

export function applyPreviewEdit() {
    const content = dom.previewEditor.value;
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            if (parsed.length === 0) {
                showStatus('编辑后的JSON数组为空', 'error');
                return;
            }
            exitPreviewEdit();
            dom.previewDisplay.textContent = JSON.stringify(parsed, null, 2);
            dom.previewCount.textContent = '（共 ' + parsed.length + ' 条）';
            showStatus('应用修改成功，共 ' + parsed.length + ' 条数据', 'success');
        } else if (typeof parsed === 'object' && parsed !== null) {
            const dataArray = [parsed];
            exitPreviewEdit();
            dom.previewDisplay.textContent = JSON.stringify(dataArray, null, 2);
            dom.previewCount.textContent = '（共 1 条）';
            showStatus('应用修改成功，已转为单条数据', 'success');
        } else {
            showStatus('编辑内容必须是JSON对象或数组', 'error');
        }
    } catch (err) {
        showStatus('JSON解析错误: ' + err.message, 'error');
    }
}

export function exitPreviewEdit() {
    if (!isEditingPreview) return;
    isEditingPreview = false;
    dom.previewDisplay.style.display = 'block';
    dom.previewEditor.style.display = 'none';
    dom.previewContainer.style.outline = 'none';
    dom.editPreviewBtn.style.display = 'inline-block';
    dom.applyPreviewBtn.style.display = 'none';
}

export function getCurrentContent() {
    if (isEditingPreview) {
        return dom.previewEditor.value;
    }
    return dom.previewDisplay.textContent;
}

export function showFileNameModal(defaultName = 'config.json') {
    return new Promise((resolve) => {
        const base = defaultName.replace(/\.json$/, '');
        var modal = document.getElementById('fileNameModal');
        var input = document.getElementById('modalFileNameInput');
        var confirmBtn = document.getElementById('modalConfirmBtn');
        var cancelBtn = document.getElementById('modalCancelBtn');
        input.value = base;
        modal.style.display = 'flex';
        input.focus();
        const onConfirm = () => {
            let fn = input.value.trim() || 'config';
            if (!fn.endsWith('.json')) fn += '.json';
            modal.style.display = 'none';
            cleanup();
            resolve(fn);
        };
        const onCancel = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(null);
        };
        const onKeydown = (e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        };
        const cleanup = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKeydown);
        };
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKeydown);
    });
}

export function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyToClipboard(content) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
    } else {
        const ta = document.createElement('textarea');
        ta.value = content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
}