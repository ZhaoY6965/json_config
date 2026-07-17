// ============================================================
// dialog.js — 程序自带弹窗（替代浏览器内置 alert / confirm / prompt）
// 用法（ES Module）：  import { dialog } from './dialog.js';
//                      await dialog.confirm('确定吗？');
// 用法（经典脚本 / iframe）：window.AppDialog.alert('提示');
// 特点：真模态（点击遮罩不关闭，只有关闭/取消按钮或 Esc 可关），
//       自包含样式，不依赖宿主页面的 CSS 变量，因此在主应用与
//       legend_editor.html 的 iframe 中表现一致。
// ============================================================

const STYLE_ID = 'cb-dialog-style';
const CSS = `
.cb-modal-overlay{
  position:fixed; inset:0; z-index:99990;
  background:rgba(8,16,22,.55);
  backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center;
  font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
}
.cb-modal{
  background:#38596C; color:#eaf2f7;
  border:1px solid #4f7388; border-radius:12px;
  min-width:300px; max-width:90%; width:auto;
  padding:24px 28px; box-sizing:border-box;
  box-shadow:0 20px 60px rgba(0,0,0,.45);
  animation:cb-modal-in .16s ease-out;
}
@keyframes cb-modal-in{from{opacity:0;transform:translateY(8px) scale(.98);}to{opacity:1;transform:none;}}
.cb-modal-title{font-size:16px;font-weight:600;margin:0 0 8px;color:#eaf2f7;line-height:1.4;}
.cb-modal-msg{font-size:14px;line-height:1.55;color:#a9bccb;margin:0 0 16px;white-space:pre-wrap;word-break:break-word;}
.cb-modal-input{
  width:100%; padding:10px 14px; box-sizing:border-box;
  border:1px solid #4f7388; border-radius:8px;
  background:#2f4a5b; color:#eaf2f7; font-size:15px;
  outline:none; font-family:inherit;
}
.cb-modal-input:focus{border-color:#6fb1d6;box-shadow:0 0 0 3px rgba(111,177,214,.25);}
.cb-modal-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:20px;}
.cb-modal-btn{
  padding:8px 22px; border-radius:6px; font-size:14px; cursor:pointer;
  border:1px solid transparent; font-family:inherit; min-width:72px;
  transition:background .15s,box-shadow .15s;
}
.cb-modal-btn:focus{outline:none;box-shadow:0 0 0 3px rgba(111,177,214,.3);}
.cb-modal-cancel{background:transparent;border:1px solid #5b9bd5;color:#eaf2f7;}
.cb-modal-cancel:hover{background:#436b82;}
.cb-modal-ok{background:#5b9bd5;color:#ffffff;}
.cb-modal-ok:hover{background:#6fb1d6;}
.cb-modal-danger{background:#5b9bd5;color:#ffffff;}
.cb-modal-danger:hover{background:#4a8ac4;}
`;

function ensureStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

/**
 * 打开一个通用弹窗。
 * @param {object} opts
 *   type:    'alert' | 'confirm' | 'prompt'
 *   title:   标题文本
 *   message: 正文文本
 *   inputDefault: prompt 的默认值
 *   okText:  确认按钮文字（默认「确定」）
 *   cancelText: 取消按钮文字（默认「取消」）
 *   danger:  confirm 的确认按钮是否用危险红色
 * @returns {Promise} alert→undefined; confirm→true/false; prompt→string|null
 */
function openDialog(opts) {
    ensureStyle();
    const {
        type = 'alert',
        title = '',
        message = '',
        inputDefault = '',
        okText = '确定',
        cancelText = '取消',
        danger = false
    } = opts || {};

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'cb-modal-overlay';

        const box = document.createElement('div');
        box.className = 'cb-modal';

        if (title) {
            const t = document.createElement('div');
            t.className = 'cb-modal-title';
            t.textContent = title;
            box.appendChild(t);
        }
        if (message) {
            const m = document.createElement('div');
            m.className = 'cb-modal-msg';
            m.textContent = message;
            box.appendChild(m);
        }

        let input = null;
        if (type === 'prompt') {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'cb-modal-input';
            input.value = inputDefault;
            box.appendChild(input);
        }

        const actions = document.createElement('div');
        actions.className = 'cb-modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cb-modal-btn cb-modal-cancel';
        cancelBtn.textContent = cancelText;
        cancelBtn.style.display = (type === 'alert') ? 'none' : '';

        const okBtn = document.createElement('button');
        okBtn.className = 'cb-modal-btn ' + (type === 'confirm' && danger ? 'cb-modal-danger' : 'cb-modal-ok');
        okBtn.textContent = okText;

        actions.appendChild(cancelBtn);
        actions.appendChild(okBtn);
        box.appendChild(actions);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // 真模态：点击遮罩不关闭（只有关闭/取消按钮或 Esc 可关）
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) e.preventDefault();
        });

        const close = () => {
            document.removeEventListener('keydown', onKey, true);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };

        const onOk = () => {
            if (type === 'alert') { close(); resolve(undefined); }
            else if (type === 'confirm') { close(); resolve(true); }
            else { close(); resolve(input ? input.value : ''); }
        };
        const onCancel = () => {
            if (type === 'alert') { close(); resolve(undefined); }
            else if (type === 'confirm') { close(); resolve(false); }
            else { close(); resolve(null); }
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);

        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
            else if (e.key === 'Enter') {
                // prompt 时若焦点在输入框，回车即确认
                if (type === 'prompt' && document.activeElement === input) { e.preventDefault(); onOk(); }
                else if (type !== 'prompt') { e.preventDefault(); onOk(); }
            }
        };
        document.addEventListener('keydown', onKey, true);

        // 焦点
        if (type === 'prompt' && input) {
            setTimeout(() => input.focus(), 0);
        } else {
            setTimeout(() => okBtn.focus(), 0);
        }
    });
}

export const dialog = {
    alert(message, title = '提示') {
        return openDialog({ type: 'alert', title, message });
    },
    confirm(message, title = '确认', danger = false) {
        return openDialog({ type: 'confirm', title, message, danger });
    },
    prompt(message, defaultText = '', title = '输入') {
        return openDialog({ type: 'prompt', title, message, inputDefault: defaultText });
    }
};

export const alert = (message, title) => dialog.alert(message, title);
export const confirm = (message, title, danger) => dialog.confirm(message, title, danger);
export const prompt = (message, defaultText, title) => dialog.prompt(message, defaultText, title);

// 供经典脚本 / iframe（如 legend_editor.html）使用
if (typeof window !== 'undefined') {
    window.AppDialog = dialog;
}

export default dialog;
