import { dom, darkenColor, showStatus } from './core.js';

export function initTheme() {
    const themeSelect = document.getElementById('themeSelect');
    const customColorPicker = document.getElementById('customColorPicker');
    const customColorLabel = document.getElementById('customColorLabel');

    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedCustomColor = localStorage.getItem('customColor') || '#2b7be4';

    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelect) themeSelect.value = savedTheme;

    if (savedTheme === 'custom') {
        customColorPicker.style.display = 'inline-block';
        customColorLabel.style.display = 'inline-block';
        customColorPicker.value = savedCustomColor;
        applyCustomColor(savedCustomColor);
    }

    themeSelect?.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'custom') {
            customColorPicker.style.display = 'inline-block';
            customColorLabel.style.display = 'inline-block';
            const color = localStorage.getItem('customColor') || '#2b7be4';
            customColorPicker.value = color;
            applyCustomColor(color);
        } else {
            customColorPicker.style.display = 'none';
            customColorLabel.style.display = 'none';
            ['accent-color','focus-shadow','btn-primary-bg','btn-primary-shadow','btn-primary-hover'].forEach(p =>
                document.documentElement.style.setProperty('--' + p, '')
            );
        }
    });

    customColorPicker?.addEventListener('input', (e) => {
        const color = e.target.value;
        localStorage.setItem('customColor', color);
        applyCustomColor(color);
    });

    function applyCustomColor(color) {
        const darker = darkenColor(color, 25);
        document.documentElement.style.setProperty('--accent-color', color);
        document.documentElement.style.setProperty('--focus-shadow', color + '33');
        document.documentElement.style.setProperty('--btn-primary-bg', color);
        document.documentElement.style.setProperty('--btn-primary-shadow', color + '40');
        document.documentElement.style.setProperty('--btn-primary-hover', darker);
    }
}