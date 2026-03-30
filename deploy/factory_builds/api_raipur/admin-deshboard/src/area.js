const AreaPage = {
    render: function () {
        const lang = i18n.getLang();
        return `
            <div class="page-header">
                <div class="header-content">
                    <h1>${i18n.t("area_progress")}</h1>
                    <p class="subtitle">${i18n.t("booth_subtitle")}</p>
                </div>
            </div>

            <div class="search-container">
                <input type="text" id="area-search" placeholder="${lang === 'mr' ? 'क्षेत्र शोधा...' : 'Search area...'}" onkeyup="AreaPage.filterAreas()">
            </div>

            <div class="area-grid" id="area-list-container">
                <div class="loading-spinner">Loading Areas...</div>
            </div>
        `;
    },

    init: async function () {
        const lang = i18n.getLang();
        if (navigator.onLine) {
            this.fetchFromServer(lang);
        } else {
            this.fetchFromLocal(lang);
        }
    },

    fetchFromServer: async function (lang) {
        try {
            const response = await fetch("https://purna-server.onrender.com/api/admin/stats");
            const res = await response.json();
            if (res.success) {
                this.renderAreas(res.stats.areaStats, lang);
            }
        } catch (err) {
            this.fetchFromLocal(lang);
        }
    },

    fetchFromLocal: async function (lang) {
        const allVoters = await LocalDB.getAll("voters");
        if (!allVoters) return;

        const areaMap = {};
        allVoters.forEach(v => {
            const area = v.yadi_bhag || "Unknown";
            if (!areaMap[area]) areaMap[area] = { total: 0, surveyed: 0 };
            areaMap[area].total++;
            if (v.userId || v.lastModified) areaMap[area].surveyed++;
        });

        const areaStats = Object.keys(areaMap).map(name => ({
            areaName: name,
            total: areaMap[name].total,
            surveyed: areaMap[name].surveyed,
            percentage: (areaMap[name].surveyed / areaMap[name].total) * 100
        })).sort((a, b) => b.percentage - a.percentage);

        this.renderAreas(areaStats, lang);
    },

    renderAreas: function (areas, lang) {
        const container = document.getElementById("area-list-container");
        container.innerHTML = areas.map(area => `
            <div class="area-card" data-name="${area.areaName.toLowerCase()}">
                <div class="area-card-header">
                    <h3>${area.areaName}</h3>
                    <span class="badge ${area.percentage === 100 ? 'complete' : ''}">
                        ${area.percentage.toFixed(1)}%
                    </span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${area.percentage}%"></div>
                </div>
                <div class="area-card-footer">
                    <span><strong>${area.surveyed}</strong> / ${area.total}</span>
                    <span>${lang === 'mr' ? 'मतदार' : 'Voters'}</span>
                </div>
            </div>
        `).join("");
    },

    filterAreas: function () {
        const query = document.getElementById("area-search").value.toLowerCase();
        const cards = document.querySelectorAll(".area-card");
        cards.forEach(card => {
            const name = card.getAttribute("data-name");
            card.style.display = name.includes(query) ? "block" : "none";
        });
    }
};