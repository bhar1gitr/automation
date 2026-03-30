const LocalDB = {
    dbName: "VoterOfflineDB",
    
    // Initialize the Database
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                // Create stores for Voters and Users if they don't exist
                if (!db.objectStoreNames.contains("voters")) {
                    db.createObjectStore("voters", { keyPath: "_id" });
                }
                if (!db.objectStoreNames.contains("users")) {
                    db.createObjectStore("users", { keyPath: "_id" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("IndexedDB failed to open");
        });
    },

    // Save records in bulk (Crucial for 50k records)
    saveRecords: async function(storeName, records) {
        if (!records || records.length === 0) return;
        
        const db = await this.init();
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        records.forEach(r => store.put(r));

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(`Failed to save to ${storeName}`);
        });
    },

    // Get all records for offline searching
    getAll: async function(storeName) {
        const db = await this.init();
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result);
        });
    }
};