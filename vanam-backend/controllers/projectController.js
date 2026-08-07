// controllers/projectController.js
import mongoose from 'mongoose';
import Project from '../models/Project.js';

const valid = (id) => mongoose.Types.ObjectId.isValid(id);

// All handlers scope by req.user.userId so a user can only touch their own boards.
export const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.json(projects);
  } catch (err) {
    console.error('listProjects error:', err.message);
    res.status(500).json({ message: 'Failed to load projects' });
  }
};

export const getProject = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const project = await Project.findOne({ _id: req.params.id, user: req.user.userId })
      .populate('items.product', 'name price discount slug images.image1 color primaryMaterial')
      .lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });
    // Convert item image1 buffers to data URLs for convenience.
    project.items = (project.items || []).map((it) => {
      const img = it.product?.images?.image1;
      if (img?.data) {
        it.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
        delete it.product.images;
      }
      return it;
    });
    res.json(project);
  } catch (err) {
    console.error('getProject error:', err.message);
    res.status(500).json({ message: 'Failed to load project' });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Project name is required' });
    const project = await Project.create({
      user: req.user.userId,
      name: String(name).trim().slice(0, 120),
      description: String(description).slice(0, 1000),
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('createProject error:', err.message);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const update = {};
    if (req.body.name !== undefined) update.name = String(req.body.name).trim().slice(0, 120);
    if (req.body.description !== undefined) update.description = String(req.body.description).slice(0, 1000);
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: update },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('updateProject error:', err.message);
    res.status(500).json({ message: 'Failed to update project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const r = await Project.deleteOne({ _id: req.params.id, user: req.user.userId });
    if (!r.deletedCount) return res.status(404).json({ message: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteProject error:', err.message);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

export const addItem = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const { product, finish = '', room = '', quantity = 1, note = '' } = req.body;
    if (!valid(product)) return res.status(400).json({ message: 'Valid product is required' });
    const project = await Project.findOne({ _id: req.params.id, user: req.user.userId });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.items.push({
      product,
      finish: String(finish).slice(0, 60),
      room: String(room).slice(0, 60),
      quantity: Math.max(1, Math.min(999, parseInt(quantity, 10) || 1)),
      note: String(note).slice(0, 500),
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('addItem error:', err.message);
    res.status(500).json({ message: 'Failed to add item' });
  }
};

export const removeItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    if (!valid(id) || !valid(itemId)) return res.status(400).json({ message: 'Invalid id' });
    const project = await Project.findOne({ _id: id, user: req.user.userId });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.items.id(itemId)?.deleteOne();
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('removeItem error:', err.message);
    res.status(500).json({ message: 'Failed to remove item' });
  }
};
