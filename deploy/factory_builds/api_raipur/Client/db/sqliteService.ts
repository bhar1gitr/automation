import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

const getDB = async () => {
  if (!db) {
    // 🚀 CHANGED TO V4 to force SQLite to create the new column 'needsSync'
    db = await SQLite.openDatabaseAsync('purna_voters_v4.db');
    await db.execAsync('PRAGMA busy_timeout = 5000;');
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return db;
};

export const setupDatabase = async () => {
  const database = await getDB();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS voters (
      id TEXT PRIMARY KEY NOT NULL,
      mahanagarpalika TEXT,
      parbhag TEXT,
      yadi_bhag TEXT,
      srNo INTEGER,
      epic_id TEXT UNIQUE,
      part TEXT,
      name TEXT,
      voter_name TEXT,
      age INTEGER,
      gender TEXT,
      fatherName TEXT,
      relative_type TEXT,
      mobile TEXT,
      mobile2 TEXT,
      colorCode TEXT,
      caste TEXT,
      designation TEXT,
      society TEXT,
      flatNo TEXT,
      dob TEXT,
      demands TEXT,
      isDead INTEGER DEFAULT 0,
      isStar INTEGER DEFAULT 0,
      isVoted INTEGER DEFAULT 0,
      lastModified INTEGER,
      needsSync INTEGER DEFAULT 0
    );
  `);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_v_name ON voters (name);`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_v_epic ON voters (epic_id);`);
};

export const saveVotersLocally = async (voterArray: any[]) => {
  const database = await getDB();
  try {
    await database.withTransactionAsync(async () => {
      for (const v of voterArray) {
        await database.runAsync(
          `INSERT OR REPLACE INTO voters (
            id, mahanagarpalika, parbhag, yadi_bhag, srNo, epic_id, part, name, 
            voter_name, age, gender, fatherName, relative_type, mobile, mobile2, 
            colorCode, caste, designation, society, flatNo, dob, demands, 
            isDead, isStar, isVoted, lastModified, needsSync
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            v._id?.toString() || v.id,
            v.mahanagarpalika || '',
            v.parbhag || '',
            v.yadi_bhag || '',
            v.srNo || 0,
            v.epic_id || '',
            v.part || '',
            v.name || '',
            v.voter_name || '',
            v.age || 0,
            v.gender || '',
            v.fatherName || '',
            v.relative_type || '',
            v.mobile || '',
            v.mobile2 || '',
            v.colorCode || '#ddd',
            v.caste || '',
            v.designation || '',
            v.society || '',
            v.flatNo || '',
            v.dob || '',
            v.demands || '',
            v.isDead ? 1 : 0,
            v.isStar ? 1 : 0,
            v.isVoted ? 1 : 0,
            v.lastModified || Date.now(),
            0 // needsSync is 0 for data coming FROM server
          ]
        );
      }
    });
  } catch (error) { console.error("Batch Save Error:", error); }
};

