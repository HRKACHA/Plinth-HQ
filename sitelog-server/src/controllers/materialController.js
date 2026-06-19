import Material from '../models/Material.js';
import MaterialLog from '../models/MaterialLog.js';
import Expense from '../models/Expense.js';
import SiteLog from '../models/SiteLog.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/* ── LIST ── */
export const listMaterials = catchAsync(async (req, res) => {
  const filter = { organisation: req.user.organisation };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.project === 'warehouse') filter.project = null;

  const materials = await Material.find(filter).populate('project', 'name').sort('name');
  res.json({ success: true, data: materials });
});

/* ── CREATE ── */
export const createMaterial = catchAsync(async (req, res) => {
  const { name, category, unit, currentStock, minThreshold, unitPrice, supplier, location, project } = req.body;
  if (!name) throw new AppError('Material name is required.', 400);

  const material = await Material.create({
    organisation: req.user.organisation,
    name,
    category,
    unit,
    currentStock: Number(currentStock) || 0,
    minThreshold: Number(minThreshold) || 0,
    unitPrice: Number(unitPrice) || 0,
    supplier,
    location,
    project: project || null,
  });

  res.status(201).json({ success: true, data: material });
});

/* ── UPDATE ── */
export const updateMaterial = catchAsync(async (req, res) => {
  const material = await Material.findOneAndUpdate(
    { _id: req.params.mId, organisation: req.user.organisation },
    req.body,
    { new: true }
  );
  if (!material) throw new AppError('Material not found.', 404);
  res.json({ success: true, data: material });
});

/* ── DELETE ── */
export const deleteMaterial = catchAsync(async (req, res) => {
  const material = await Material.findOneAndDelete({
    _id: req.params.mId,
    organisation: req.user.organisation,
  });
  if (!material) throw new AppError('Material not found.', 404);
  await MaterialLog.deleteMany({ material: req.params.mId });
  res.json({ success: true, message: 'Material deleted.' });
});

/* ── ADD MOVEMENT (inward / outward / transfer) ── */
export const addMovement = catchAsync(async (req, res) => {
  const { type, qty, fromProject, toProject, vendor, notes, date } = req.body;
  if (!type || !qty) throw new AppError('Movement type and quantity are required.', 400);

  const material = await Material.findOne({ _id: req.params.mId, organisation: req.user.organisation });
  if (!material) throw new AppError('Material not found.', 404);

  const quantity = Number(qty);
  if (quantity <= 0) throw new AppError('Quantity must be positive.', 400);

  if (type === 'inward') {
    material.currentStock += quantity;
  } else if (type === 'outward') {
    if (material.currentStock < quantity) throw new AppError(`Insufficient stock. Available: ${material.currentStock}`, 400);
    material.currentStock -= quantity;
  } else if (type === 'transfer') {
    if (material.currentStock < quantity) throw new AppError(`Insufficient stock. Available: ${material.currentStock}`, 400);
    material.currentStock -= quantity;

    if (toProject) {
      const amount = quantity * (material.unitPrice || 0);
      if (amount > 0) {
        await Expense.create({
          project: toProject,
          category: 'material',
          vendor: vendor || material.supplier || 'Internal Warehouse',
          description: `Material Transfer: ${quantity} ${material.unit} of ${material.name}`,
          amount: amount,
          invoiceDate: date || new Date(),
          addedBy: req.user._id,
        });
      }

      const logDateString = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const logDate = new Date(logDateString);

      const newMaterialEntry = {
        name: material.name,
        qty: quantity.toString(),
        unit: material.unit,
        supplier: vendor || material.supplier || 'Internal Warehouse',
        price: amount,
        recdAt: logDate,
      };

      const startOfDay = new Date(logDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(logDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      let siteLog = await SiteLog.findOne({
        project: toProject,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (siteLog) {
        siteLog.materials.push(newMaterialEntry);
        await siteLog.save();
      } else {
        await SiteLog.create({
          project: toProject,
          date: logDate,
          activities: `Material Transferred: ${quantity} ${material.unit} of ${material.name}`,
          materials: [newMaterialEntry],
          createdBy: req.user._id,
        });
      }
    }
  }

  await material.save();

  const log = await MaterialLog.create({
    material: material._id,
    organisation: req.user.organisation,
    type,
    qty: quantity,
    fromProject: fromProject || null,
    toProject: toProject || null,
    vendor: vendor || '',
    notes: notes || '',
    date: date || new Date(),
    addedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: { material, log } });
});

/* ── LIST MOVEMENTS ── */
export const listMovements = catchAsync(async (req, res) => {
  const logs = await MaterialLog.find({ material: req.params.mId, organisation: req.user.organisation })
    .populate('fromProject', 'name')
    .populate('toProject', 'name')
    .populate('addedBy', 'name')
    .sort('-date');
  res.json({ success: true, data: logs });
});

/* ── LOW STOCK ── */
export const getLowStock = catchAsync(async (req, res) => {
  const materials = await Material.find({
    organisation: req.user.organisation,
    $expr: { $lte: ['$currentStock', '$minThreshold'] },
    minThreshold: { $gt: 0 },
  }).populate('project', 'name').sort('name');
  res.json({ success: true, data: materials });
});
