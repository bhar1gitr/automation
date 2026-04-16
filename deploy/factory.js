const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const archiver = require('archiver');
const mongoose = require('mongoose');

// const GITHUB_REPO = 'https://github.com/bhar1gitr/purna.git';
const GITHUB_REPO = 'https://github.com/Netrutv/purna.git';

const BUILD_ROOT = path.join(__dirname, 'factory_builds');

// --- EMBEDDED SCHEMAS (Matches your screenshot exactly) ---
const UserSchema = new mongoose.Schema({
    name: String, 
    email: { type: String, unique: true }, 
    password: String, 
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' }, 
    voterId: String, 
    age: Number, 
    lastModified: { type: Number, default: Date.now }
}, { timestamps: true });

const VoterSchema = new mongoose.Schema({
    epic_id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    yadi_bhag: String, 
    mahanagarpalika: String, 
    parbhag: String,
    srNo: Number, 
    gender: String, 
    age: Number, 
    mobile: String,
    lastModified: { type: Number, default: Date.now }
}, { timestamps: true });

// Syncing with your actual file names from the screenshot
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Voter = mongoose.models.Voter || mongoose.model('Voter', VoterSchema);

async function generateCityBuild({ cityName, mongoUri, packageId, voterData }) {
    const safeName = cityName.toLowerCase().replace(/\s+/g, '_');
    const buildPath = path.join(BUILD_ROOT, `api_${safeName}`);
    const zipName = `deploy_${safeName}.zip`;
    const zipPath = path.join(BUILD_ROOT, zipName);
    const dbName = `${safeName}-db`;
    
    // Your specific Atlas Cluster URL
    // const finalMongoUri = `mongodb+srv://bharatsharma:BharatRaipur2026@users.zhyvuoo.mongodb.net/${dbName}?retryWrites=true&w=majority`;

    const finalMongoUri = `mongodb+srv://netrutv:Netrutv39@basic.mtdr6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

    try {
        await fs.ensureDir(BUILD_ROOT);
        if (await fs.pathExists(buildPath)) await fs.remove(buildPath);

        console.log(`> [1/3] Cloning repository into factory_builds/api_${safeName}...`);
        execSync(`git clone --depth 1 ${GITHUB_REPO} "${buildPath}"`, { stdio: 'inherit' });

        console.log(`> [2/3] DB HANDSHAKE: Connecting to Atlas [${dbName}]...`);
        await mongoose.connect(finalMongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`> [DB] ✅ Connected!`);

        // Seed Admin/SuperAdmin Roles
        console.log(`> [DB] Seeding Administrative Roles...`);
        const users = [
            { name: "Super Admin", email: "superadmin@gmail.com", password: "admin@123", role: "superadmin", voterId: "SUA1234", age: 23 },
            { name: "Admin ${cityName}", email: "admin@${safeName}.com", password: "admin@123", role: "admin", voterId: "ADM1234", age: 25 },
            { name: "Field Worker", email: "worker@${safeName}.com", password: "admin@123", role: "user", voterId: "VOT1234", age: 21 }
        ];
        
        for (let u of users) { 
            await User.findOneAndUpdate({ email: u.email }, u, { upsert: true }); 
        }

        // Seed Voter Data from Excel
        let recordCount = 0;
        if (voterData && voterData.length > 0) {
            console.log(`> [DB] Injecting ${voterData.length} records into Voters collection...`);
            await Voter.deleteMany({}); 
            const result = await Voter.insertMany(voterData, { ordered: false });
            recordCount = result.length;
        }
        
        await mongoose.disconnect();
        console.log(`> [DB] ✅ Injection Complete for ${dbName}.`);

        console.log(`> [3/3] Finalizing ZIP...`);
        const backendEnv = `PORT=3000\nMONGO_URI=${finalMongoUri}\nCITY=${cityName}\nPACKAGE_ID=${packageId}\nJWT_SECRET=Netrutv_Secret_2026`;
        await fs.writeFile(path.join(buildPath, 'Server', '.env'), backendEnv);
        
        await createZip(path.join(buildPath, 'Server'), zipPath);
        return { success: true, zipName, dbName, count: recordCount };

    } catch (err) {
        console.error(`> [ERROR] ❌ ${err.message}`);
        if(mongoose.connection.readyState !== 0) await mongoose.disconnect();
        return { success: false, error: err.message };
    }
}

// Ensure updateClientEnv and streamExpoBuild use the correct BUILD_ROOT pathing
async function updateClientEnv({ cityName, hostingerUrl }) {
    const safeName = cityName.toLowerCase().replace(/\s+/g, '_');
    const clientPath = path.resolve(BUILD_ROOT, `api_${safeName}`, 'Client');
    const envPath = path.join(clientPath, '.env');
    try {
        const envContent = `EXPO_PUBLIC_API_URL=${hostingerUrl}\nEXPO_PUBLIC_CITY=${cityName}`;
        await fs.writeFile(envPath, envContent);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function streamExpoBuild(cityName, res) {
    const safeName = cityName.toLowerCase().replace(/\s+/g, '_');
    const clientPath = path.resolve(BUILD_ROOT, `api_${safeName}`, 'Client');
    res.write(`data: [SYSTEM] SYNCING DEPENDENCIES...\n\n`);
    try {
        execSync(`npm install --no-audit`, { cwd: clientPath, stdio: 'inherit' });
        res.write(`data: [SYSTEM] NPM INSTALL COMPLETE. STARTING EAS BUILD...\n\n`);
        const buildProcess = spawn('npx', ['eas', 'build', '--platform', 'android', '--profile', 'preview', '--non-interactive'], {
            cwd: clientPath, shell: true
        });
        buildProcess.stdout.on('data', d => res.write(`data: ${d.toString()}\n\n`));
        buildProcess.stderr.on('data', d => res.write(`data: [LOG]: ${d.toString()}\n\n`));
        buildProcess.on('close', code => {
            res.write(`data: [BUILD_FINISHED] Code: ${code}\n\n`);
            res.end();
        });
    } catch (e) {
        res.write(`data: [ERROR]: ${e.message}\n\n`);
        res.end();
    }
}

function createZip(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);
    return new Promise((resolve, reject) => {
        archive.directory(sourceDir, false).on('error', e => reject(e)).pipe(stream);
        stream.on('close', () => resolve());
        archive.finalize();
    });
}

module.exports = { generateCityBuild, updateClientEnv, streamExpoBuild };