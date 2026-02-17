const ScanRecord = require('../models/ScanRecord');

exports.createScanRecord = async (req, res) => {
  try {
    const { 
      userId, scanId, imageUrl, imagePublicId, 
      width_cm, height_cm, estimated_age, 
      algae_label, turbidity_level, location, 
      processing_time, model_version 
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'No image URL provided' });
    }

    const newRecord = await ScanRecord.create({
      user: req.user.userId, 
      scanId: scanId,
      image: {
        url: imageUrl,
        public_id: imagePublicId || 'default_id'
      },
      morphometrics: {
        width_cm: width_cm,
        height_cm: height_cm,
        estimated_age: estimated_age
      },
      environment: {
        algae_label: algae_label,
        turbidity_level: turbidity_level
      },
      location: location,
      processing_time: processing_time,
      model_version: model_version
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