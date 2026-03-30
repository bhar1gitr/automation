// Function to load separate pages
async function loadPage(pageName) {
    const contentArea = document.getElementById('content-area');
    
    // 1. Fetch the specific JS logic for the page
    // You can use a simple switch or dynamic import
    switch(pageName) {
        case 'dashboard':
            contentArea.innerHTML = `<h1>Dashboard</h1><div class="stats">...</div>`;
            initDashboard(); // Function inside src/dashboard.js
            break;
        case 'voters':
            contentArea.innerHTML = `<h1>Voter Data</h1><table id="voterTable">...</table>`;
            renderVoters(); // Function inside src/voters.js
            break;
    }
}

// Load default page
loadPage('dashboard');