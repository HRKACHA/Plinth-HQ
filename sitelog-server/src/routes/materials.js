import { Router } from 'express';
import * as mat from '../controllers/materialController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/low-stock', mat.getLowStock);
router.get('/', mat.listMaterials);
router.post('/', mat.createMaterial);
router.put('/:mId', mat.updateMaterial);
router.delete('/:mId', mat.deleteMaterial);
router.post('/:mId/move', mat.addMovement);
router.get('/:mId/logs', mat.listMovements);

export default router;
