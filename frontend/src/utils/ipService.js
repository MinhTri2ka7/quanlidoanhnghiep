const PUBLIC_IP_API_URL = "https://api.ipify.org?format=json";

function isRunningInElectron() {
  return typeof window !== "undefined" && Boolean(window.desktopApi);
}

export function getLocalIpAddress() {
  if (isRunningInElectron()) {
    return window.desktopApi.getLocalIpAddress();
  }

  // Trình duyệt không cho phép đọc IP nội bộ vì lý do bảo mật.
  return "unavailable";
}

export async function getPublicIpAddress() {
  try {
    const response = await fetch(PUBLIC_IP_API_URL);

    if (!response.ok) {
      return "unknown";
    }

    const responseData = await response.json();
    return responseData.ip || "unknown";
  } catch (error) {
    return "unknown";
  }
}

export async function getCurrentMachineIpInfo() {
  const localIpAddress = getLocalIpAddress();
  const publicIpAddress = await getPublicIpAddress();

  return {
    localIpAddress,
    publicIpAddress,
    capturedAt: new Date().toISOString()
  };
}
