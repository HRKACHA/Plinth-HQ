import Equipment from '../models/Equipment.js';
import ServiceLog from '../models/ServiceLog.js';
import Expense from '../models/Expense.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/* ── LIST ── */
export const listEquipment = catchAsync(async (req, res) => {
  const filter = { organisation: req.user.organisation };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.project) filter.assignedProject = req.query.project;

  const equipment = await Equipment.find(filter).populate('assignedProject', 'name').sort('name');
  res.json({ success: true, data: equipment });
});

/* ── CREATE ── */
export const createEquipment = catchAsync(async (req, res) => {
  const {
    name, category, type, serialNumber, status, condition, notes,
    purchaseDate, purchaseCost, dailyRate, rentalVendor, rentalStartDate, rentalEndDate,
    nextMaintenanceDate, assignedProject,
  } = req.body;
  if (!name) throw new AppError('Equipment name is required.', 400);

  const equipment = await Equipment.create({
    organisation: req.user.organisation,
    name,
    category,
    type: type || 'Owned',
    serialNumber,
    status: status || (assignedProject ? 'Active' : 'Idle'),
    condition: condition || 'Good',
    notes,
    purchaseDate: purchaseDate || null,
    purchaseCost: Number(purchaseCost) || 0,
    dailyRate: Number(dailyRate) || 0,
    rentalVendor,
    rentalStartDate: rentalStartDate || null,
    rentalEndDate: rentalEndDate || null,
    nextMaintenanceDate: nextMaintenanceDate || null,
    assignedProject: assignedProject || null,
  });

  if (equipment.type === 'Rented' && equipment.assignedProject && equipment.dailyRate > 0) {
    let daysToCharge = 1;
    if (equipment.rentalStartDate) {
      const start = new Date(equipment.rentalStartDate);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (start <= today) {
        daysToCharge = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    await Expense.create({
      project: equipment.assignedProject,
      category: 'equipment',
      vendor: equipment.rentalVendor || 'Rental Vendor',
      description: `Initial Rent (Backdated ${daysToCharge} days): ${equipment.name}`,
      amount: equipment.dailyRate * daysToCharge,
      invoiceDate: equipment.rentalStartDate || new Date(),
      addedBy: req.user._id,
    });
  }

  res.status(201).json({ success: true, data: equipment });
});

  /* ── UPDATE ── */
  export const updateEquipment = catchAsync(async (req, res) => {
    const equipment = await Equipment.findOneAndUpdate(
      { _id: req.params.eId, organisation: req.user.organisation },
      req.body,
      { new: true }
    ).populate('assignedProject', 'name');
    if (!equipment) throw new AppError('Equipment not found.', 404);
    res.json({ success: true, data: equipment });
  });

  /* ── DELETE ── */
  export const deleteEquipment = catchAsync(async (req, res) => {
    const equipment = await Equipment.findOneAndDelete({
      _id: req.params.eId,
      organisation: req.user.organisation,
    });
    if (!equipment) throw new AppError('Equipment not found.', 404);
    await ServiceLog.deleteMany({ equipment: req.params.eId });
    res.json({ success: true, message: 'Equipment deleted.' });
  });

  /* ── ASSIGN TO PROJECT ── */
  export const assignToProject = catchAsync(async (req, res) => {
    const { projectId, status } = req.body;

    const equipment = await Equipment.findOne({ _id: req.params.eId, organisation: req.user.organisation });
    if (!equipment) throw new AppError('Equipment not found.', 404);

    const oldProject = equipment.assignedProject;
    equipment.assignedProject = projectId || null;
    equipment.status = status || (projectId ? 'Active' : 'Idle');
    await equipment.save();

    // If equipment is rented and newly assigned to a project, log the initial day's expense immediately
    if (equipment.type === 'Rented' && equipment.assignedProject && equipment.dailyRate > 0 && String(oldProject) !== String(projectId)) {
      let daysToCharge = 1;
      if (equipment.rentalStartDate) {
        const start = new Date(equipment.rentalStartDate);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (start <= today) {
          daysToCharge = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
        }
      }

      await Expense.create({
        project: equipment.assignedProject,
        category: 'equipment',
        vendor: equipment.rentalVendor || 'Rental Vendor',
        description: `Initial Rent Assignment${daysToCharge > 1 ? ` (Backdated ${daysToCharge} days)` : ''}: ${equipment.name}`,
        amount: equipment.dailyRate * daysToCharge,
        invoiceDate: equipment.rentalStartDate || new Date(),
        addedBy: req.user._id,
      });
    }

    const updatedEquipment = await Equipment.findById(equipment._id).populate('assignedProject', 'name');
    res.json({ success: true, data: updatedEquipment });
  });

  /* ── ADD SERVICE LOG ── */
  export const addServiceLog = catchAsync(async (req, res) => {
    const { type, description, cost, serviceDate, nextDueDate, performedBy } = req.body;
    if (!type || !description) throw new AppError('Service type and description are required.', 400);

    const equipment = await Equipment.findOne({ _id: req.params.eId, organisation: req.user.organisation });
    if (!equipment) throw new AppError('Equipment not found.', 404);

    const log = await ServiceLog.create({
      equipment: equipment._id,
      organisation: req.user.organisation,
      type,
      description,
      cost: Number(cost) || 0,
      serviceDate: serviceDate || new Date(),
      nextDueDate: nextDueDate || null,
      performedBy: performedBy || '',
      addedBy: req.user._id,
    });

    // Update equipment next maintenance date if provided
    if (nextDueDate) {
      equipment.nextMaintenanceDate = nextDueDate;
      await equipment.save();
    }

    res.status(201).json({ success: true, data: log });
  });

  /* ── LIST SERVICE LOGS ── */
  export const listServiceLogs = catchAsync(async (req, res) => {
    const logs = await ServiceLog.find({ equipment: req.params.eId, organisation: req.user.organisation })
      .populate('addedBy', 'name')
      .sort('-serviceDate');
    res.json({ success: true, data: logs });
  });

  /* ── MAINTENANCE DUE ── */
  export const getMaintenanceDue = catchAsync(async (req, res) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const equipment = await Equipment.find({
      organisation: req.user.organisation,
      nextMaintenanceDate: { $lte: sevenDaysFromNow, $ne: null },
      status: { $ne: 'Retired' },
    }).populate('assignedProject', 'name').sort('nextMaintenanceDate');

    res.json({ success: true, data: equipment });
  });

  /* ── CRON: PROCESS DAILY RENTALS ── */
  export async function processEquipmentRentals() {
    const equipmentList = await Equipment.find({
      type: 'Rented',
      assignedProject: { $ne: null }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const eq of equipmentList) {
      if (eq.rentalEndDate && new Date(eq.rentalEndDate) < today) {
        await Equipment.findByIdAndDelete(eq._id);
        continue;
      }

      if (eq.dailyRate > 0) {
        await Expense.create({
          project: eq.assignedProject,
          category: 'equipment',
          vendor: eq.rentalVendor || 'Rental Vendor',
          description: `Daily Rent: ${eq.name}`,
          amount: eq.dailyRate,
          invoiceDate: new Date(),
        });
      }
    }
  }
