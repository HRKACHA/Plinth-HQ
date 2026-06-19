import { Router } from 'express';
import * as uploadCtrl from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(protect);
router.post('/', upload.single('file'), uploadCtrl.uploadFile);
router.post('/photos', upload.array('photos', 20), uploadCtrl.uploadPhotos);
export default router;
