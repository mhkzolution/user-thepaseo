import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paseolife',
  appName: 'PaseoLife',
  plugins: {
    StatusBar: {
      /** ไม่ให้เนื้อหา HTML ไปอยู่ใต้ Status Bar / notch */
      overlaysWebView: false,
      backgroundColor: '#9DC93C',
      style: 'DARK',
    },
  },
  server: {
    url: "https://user.thepaseo.co.th",
    cleartext: false,
    androidScheme: "https",
    // Allow OAuth/API host + LINE authorization (default is only server.url)
    allowNavigation: [
      "user.thepaseo.co.th",
      "admin.thepaseo.co.th",
      "access.line.me",
      "line.me",
    ],
  },
};

export default config;