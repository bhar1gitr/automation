const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// Upload CSV
app.post("/upload", upload.single("file"), (req, res) => {
    console.log("File received:", req.file.originalname);

    // Simulate processing + APK build
    setTimeout(() => {
        // create dummy APK file
        fs.writeFileSync("build/app.apk", "dummy apk content");

        res.json({
            message: "APK Generated",
            downloadUrl: "http://localhost:5000/download"
        });
    }, 5000); // 5 sec delay
});

// Download APK
app.get("/download", (req, res) => {
    res.download("build/app.apk");
});

app.listen(5000, () => console.log("Server running on 5000"));