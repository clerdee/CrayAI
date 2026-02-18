const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 

const { 
  createScanRecord, 
  getMyRecords,
  toggleFavorite,     
  toggleSoftDelete,
  hardDeleteScan,
  getAllScans
} = require('../controllers/scanController');

router.post('/create', auth, createScanRecord);
router.get('/me', auth, getMyRecords);
router.patch('/:id/favorite', auth, toggleFavorite);
router.patch('/:id/delete', auth, toggleSoftDelete);
router.delete('/:id/hard-delete', auth, hardDeleteScan);
router.get('/all', auth, getAllScans);

module.exports = router;