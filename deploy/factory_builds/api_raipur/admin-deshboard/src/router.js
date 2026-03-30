const Router = {
    load: function (page, filter = null) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        // UI: Set Active State in Sidebar
        // Note: Your HTML uses <li> for clicks, but your Router looked for parentElement. 
        // Let's simplify this to match your HTML structure.
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        const activeNav = document.getElementById(`nav-${page}`);
        if (activeNav) activeNav.classList.add('active');

        // Logic Switch
        switch (page) {
            case 'dashboard':
                contentArea.innerHTML = DashboardPage.render();
                DashboardPage.init();
                break;
            case 'voters':
                contentArea.innerHTML = VotersPage.render();
                VotersPage.init();
                // ... filter logic ...
                break;
            case 'area': // FIX: Changed 'content' to 'contentArea' 📍
                contentArea.innerHTML = AreaPage.render();
                AreaPage.init();
                break;
            case 'booth':
                contentArea.innerHTML = BoothPage.render();
                BoothPage.init();
                break;
            case 'settings':
                contentArea.innerHTML = SettingsPage.render();
                SettingsPage.init();
                break;
            case 'sync':
                contentArea.innerHTML = SyncPage.render();
                SyncPage.init();
                break;
            default:
                contentArea.innerHTML = `<h1>404</h1><p>Page not found.</p>`;
        }
    }
};