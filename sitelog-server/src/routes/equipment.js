import { Router } from 'express';
import * as eq from '../controllers/equipmentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/maintenance-due', eq.getMaintenanceDue);
router.get('/', eq.listEquipment);
router.post('/', eq.createEquipment);
router.put('/:eId', eq.updateEquipment);
router.delete('/:eId', eq.deleteEquipment);
router.put('/:eId/assign', eq.assignToProject);
router.post('/:eId/service', eq.addServiceLog);
router.get('/:eId/service', eq.listServiceLogs);

export default router;
