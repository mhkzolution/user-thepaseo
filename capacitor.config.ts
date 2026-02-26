import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thepaseo.member',
  appName: 'Paseo Member',
  server: {
    url: "http://192.168.12.130:3000",
    cleartext: true
  }
};

export default config;