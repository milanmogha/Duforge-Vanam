// src/controllers/bannerController.js

import Banner from '../models/Banner.js';
import sharp from 'sharp'; // ✅ IMPORT SHARP

// Fetch all banners
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    const formattedBanners = banners.map((banner) => ({
      _id: banner._id,
      text: banner.text,
      link: banner.link,
      createdAt: banner.createdAt,
      // Convert Buffer to Base64 for frontend
      image: `data:${banner.image.contentType};base64,${banner.image.data.toString('base64')}`,
    }));
    res.status(200).json(formattedBanners);
  } catch (error) {
    console.error('Error fetching banners:', error.message);
    res.status(500).json({ message: 'Failed to fetch banners' });
  }
};

// Add a new banner (Fixed for High Quality)
export const addBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    const { text = '', link = '' } = req.body;

    // ✅ FORCE HIGH RESOLUTION PROCESSING
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize({
        width: 1920, // Resize width to 1920px (Standard Desktop)
        height: null, // Auto-adjust height to keep aspect ratio
        withoutEnlargement: true // If image is smaller than 1920, don't stretch it
      })
      .toFormat('jpeg', { quality: 90 }) // Convert to JPEG with 90% Quality
      .toBuffer();

    const banner = new Banner({
      image: {
        data: processedImageBuffer, // Save the processed high-res buffer
        contentType: 'image/jpeg',  // We converted it to jpeg above
      },
      text,
      link,
    });

    await banner.save();

    res.status(201).json({
      message: 'Banner added successfully',
      banner: {
        _id: banner._id,
        text: banner.text,
        link: banner.link,
        createdAt: banner.createdAt,
        image: `data:image/jpeg;base64,${processedImageBuffer.toString('base64')}`,
      }
    });
  } catch (error) {
    console.error('Error adding banner:', error.message);
    res.status(500).json({ message: 'Failed to add banner' });
  }
};

// Delete a banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error.message);
    res.status(500).json({ message: 'Failed to delete banner' });
  }
};