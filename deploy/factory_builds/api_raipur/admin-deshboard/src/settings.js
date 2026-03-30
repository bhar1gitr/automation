const SettingsPage = {
    render: function() {
        return `
            <div class="page-header"><h1>${i18n.t('settings')}</h1></div>
            <div class="settings-card">
                <div class="setting-row">
                    <div class="info">
                        <strong>${i18n.t('lang_label')}</strong>
                        <p>${i18n.t('lang_desc')}</p>
                    </div>
                    <select id="lang-select" onchange="i18n.setLang(this.value)">
                        <option value="en" ${i18n.getLang()==='en'?'selected':''}>English</option>
                        <option value="mr" ${i18n.getLang()==='mr'?'selected':''}>मराठी</option>
                        <option value="hi" ${i18n.getLang()==='hi'?'selected':''}>हिन्दी</option>
                    </select>
                </div>
            </div>
        `;
    },
    init: function() {}
};