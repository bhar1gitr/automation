const VotersPage = {
    currentPage: 1,
    currentFilters: {
        search: "",
        color: "",
        isVoted: ""
    },

    render: function() {
        const lang = i18n.getLang();
        return `
            <div class="voters-container">
                <div class="page-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <h1>${i18n.t("voter_mgmt")}</h1>
                        <span id="voter-online-status" class="status-badge"></span>
                    </div>
                    <p class="subtitle">${lang === "mr" ? "निवडणूक डेटाबेस शोधा आणि व्यवस्थापित करा" : "Search and manage election database"}</p>
                </div>

                <div class="filter-section">
                    <div class="search-box">
                        <i class="icon-search">🔍</i>
                        <input type="text" placeholder="${i18n.t("search_voter")}" id="voter-search">
                    </div>
                    
                    <div class="filter-group">
                        <select id="filter-color">
                            <option value="">${i18n.t("all_cats")}</option>
                            <option value="#FF5252">🔴 ${i18n.t("red_critical")}</option>
                            <option value="#4CAF50">🟢 ${i18n.t("green_support")}</option>
                            <option value="#FFC107">🟡 ${lang === "mr" ? "पिवळा (साशंक)" : "Yellow"}</option>
                        </select>

                        <select id="filter-voted">
                            <option value="">${i18n.t("voted_status")}</option>
                            <option value="true">${i18n.t("voted")}</option>
                            <option value="false">${i18n.t("pending")}</option>
                        </select>

                        <button id="btn-export" class="secondary-btn">📤 ${i18n.t("export_excel")}</button>
                    </div>
                </div>

                <div class="table-card">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>${lang === "mr" ? "अनुक्रमांक" : "Sr No."}</th>
                                    <th>${lang === "mr" ? "मतदाराचे नाव" : "Voter Name"}</th>
                                    <th>${lang === "mr" ? "वय/लिंग" : "Age/Sex"}</th>
                                    <th>EPIC ID</th>
                                    <th style="text-align:center">${lang === "mr" ? "स्थिती" : "Status"}</th>
                                    <th>${lang === "mr" ? "कृती" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody id="voter-table-body"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="pagination-footer">
                    <button id="prev-page" class="pag-btn">${lang === "mr" ? "मागील" : "Prev"}</button>
                    <span id="page-info"></span>
                    <button id="next-page" class="pag-btn">${lang === "mr" ? "पुढील" : "Next"}</button>
                </div>
            </div>
        `;
    },

    init: async function() {
        const searchInput = document.getElementById("voter-search");
        const colorFilter = document.getElementById("filter-color");
        const votedFilter = document.getElementById("filter-voted");
        const prevBtn = document.getElementById("prev-page");
        const nextBtn = document.getElementById("next-page");

        // Debounce search
        let timeout = null;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.loadVoters();
            }, 500);
        });

        colorFilter.addEventListener("change", (e) => {
            this.currentFilters.color = e.target.value;
            this.currentPage = 1;
            this.loadVoters();
        });

        votedFilter.addEventListener("change", (e) => {
            this.currentFilters.isVoted = e.target.value;
            this.currentPage = 1;
            this.loadVoters();
        });

        prevBtn.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadVoters();
            }
        });

        nextBtn.addEventListener("click", () => {
            this.currentPage++;
            this.loadVoters();
        });

        this.loadVoters();
    },

    loadVoters: async function() {
        const statusEl = document.getElementById("voter-online-status");
        const lang = i18n.getLang();

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

    fetchFromServer: async function(lang) {
        const tableBody = document.getElementById("voter-table-body");
        const pageInfo = document.getElementById("page-info");
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 50,
                search: this.currentFilters.search,
                color: this.currentFilters.color,
                isVoted: this.currentFilters.isVoted
            });

            const response = await fetch(`https://purna-server.onrender.com/api/admin/voters?${params}`);
            const data = await response.json();
            this.renderTable(data.voters, data.totalFound, data.totalPages, lang);
        } catch (err) {
            this.fetchFromLocal(lang);
        }
    },

    fetchFromLocal: async function(lang) {
        // 1. Get all 50k from IndexedDB
        let voters = await LocalDB.getAll("voters");

        // 2. Apply Filters in JavaScript
        if (this.currentFilters.search) {
            const s = this.currentFilters.search;
            voters = voters.filter(v => 
                v.name.toLowerCase().includes(s) || 
                (v.voter_name_eng && v.voter_name_eng.toLowerCase().includes(s)) ||
                v.epic_id.toLowerCase().includes(s)
            );
        }
        if (this.currentFilters.color) {
            voters = voters.filter(v => v.colorCode === this.currentFilters.color);
        }
        if (this.currentFilters.isVoted !== "") {
            const val = this.currentFilters.isVoted === "true";
            voters = voters.filter(v => v.isVoted === val);
        }

        // 3. Manual Pagination
        const limit = 50;
        const totalFound = voters.length;
        const totalPages = Math.ceil(totalFound / limit);
        const start = (this.currentPage - 1) * limit;
        const paginatedVoters = voters.slice(start, start + limit);

        this.renderTable(paginatedVoters, totalFound, totalPages, lang);
    },

    renderTable: function(voters, totalFound, totalPages, lang) {
        const tableBody = document.getElementById("voter-table-body");
        const pageInfo = document.getElementById("page-info");
        
        if (!voters || voters.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">${lang === "mr" ? "एकही मतदार सापडला नाही." : "No voters found."}</td></tr>`;
            return;
        }

        const ofText = lang === "mr" ? "पैकी" : "of";
        pageInfo.innerText = `${lang === "mr" ? "पृष्ठ" : "Page"} ${this.currentPage} ${ofText} ${totalPages}`;

        tableBody.innerHTML = voters.map(v => `
            <tr>
                <td>${(v.srNo || "-").toLocaleString(lang)}</td>
                <td>
                    <div class="name-cell">
                        <strong>${v.name}</strong>
                        <small style="color:#666">${v.voter_name_eng || ""}</small>
                    </div>
                </td>
                <td>${v.age} / ${v.gender === "M" || v.gender === "Male" ? (lang === "mr" ? "पु" : "M") : (lang === "mr" ? "स्त्री" : "F")}</td>
                <td><span class="epic-badge">${v.epic_id}</span></td>
                <td>
                    <div class="status-col">
                        <div class="dot" style="background:${v.colorCode || '#ddd'}"></div>
                        <span>${v.isVoted ? i18n.t("voted") : i18n.t("pending")}</span>
                    </div>
                </td>
                <td>
                    <button class="action-btn" onclick="VotersPage.viewDetails('${v._id}')">👁️</button>
                </td>
            </tr>
        `).join("");
    },

    viewDetails: function(id) {
        console.log("Viewing:", id);
    }
};