const SyncPage = {
    render: function () {
        const lastSync = localStorage.getItem('lastSyncFriendly') || i18n.t('never');
        return `
            <div class="sync-container">
                <div class="sync-card">
                    <div class="sync-header">
                        <span class="sync-icon">⚡</span>
                        <h2>${i18n.t('sync_title')}</h2>
                    </div>
                    <p>${i18n.t('sync_desc')}</p>
                    <div class="sync-meta">
                        <span>${i18n.t('last_sync')}: <strong>${lastSync}</strong></span>
                    </div>
                    
                    <div id="sync-progress-area" style="display:none;">
                        <div class="progress-bar"><div id="sync-fill"></div></div>
                        <p id="sync-status-text">Connecting...</p>
                    </div>

                    <button id="start-sync-btn" class="main-btn">${i18n.t('start_sync')}</button>
                </div>
            </div>
        `;
    },

    init: function () {
        const btn = document.getElementById('start-sync-btn');
        const statusText = document.getElementById('sync-status-text');

        btn.onclick = async () => {
            btn.disabled = true;
            document.getElementById('sync-progress-area').style.display = 'block';

            try {
                statusText.innerText = "Connecting to https://purna-server.onrender.com...";

                const lastTimestamp = localStorage.getItem('lastSyncTimestamp') || 0;
                const response = await fetch(`https://purna-server.onrender.com/api/admin/sync?lastTimestamp=${lastTimestamp}`);

                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                statusText.innerText = `Received ${data.voters.length} records. Saving...`;

                // Check if LocalDB exists before calling it
                if (typeof LocalDB === "undefined") {
                    throw new Error("LocalDB script is not loaded in index.html");
                }

                await LocalDB.saveRecords("voters", data.voters);
                await LocalDB.saveRecords("users", data.users);

                localStorage.setItem('lastSyncTimestamp', data.serverTime);
                localStorage.setItem('lastSyncFriendly', new Date().toLocaleString());

                statusText.innerText = "Sync Complete!";
                btn.innerText = "Success ✅";

            } catch (err) {
                // This will now tell you EXACTLY what is wrong
                statusText.innerHTML = `<span style="color:red">Error: ${err.message}</span>`;
                console.error("Full Sync Error:", err);
            } finally {
                btn.disabled = false;
            }
        };
    }
};