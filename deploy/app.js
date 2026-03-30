const express = require('express');
const path = require('path');
const { generateCityBuild, updateClientEnv, streamExpoBuild } = require('./factory');

const app = express();
app.use(express.json({ limit: '100mb' })); 
app.use(express.static('public'));

app.post('/api/build-zip', async (req, res) => {
    req.setTimeout(600000); // 10 Min for DB Injection
    const result = await generateCityBuild(req.body);
    res.json(result);
});

app.post('/api/generate-apk-config', async (req, res) => {
    const result = await updateClientEnv(req.body);
    res.json(result);
});

app.get('/api/build-apk-logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    streamExpoBuild(req.query.cityName, res);
});

app.get('/download/:zipName', (req, res) => {
    res.download(path.join(__dirname, 'factory_builds', req.params.zipName));
});

app.listen(5000, () => console.log(`🚀 Factory UI live: http://localhost:5000`));