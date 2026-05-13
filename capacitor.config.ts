import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wingsgraphics.studio',
  appName: 'Wings Design Studio',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#9b4dff",
    },
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
