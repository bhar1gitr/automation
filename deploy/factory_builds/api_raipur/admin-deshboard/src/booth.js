const BoothPage = {
    render: function () {
        const lang = i18n.getLang();

        return `
            <div class="page-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <h1>${i18n.t("booth_analysis")}</h1>
                    <span id="booth-online-status" class="status-badge"></span>
                </div>
                <p class="subtitle">${i18n.t("booth_subtitle")}</p>
            </div>

            <div id="booth-stats-grid" class="booth-grid">
                <div class="loading-state">
                    📊 ${lang === "mr" ? "माहितीचे विश्लेषण होत आहे..." : "Analyzing booth data..."}
                </div>
            </div>
        `;
    },

    init: async function () {
        const lang = i18n.getLang();
        const statusEl = document.getElementById("booth-online-status");

        if (navigator.onLine) {
            statusEl.innerText = "● Live";
            statusEl.style.color = "#4CAF50";
            this.fetchFromServer(lang);
        } else {
            statusEl.innerText = "● Local DB";
            statusEl.style.color = "#FF9800";
            this.fetchFromLocal(lang);
        }
    },

    fetchFromServer: async function (lang) {
        const grid = document.getElementById("booth-stats-grid");
        try {
            const response = await fetch("https://purna-server.onrender.com/api/admin/booth-stats");
            const res = await response.json();

            if (res.success) {
                this.renderGrid(res.stats, lang);
            }
        } catch (err) {
            console.error("Booth Server Fetch Failed, switching to local...");
            this.fetchFromLocal(lang);
        }
    },

    fetchFromLocal: async function (lang) {
        const grid = document.getElementById("booth-stats-grid");
        
        // 1. Get all 50k voters from IndexedDB
        const allVoters = await LocalDB.getAll("voters");

        if (!allVoters || allVoters.length === 0) {
            grid.innerHTML = `<div class="empty-card" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>${lang === "mr" ? "स्थानिक डेटा सापडला नाही. कृपया आधी सिंक करा." : "No local data found. Please Sync first."}</p>
            </div>`;
            return;
        }

        // 2. Group by Booth (yadi_bhag) manually
        const boothMap = {};
        allVoters.forEach(v => {
            const boothId = v.yadi_bhag || (lang === 'mr' ? "नमुद नाही" : "Unspecified");
            if (!boothMap[boothId]) {
                boothMap[boothId] = { _id: boothId, totalVoters: 0, surveyedCount: 0 };
            }
            boothMap[boothId].totalVoters++;
            // Surveyed logic: if color is not default or isVoted is true
            if (v.colorCode !== "#ddd" || v.isVoted) {
                boothMap[boothId].surveyedCount++;
            }
        });

        // 3. Convert Map to Array and sort by Booth ID
        const stats = Object.values(boothMap).sort((a, b) => a._id - b._id);
        this.renderGrid(stats, lang);
    },

    renderGrid: function (stats, lang) {
        const grid = document.getElementById("booth-stats-grid");

        if (stats.length === 0) {
            grid.innerHTML = `<div class="empty-card" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p>${lang === "mr" ? "माहिती उपलब्ध नाही." : "No data available."}</p>
            </div>`;
            return;
        }

        grid.innerHTML = stats.map((booth) => {
            const total = booth.totalVoters || 0;
            const surveyed = booth.surveyedCount || 0;
            const percent = total > 0 ? ((surveyed / total) * 100).toFixed(1) : 0;
            const progressColor = percent > 70 ? "#4CAF50" : percent > 30 ? "#FFC107" : "#FF5252";

            return `
                <div class="booth-card">
                    <div class="booth-card-header">
                        <span class="yadi-label">${lang === "mr" ? "यादी भाग" : "Yadi Bhag"}</span>
                        <span class="percent-badge" style="background: ${progressColor}20; color: ${progressColor}">
                            ${percent}%
                        </span>
                    </div>
                    
                    <h2 class="booth-title"># ${booth._id}</h2>
                    
                    <div class="booth-stats">
                        <div class="stat-row">
                            <span>${i18n.t("total_pop")}</span>
                            <strong>${total.toLocaleString(lang)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>${i18n.t("surveyed")}</span>
                            <strong>${surveyed.toLocaleString(lang)}</strong>
                        </div>
                    </div>

                    <div class="booth-progress-bg">
                        <div class="booth-progress-fill" style="width: ${percent}%; background: ${progressColor}"></div>
                    </div>

                    <button class="booth-action-btn" onclick="Router.load('voters', '${booth._id}')">
                        ${i18n.t("view_booth")}
                    </button>
                </div>
            `;
        }).join("");
    }
};