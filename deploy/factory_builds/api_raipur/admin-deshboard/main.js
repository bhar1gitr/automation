const { app, BrowserWindow } = require("electron");
const path = require("path");

// Optional: Dev reload
try {
  require("electron-reload")(__dirname);
} catch (err) {}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "logo.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Set to false for simpler script access in small apps
    },
  });

  mainWindow.loadFile("index.html");
  // mainWindow.webContents.openDevTools(); // Uncomment to debug
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});