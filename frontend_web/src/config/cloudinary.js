export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvdrak5wl', 
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'CrayAI',  
  apiUrl: import.meta.env.VITE_CLOUDINARY_API_URL || 'https://api.cloudinary.com/v1_1/dvdrak5wl/image/upload'
};