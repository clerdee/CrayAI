const ScanRecord = require('../models/ScanRecord');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

exports.createScanRecord = async (req, res) => {
  try {
    // 1. Receive the nested data exactly as Frontend sends it
    const { 
      scanId, 
      gender, 
      gender_confidence, 
      image, 
      morphometrics, 
      environment, 
      metadata 
    } = req.body;

    // 2. Validate using the nested structure
    // The frontend sends 'image' as an object, so we check image.url
    if (!image || !image.url) {
      return res.status(400).json({ message: 'No image URL provided' });
    }

    // 3. Create the record
    // We map the incoming nested objects to the Schema structure
    const newRecord = await ScanRecord.create({
      user: req.user.userId, 
      scanId: scanId,
      
      // Pass the objects directly since they match the Schema structure
      image: image,
      morphometrics: morphometrics,
      environment: environment,
      
      gender: gender || "Not Defined",           
      gender_confidence: gender_confidence || 0, 
      
      // Extract flattened fields from the frontend 'metadata' object to match Schema root fields
      location: metadata?.location || 'Unknown Location',
      processing_time: metadata?.processing_time,
      model_version: metadata?.model_version
    });

    res.status(201).json({ success: true, message: 'Scan Record Saved', record: newRecord });

  } catch (error) {
    console.error('Save Scan Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMyRecords = async (req, res) => {
  try {
    const records = await ScanRecord.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const scan = await ScanRecord.findById(req.params.id);
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });

    scan.isFavorite = !scan.isFavorite;
    await scan.save();
    
    res.status(200).json({ success: true, isFavorite: scan.isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.toggleSoftDelete = async (req, res) => {
  try {
    const scan = await ScanRecord.findById(req.params.id);
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
    
    scan.isDeleted = !scan.isDeleted;
    await scan.save();
    
    res.status(200).json({ success: true, isDeleted: scan.isDeleted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.hardDeleteScan = async (req, res) => {
  try {
    const scan = await ScanRecord.findById(req.params.id);
    if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });

    if (scan.image && scan.image.public_id) {
        await cloudinary.uploader.destroy(scan.image.public_id);
    }

    await scan.deleteOne(); 

    res.status(200).json({ success: true, message: 'Record permanently deleted.' });
  } catch (error) {
    console.error("Hard Delete Error:", error);
    res.status(500).json({ success: false, message: 'Server error during hard delete' });
  }
};

exports.getAllScans = async (req, res) => {
  try {
    const records = await ScanRecord.find()
      .populate('user', 'firstName lastName profilePic email') 
      .sort({ createdAt: -1 }); 
      
    res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("Fetch All Scans Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};