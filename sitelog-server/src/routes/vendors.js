import { Router } from 'express';
import * as vendor from '../controllers/vendorController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', vendor.listVendors);
router.post('/', vendor.createVendor);
router.put('/:vId', vendor.updateVendor);
router.delete('/:vId', vendor.deleteVendor);
router.post('/:vId/spend', vendor.addVendorSpend);
export default router;