export const updateVoterOffline = async (id: string, updates: any) => {
  const database = await getDB();
  const keys = Object.keys(updates);
  const values = Object.values(updates).map(v => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
  const setClause = keys.map(key => `${key} = ?`).join(', ');

  try {
    await database.runAsync(
      `UPDATE voters SET ${setClause}, lastModified = ?, needsSync = 1 WHERE id = ?`,
      [...values, Date.now(), id]
    );
    return true;
  } catch (e) { return false; }
};

export const getModifiedVoters = async () => {
  const database = await getDB();
  return await database.getAllAsync('SELECT * FROM voters WHERE needsSync = 1');
};

export const markAsSynced = async (ids: string[]) => {
  const database = await getDB();
  const placeholders = ids.map(() => '?').join(',');
  await database.runAsync(`UPDATE voters SET needsSync = 0 WHERE id IN (${placeholders})`, ids);
};

export const searchVotersOffline = async (searchTerm: string, filters: any) => {
  const database = await getDB();
  const { surname, area, house } = filters;
  let query = 'SELECT * FROM voters WHERE 1=1';
  let params: any[] = [];
  if (searchTerm) {
    query += ' AND (name LIKE ? OR epic_id LIKE ?)';
    params.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }
  if (surname) {
    query += ' AND name LIKE ?';
    params.push(`%${surname}%`);
  }
  if (area) {
    query += ' AND (part LIKE ? OR yadi_bhag LIKE ?)';
    params.push(`%${area}%`, `%${area}%`);
  }
  if (house) {
    query += ' AND flatNo LIKE ?';
    params.push(`%${house}%`);
  }
  query += ' ORDER BY srNo ASC LIMIT 100';
  return await database.getAllAsync(query, params);
};

export const getVoterByIdOffline = async (id: string) => {
  const database = await getDB();
  return await database.getFirstAsync('SELECT * FROM voters WHERE id = ?', [id]);
};

export const getOfflineVoterCount = async () => {
  const database = await getDB();
  const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM voters');
  return result?.count ?? 0;
};

export const getTop5Voters = async () => {
  const database = await getDB();
  return await database.getAllAsync('SELECT * FROM voters LIMIT 5');
};

export const deleteDatabase = async () => {
  const database = await getDB();
  await database.execAsync('DELETE FROM voters;');
};

export const getColorReportOffline = async () => {
  const database = await getDB();

  const colors = {
    supporter: '#00C8C8',
    my_voter: '#1EB139',
    neutral: '#FFD740',
    opponent: '#FF5252'
  };

  try {
    // 1. Get counts for specific colors
    const results = await database.getAllAsync<{ colorCode: string, count: number }>(`
      SELECT colorCode, COUNT(*) as count 
      FROM voters 
      WHERE colorCode IN (?, ?, ?, ?)
      GROUP BY colorCode
    `, [colors.supporter, colors.my_voter, colors.neutral, colors.opponent]);

    // 2. Get total count to calculate "Blank" correctly
    const totalResult = await database.getFirstAsync<{ total: number }>('SELECT COUNT(*) as total FROM voters');
    const totalVoters = totalResult?.total || 0;

    let stats = {
      supporter: 0,
      my_voter: 0,
      neutral: 0,
      opponent: 0,
      blank: 0
    };

    let classifiedCount = 0;

    results.forEach(row => {
      if (row.colorCode === colors.supporter) stats.supporter = row.count;
      if (row.colorCode === colors.my_voter) stats.my_voter = row.count;
      if (row.colorCode === colors.neutral) stats.neutral = row.count;
      if (row.colorCode === colors.opponent) stats.opponent = row.count;
      classifiedCount += row.count;
    });

    // 3. Blank = Total - (Sum of classified colors)
    stats.blank = totalVoters - classifiedCount;

    return stats;
  } catch (error) {
    console.error("Local Report Error:", error);
    return { supporter: 0, my_voter: 0, neutral: 0, opponent: 0, blank: 0 };
  }
};

export const getPhonebookOffline = async () => {
  const database = await getDB();
  try {
    // Usually, PhoneBook = Voters with mobile numbers saved
    return await database.getAllAsync(
      'SELECT * FROM voters WHERE mobile IS NOT NULL AND mobile != "" ORDER BY name ASC'
    );
  } catch (error) {
    console.error("Local PhoneBook Error:", error);
    return [];
  }
};

export const getMyVotersOffline = async (tab: string, booth: string, search: string, page: number) => {
  const database = await getDB();
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM voters WHERE 1=1';
  let params: any[] = [];

  // 1. Strict "My Voters" logic (matches your Node.js code)
  if (tab === 'my') {
    query += " AND colorCode = '#1EB139'";
  }

  // 2. Booth Filter (matches your Node.js $regex: /booth/)
  if (booth && booth !== 'All') {
    query += " AND part LIKE ?";
    params.push(`%/${booth}/%`);
  }

  // 3. Search Logic
  if (search) {
    query += " AND (name LIKE ? OR epic_id LIKE ? OR voter_name_eng LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ` ORDER BY srNo ASC LIMIT ${limit} OFFSET ${offset}`;

  try {
    return await database.getAllAsync(query, params);
  } catch (error) {
    console.error("SQLite MyVoters Error:", error);
    return [];
  }
};

export const getGenderReportOffline = async (booth: string) => {
  const database = await getDB();

  let query = `   
    SELECT 
      CASE 
        WHEN gender IS NULL OR gender = '' THEN 'Unknown' 
        ELSE gender 
      END as _id, 
      COUNT(*) as count 
    FROM voters 
    WHERE 1=1
  `;
  let params: any[] = [];

  if (booth && booth !== 'All') {
    // This matches if the booth number appears anywhere in the 'part' string
    query += " AND part LIKE ?";
    params.push(`%${booth}%`);
  }

  query += " GROUP BY _id ORDER BY count DESC";

  try {
    const results = await database.getAllAsync(query, params);
    return results;
  } catch (error) {
    console.error("Local Gender Report Error:", error);
    return [];
  }
};

export const getMobileReportOffline = async (booth: string) => {
  const database = await getDB();

  // matchStage: mobile exists and is not empty/null
  let query = `
    SELECT 
      mobile, 
      part as booth, 
      name as voterName, 
      COUNT(*) as count,
      (mobile || '-' || part) as id
    FROM voters 
    WHERE mobile IS NOT NULL 
      AND mobile != '' 
      AND mobile != 'null' 
      AND mobile != 'undefined'
  `;

  let params: any[] = [];

  if (booth && booth !== 'All') {
    query += " AND part LIKE ?";
    params.push(`%${booth}%`);
  }

  // Group by mobile and booth to match MongoDB logic
  query += " GROUP BY mobile, part ORDER BY count DESC";

  try {
    const results = await database.getAllAsync(query, params);
    return results;
  } catch (error) {
    console.error("Local Mobile Report Error:", error);
    return [];
  }
};

export const getAgeRangeReportOffline = async (min: string, max: string, booth: string) => {
  const database = await getDB();
  
  let query = `
    SELECT 
      id as _id, 
      name, 
      voter_name as voter_name_eng, 
      age, 
      epic_id, 
      srNo, 
      gender, 
      yadi_bhag, 
      part 
    FROM voters 
    WHERE age >= ? AND age <= ?
  `;
  
  let params: any[] = [parseInt(min), parseInt(max)];

  if (booth && booth !== 'All') {
    query += " AND part LIKE ?";
    params.push(`%${booth}%`);
  }

  query += " ORDER BY age ASC, name ASC";

  try {
    const results = await database.getAllAsync(query, params);
    return {
      success: true,
      totalCount: results.length,
      data: results
    };
  } catch (error) {
    console.error("Local Age Range Error:", error);
    return { success: false, totalCount: 0, data: [] };
  }
};

export const getCommunityReportOffline = async () => {
  const database = await getDB();

  // Mapping logic (Sync this with your Backend surnameMap)
  const surnameMap: { [key: string]: string } = {
    "भोसले": "Marathi", "Bhosale": "Marathi",
    "पाटील": "Marathi", "Patil": "Marathi",
    "पवार": "Marathi", "Pawar": "Marathi",
    "शिंदे": "Marathi", "Shinde": "Marathi",
    "गायकवाड": "Marathi", "Gaikwad": "Marathi",
    "Singh": "North Indian", "सिंह": "North Indian",
    "Sharma": "North Indian", "शर्मा": "North Indian",
    "Yadav": "North Indian", "यादव": "North Indian",
    "Khan": "Muslims", "खान": "Muslims",
    "Shaikh": "Muslims", "शेख": "Muslims",
    "Ansari": "Muslims", "अन्सारी": "Muslims",
    "Patel": "Gujarati", "पटेल": "Gujarati",
    "Shah": "Gujarati", "शाह": "Gujarati"
  };

  const communityCounts: { [key: string]: number } = {
    "Marathi": 0, "North Indian": 0, "Muslims": 0,
    "Gujarati": 0, "South India": 0, "Punjabi": 0,
    "Christian": 0, "Sindhi": 0, "Others": 0
  };

  try {
    /** * 1. Extract the first word (surname) from the name column 
     * SQLite logic: instr(name, ' ') finds the first space. 
     * substr(name, 1, instr(name, ' ') - 1) gets the first word.
     */
    const query = `
      SELECT 
        CASE 
          WHEN instr(trim(name), ' ') > 0 
          THEN substr(trim(name), 1, instr(trim(name), ' ') - 1)
          ELSE trim(name) 
        END as surname,
        COUNT(*) as count
      FROM voters
      GROUP BY surname
    `;

    const surnameData = await database.getAllAsync<{ surname: string, count: number }>(query);

    // 2. Classify data
    surnameData.forEach(item => {
      const community = surnameMap[item.surname] || "Others";
      if (communityCounts.hasOwnProperty(community)) {
        communityCounts[community] += item.count;
      } else {
        communityCounts["Others"] += item.count;
      }
    });

    // 3. Format for UI
    return Object.keys(communityCounts)
      .map(key => ({
        id: key.toLowerCase().replace(/\s/g, '_'),
        name: key,
        count: communityCounts[key]
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

  } catch (error) {
    console.error("Local Community Report Error:", error);
    return [];
  }
};

/**
 * GET SURNAME SUMMARY OFFLINE
 */
export const getSurnameReportOffline = async (booth: string) => {
  const database = await getDB();
  
  // Logic: Get the first word before the first space as the surname
  let query = `
    SELECT 
      CASE 
        WHEN instr(trim(name), ' ') > 0 
        THEN substr(trim(name), 1, instr(trim(name), ' ') - 1)
        ELSE trim(name) 
      END as _id,
      COUNT(*) as count
    FROM voters
    WHERE 1=1
  `;
  
  let params: any[] = [];
  if (booth && booth !== 'All') {
    query += " AND part LIKE ?";
    params.push(`%${booth}%`);
  }

  query += " GROUP BY _id ORDER BY count DESC";

  try {
    return await database.getAllAsync(query, params);
  } catch (error) {
    console.error("Local Surname Report Error:", error);
    return [];
  }
};

/**
 * GET VOTERS BY SURNAME OFFLINE
 */
export const getSurnameDetailsOffline = async (surname: string, booth: string) => {
  const database = await getDB();
  
  let query = `
    SELECT 
      id as _id, name, voter_name as voter_name_eng, 
      age, epic_id, srNo, gender, part 
    FROM voters 
    WHERE (name LIKE ? OR name LIKE ? || ' %')
  `;
  
  let params: any[] = [surname, surname];

  if (booth && booth !== 'All') {
    query += " AND part LIKE ?";
    params.push(`%${booth}%`);
  }

  query += " ORDER BY srNo ASC";

  try {
    return await database.getAllAsync(query, params);
  } catch (error) {
    console.error("Local Surname Details Error:", error);
    return [];
  }
};

/**
 * 1. GET BOOTH SUMMARY (GROUPED BY 3-DIGIT BOOTH NUMBER)
 */
export const getBoothReportOffline = async () => {
    const database = await getDB();
    try {
        // SQLite Regex alternative: Extracting 3 digits using substr/instr 
        // We look for 'क्र. ' and take the next 3 characters
        const query = `
            SELECT 
                substr(yadi_bhag, instr(yadi_bhag, 'क्र. ') + 5, 3) as _id,
                MAX(yadi_bhag) as areaName,
                COUNT(*) as count
            FROM voters
            WHERE yadi_bhag LIKE '%क्र. %'
            GROUP BY _id
            ORDER BY _id ASC
        `;
        return await database.getAllAsync(query);
    } catch (error) {
        console.error("Local Booth Report Error:", error);
        return [];
    }
};

/**
 * 2. GET PARTS WITHIN A SPECIFIC BOOTH
 */
export const getBoothPartsOffline = async (boothNumber: string) => {
    const database = await getDB();
    try {
        // Match strictly based on AC/Booth/Part structure (e.g., %/285/%)
        const query = `
            SELECT 
                yadi_bhag as _id,
                COUNT(*) as count
            FROM voters
            WHERE part LIKE ?
            GROUP BY yadi_bhag
            ORDER BY yadi_bhag ASC
        `;
        const results = await database.getAllAsync(query, [`%/${boothNumber}/%`]);
        return { success: true, data: results };
    } catch (error) {
        console.error("Local Booth Parts Error:", error);
        return { success: false, data: [] };
    }
};

/**
 * 3. GET VOTERS BY FULL YADI STRING
 */
export const getVotersByYadiOffline = async (yadiString: string) => {
    const database = await getDB();
    try {
        const query = `
            SELECT 
                id as _id, srNo, name, voter_name as voter_name_eng, 
                epic_id, age, gender, flatNo as house, mobile, colorCode, isVoted
            FROM voters
            WHERE yadi_bhag = ?
            ORDER BY srNo ASC
        `;
        const results = await database.getAllAsync(query, [yadiString]);
        return { success: true, data: results };
    } catch (error) {
        console.error("Local Voters Yadi Error:", error);
        return { success: false, data: [] };
    }
};

export const getBirthdayReportOffline = async (mode: 'today' | 'month', month: number, booth: string) => {
  const database = await getDB();
  const today = new Date();
  const currentDay = String(today.getDate()).padStart(2, '0');
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const targetMonth = String(month).padStart(2, '0');

  let query = `
    SELECT id as _id, name, epic_id, dob, mobile, part 
    FROM voters 
    WHERE dob IS NOT NULL AND dob != ''
  `;
  
  let params: any[] = [];

  if (mode === 'today') {
    // Matches "DD/MM" at the start of "DD/MM/YYYY"
    query += " AND substr(dob, 1, 5) = ?";
    params.push(`${currentDay}/${currentMonth}`);
  } else {
    // Matches "/MM/" in the middle of "DD/MM/YYYY"
    query += " AND substr(dob, 4, 2) = ?";
    params.push(targetMonth);
  }

  if (booth && booth !== 'All') {
    query += " AND part LIKE ?";
    params.push(`%${booth}%`);
  }

  query += " ORDER BY name ASC";

  try {
    return await database.getAllAsync(query, params);
  } catch (error) {
    console.error("Local Birthday Error:", error);
    return [];
  }
};