const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const DEVELOPMENT_URL = "http://localhost:5173";
const isDevelopmentMode = !app.isPackaged;

let mainWindow = null;

function createMainWindow() {
  console.log("[DEBUG] Creating main window...");
  console.log("[DEBUG] isDevelopmentMode:", isDevelopmentMode);
  console.log("[DEBUG] DEVELOPMENT_URL:", DEVELOPMENT_URL);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0F172A",
    show: true,
    autoHideMenuBar: true,
    title: "QuanLyDN - Quản lý doanh nghiệp",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  console.log("[DEBUG] BrowserWindow created");

  // Capture and log renderer console messages for debugging
  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[RENDERER CONSOLE] [Level ${level}] ${message} (from ${sourceId}:${line})`);
  });

  if (isDevelopmentMode) {
    console.log("[DEBUG] Loading URL:", DEVELOPMENT_URL);
    mainWindow.loadURL(DEVELOPMENT_URL).then(() => {
      console.log("[DEBUG] URL loaded successfully");
    }).catch((err) => {
      console.error("[DEBUG] Error loading URL:", err);
    });
  } else {
    const productionIndexPath = path.join(__dirname, "..", "dist", "index.html");
    console.log("[DEBUG] Loading file:", productionIndexPath);
    mainWindow.loadFile(productionIndexPath);
  }

  mainWindow.once("ready-to-show", () => {
    console.log("[DEBUG] ready-to-show fired, showing window");
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[DEBUG] did-finish-load fired");
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("[DEBUG] did-fail-load:", errorCode, errorDescription);
  });

  mainWindow.on("closed", () => {
    console.log("[DEBUG] Window closed");
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
