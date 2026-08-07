import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  listProjects, getProject, createProject, updateProject, deleteProject, addItem, removeItem,
} from '../controllers/projectController.js';

const router = express.Router();
router.use(verifyToken); // every project route is owner-scoped

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/items', addItem);
router.delete('/:id/items/:itemId', removeItem);

export default router;
