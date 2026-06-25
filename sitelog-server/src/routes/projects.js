import { Router } from 'express';
import * as project from '../controllers/projectController.js';
import * as log from '../controllers/logController.js';
import * as budget from '../controllers/budgetController.js';
import * as milestone from '../controllers/milestoneController.js';
import * as document from '../controllers/documentController.js';
import * as issue from '../controllers/issueController.js';
import * as gallery from '../controllers/galleryController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { getProjectOrFail } from '../middleware/projectAccess.js';
import { upload } from '../middleware/upload.js';
import { checkProjectLimit } from '../middleware/planEnforcement.js';

const router = Router();

router.use(protect);

router.get('/', project.listProjects);
router.post('/', restrictTo('PM', 'SuperAdmin'), checkProjectLimit, project.createProject);

router.get('/:id', getProjectOrFail, project.getProject);
router.put('/:id', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, project.updateProject);
router.delete('/:id', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, project.deleteProject);
router.get('/:id/stats', getProjectOrFail, project.getProjectStats);
router.post('/:id/invite', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, project.inviteTeamMember);
router.post('/:id/share', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, project.refreshShareToken);

router.get('/:id/logs', getProjectOrFail, log.listLogs);
router.post('/:id/logs', getProjectOrFail, log.createLog);
router.get('/:id/logs/:logId', getProjectOrFail, log.getLog);
router.put('/:id/logs/:logId', getProjectOrFail, log.updateLog);
router.post('/:id/logs/:logId/lock', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, log.lockLog);
router.delete('/:id/logs/:logId', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, log.deleteLog);

router.get('/:id/budget', getProjectOrFail, budget.getBudget);
router.put('/:id/budget', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, budget.updateBudget);
router.get('/:id/expenses', getProjectOrFail, budget.listExpenses);
router.post('/:id/expenses', getProjectOrFail, budget.createExpense);
router.post('/:id/expenses/:expId/approve', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, budget.approveExpense);
router.delete('/:id/expenses/:expId', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, budget.deleteExpense);

router.get('/:id/milestones', getProjectOrFail, milestone.listMilestones);
router.post('/:id/milestones', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, milestone.createMilestone);
router.put('/:id/milestones/:mId', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, milestone.updateMilestone);
router.delete('/:id/milestones/:mId', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, milestone.deleteMilestone);
router.post('/:id/milestones/:mId/approve', getProjectOrFail, milestone.approveMilestone);

router.get('/:id/documents', getProjectOrFail, document.listDocuments);
router.post('/:id/documents', getProjectOrFail, upload.single('file'), document.uploadDocument);
router.delete('/:id/documents/:docId', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, document.deleteDocument);

// Issues / Punch List
router.get('/:id/issues', getProjectOrFail, issue.listIssues);
router.post('/:id/issues', getProjectOrFail, issue.createIssue);
router.get('/:id/issues/:issueId', getProjectOrFail, issue.getIssue);
router.put('/:id/issues/:issueId', getProjectOrFail, issue.updateIssue);
router.delete('/:id/issues/:issueId', restrictTo('PM', 'SuperAdmin'), getProjectOrFail, issue.deleteIssue);

// Gallery
router.get('/:id/gallery', getProjectOrFail, gallery.getProjectGallery);
router.post('/:id/gallery', getProjectOrFail, gallery.addGalleryPhoto);
router.delete('/:id/gallery/:parentId', getProjectOrFail, gallery.deleteGalleryPhoto);

export default router;
