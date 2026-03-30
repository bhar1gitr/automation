const DashboardPage = {
    render: function () {
        const lang = i18n.getLang();
        return `
            <div class="page-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <h1>${i18n.t("dashboard")}</h1>
                    <span id="online-status" class="status-badge"></span>
                </div>
                <p class="subtitle">${i18n.t("booth_subtitle")}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${i18n.t("total_pop")}</h3>
                    <p id="total-voters">0</p>
                </div>
                <div class="stat-card">
                    <h3>${i18n.t("surveyed")}</h3>
                    <p id="total-surveyed" style="color: #2E7D32;">0</p>
                </div>
                <div class="stat-card">
                    <h3>${i18n.t("completion")}</h3>
                    <p id="completion-percent">0%</p>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="performance-section">
                    <h2>${i18n.t("leaderboard")}</h2>
                    <p id="leaderboard-desc" style="font-size: 12px; color: #888; margin-bottom: 10px;">
                        ${lang === "mr" ? "विशिष्ट फेरबदल पाहण्यासाठी कार्यकर्त्यावर क्लिक करा" : "Click on a worker to see their specific voter edits"}
                    </p>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>${lang === "mr" ? "नाव" : "Name"}</th>
                                    <th>${lang === "mr" ? "एकूण हाताळलेले रेकॉर्ड" : "Total Records Handled"}</th>
                                </tr>
                            </thead>
                            <tbody id="user-stats-body"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="progress-section">
                    <h2>${i18n.t("daily_activity")}</h2>
                    <div id="daily-progress-list" class="scrollable-list"></div>
                </div>
            </div>

            <div id="worker-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-worker-name"></h2>
                        <button onclick="DashboardPage.closeModal()" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="table-container">
                            <table class="detail-table">
                                <thead>
                                    <tr>
                                        <th>${lang === "mr" ? "मतदाराचे नाव" : "Voter Name"}</th>
                                        <th>EPIC ID</th>
                                        <th style="text-align:center;">${i18n.t("voted_status")}</th>
                                        <th>${lang === "mr" ? "तारीख" : "Date"}</th>
                                    </tr>
                                </thead>
                                <tbody id="worker-detail-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: async function () {
        const lang = i18n.getLang();
        const statusEl = document.getElementById("online-status");

        if (navigator.onLine) {
            statusEl.innerText = "● Online";
            statusEl.style.color = "#4CAF50";
            this.fetchFromServer(lang);
        } else {
            statusEl.innerText = "● Offline Mode";
            statusEl.style.color = "#FF5252";
            this.fetchFromLocal(lang);
        }
    },

    fetchFromServer: async function (lang) {
        try {
            const response = await fetch("https://purna-server.onrender.com/api/admin/stats");
            const res = await response.json();
            if (res.success && res.stats) {
                const { totalPopulation, totalSurveyed, overallCompletion, userStats, dailyProgress } = res.stats;
                // Using the backend calculated completion for accuracy
                this.updateUI(totalPopulation, totalSurveyed, userStats, dailyProgress, lang);
            }
        } catch (err) {
            console.error("Server Fetch Failed, switching to local...");
            this.fetchFromLocal(lang);
        }
    },

    fetchFromLocal: async function (lang) {
        // Fallback to IndexedDB (LocalDB)
        const allVoters = await LocalDB.getAll("voters");
        const allUsers = await LocalDB.getAll("users");

        if (!allVoters || allVoters.length === 0) {
            document.getElementById("user-stats-body").innerHTML = `<tr><td colspan="2" style="text-align:center;">No offline data. Please Sync first.</td></tr>`;
            return;
        }

        const totalVoters = allVoters.length;

        // CRITICAL: Filter based on your specific logic (userId or lastModified)
        const surveyedVoters = allVoters.filter(v => v.userId || v.lastModified);
        const totalSurveyed = surveyedVoters.length;

        // Calculate Leaderboard (Offline)
        const userMap = {};
        surveyedVoters.forEach(v => {
            if (v.userId) {
                userMap[v.userId] = (userMap[v.userId] || 0) + 1;
            }
        });

        const userStats = allUsers.map(u => ({
            _id: u._id,
            name: u.name,
            surveyCount: userMap[u._id] || 0
        })).sort((a, b) => b.surveyCount - a.surveyCount);

        // Calculate Daily Progress (Offline)
        const dailyMap = {};
        surveyedVoters.forEach(v => {
            const dateRef = v.lastModified || v.updatedAt;
            if (dateRef) {
                const date = new Date(dateRef).toISOString().split('T')[0];
                dailyMap[date] = (dailyMap[date] || 0) + 1;
            }
        });
        const dailyProgress = Object.keys(dailyMap).map(date => ({ 
            _id: date, 
            count: dailyMap[date] 
        })).sort((a,b) => new Date(b._id) - new Date(a._id));

        this.updateUI(totalVoters, totalSurveyed, userStats, dailyProgress, lang);
    },

    updateUI: function (total, surveyed, userStats, dailyProgress, lang) {
        document.getElementById("total-voters").innerText = total.toLocaleString(lang);
        document.getElementById("total-surveyed").innerText = surveyed.toLocaleString(lang);

        const percent = total > 0 ? ((surveyed / total) * 100).toFixed(2) : "0.00";
        document.getElementById("completion-percent").innerText = `${percent}%`;

        // Render Leaderboard
        document.getElementById("user-stats-body").innerHTML = userStats.map(u => `
            <tr onclick="DashboardPage.showWorkerDetails('${u._id}', '${u.name}')" class="clickable-row">
                <td><strong>${u.name}</strong></td>
                <td class="count-cell">${u.surveyCount.toLocaleString(lang)} <small>${lang === 'mr' ? 'नोंदी' : 'Records'}</small></td>
            </tr>
        `).join("");

        // Render Daily Progress Bars
        // Find the max count to make progress bars relative to the best day
        const maxDay = dailyProgress.length > 0 ? Math.max(...dailyProgress.map(d => d.count)) : 10;
        
        document.getElementById("daily-progress-list").innerHTML = dailyProgress.map(d => `
            <div class="progress-row">
                <span class="date-label">${new Date(d._id).toLocaleDateString(lang, { day: "numeric", month: "short" })}</span>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${(d.count / maxDay) * 100}%"></div>
                </div>
                <strong class="day-count">${d.count}</strong>
            </div>
        `).join("");
    },

    showWorkerDetails: async function(userId, name) {
        const lang = i18n.getLang();
        const modal = document.getElementById("worker-modal");
        const body = document.getElementById("worker-detail-body");
        document.getElementById("modal-worker-name").innerText = name;
        modal.style.display = "block";
        body.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>`;

        let voters = [];
        try {
            if (navigator.onLine) {
                const response = await fetch(`https://purna-server.onrender.com/api/admin/worker-details/${userId}`);
                const res = await response.json();
                voters = res.voterList || [];
            } else {
                const allVoters = await LocalDB.getAll("voters");
                voters = allVoters.filter(v => v.userId === userId && (v.userId || v.lastModified));
            }

            if (voters.length === 0) {
                body.innerHTML = `<tr><td colspan="4" style="text-align:center;">No records found for this worker.</td></tr>`;
                return;
            }

            body.innerHTML = voters.map(v => `
                <tr>
                    <td>${v.name}</td>
                    <td><code>${v.epic_id}</code></td>
                    <td style="text-align:center;">${v.isVoted ? '✅' : '❌'}</td>
                    <td>${new Date(v.lastModified || v.updatedAt).toLocaleDateString(lang)}</td>
                </tr>
            `).join("");
        } catch (err) {
            body.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error loading details.</td></tr>`;
        }
    },

    closeModal: function () {
        document.getElementById("worker-modal").style.display = "none";
    }
};