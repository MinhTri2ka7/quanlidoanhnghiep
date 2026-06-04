const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const DEVELOPMENT_URL = "http://localhost:5173";
const isDevelopmentMode = !app.isPackaged;

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0F172A",
    show: false,
    autoHideMenuBar: true,
    title: "QuanLyDN - Quản lý doanh nghiệp",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDevelopmentMode) {
    mainWindow.loadURL(DEVELOPMENT_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const productionIndexPath = path.join(__dirname, "..", "dist", "index.html");
    mainWindow.loadFile(productionIndexPath);
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupApplicationMenu() {
  if (!isDevelopmentMode) {
    Menu.setApplicationMenu(null);
  }
}

app.whenReady().then(() => {
  setupApplicationMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
