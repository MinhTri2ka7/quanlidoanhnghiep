const { contextBridge } = require("electron");
const os = require("os");

function getLocalIpAddress() {
  const networkInterfaceMap = os.networkInterfaces();

  for (const interfaceName of Object.keys(networkInterfaceMap)) {
    const interfaceList = networkInterfaceMap[interfaceName] || [];

    for (const networkInterface of interfaceList) {
      const isIPv4 = networkInterface.family === "IPv4";
      const isInternal = networkInterface.internal;

      if (isIPv4 && !isInternal) {
        return networkInterface.address;
      }
    }
  }

  return "unknown";
}

// Cầu nối an toàn giữa renderer (React) và main process.
contextBridge.exposeInMainWorld("desktopApi", {
  appName: "QuanLyDN",
  appVersion: "0.1.0",
  isElectron: true,
  getLocalIpAddress: () => getLocalIpAddress()
});
