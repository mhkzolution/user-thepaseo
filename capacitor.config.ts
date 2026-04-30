import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thepaseo.user',
  appName: 'Paseo',
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