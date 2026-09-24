import { UAParser } from "ua-parser-js";

export function formatDevice(userAgent?: string | null) {
    if (!userAgent) return null;
     
    const result = UAParser(userAgent);
    
    const device = [
      result.browser.name,
      result.os.name,
    ].filter(Boolean);
    
    if (device.length === 0) return null;
    if (device.length === 1) return device[0];
    
    return `${device[0]} on ${device[1]}`;
}
