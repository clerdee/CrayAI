// config.js

const config = {
  // fallback 
  // NETWORK_IP: process.env.EXPO_PUBLIC_NETWORK_IP || "http://192.168.1.24:5000",
  NETWORK_IP: process.env.EXPO_PUBLIC_NETWORK_IP || "https://crayai.onrender.com",

  GOOGLE: {
    WEB_CLIENT_ID:
      "89631301641-rdcgj1ba8n2bi6lpmblblnqha3c2jfjd.apps.googleusercontent.com",
    ANDROID_CLIENT_ID:
      "89631301641-ahjbseq5kgl98ivjajd9bspf6i5i21uf.apps.googleusercontent.com",
    IOS_CLIENT_ID:
      "89631301641-dpfct97rnqggb9b8j4866fgqti2n9ss9.apps.googleusercontent.com",
  },

  FACEBOOK_APP_ID: "2401039316998222",

  CLOUDINARY: {
    CLOUD_NAME: "dvdrak5wl",
    UPLOAD_PRESET: "CrayAI",
    API_URL: "https://api.cloudinary.com/v1_1/dvdrak5wl/image/upload",
  },

  FIREBASE: {
    API_KEY: "AIzaSyCLAJf2jzx-CT6AgQWkKu0iTymukdRz5iM",
    AUTH_DOMAIN: "crayai.firebaseapp.com",
    PROJECT_ID: "crayai",
    STORAGE_BUCKET: "crayai.firebasestorage.app",
    MESSAGING_SENDER_ID: "89631301641",
    APP_ID: "1:89631301641:web:3a296a566be56a4ab398d8",
  },
};

export default config;