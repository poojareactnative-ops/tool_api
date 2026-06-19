const MobileCover = require('../models/mobileCovers');

// Convert flat DB data to nested format
const formatNested = (covers) => {
  const result = {};

  covers.forEach(({ company, model, category, imageUrl }) => {
    if (!result[company]) result[company] = {};
    if (!result[company][model]) result[company][model] = { category: {} };
    if (!result[company][model].category[category]) {
      result[company][model].category[category] = [];
    }
    result[company][model].category[category].push(imageUrl);
  });

  return [{ company: result }];
};

// GET all data nested
const getAllMobileCovers = async (req, res) => {
  try {
    const covers = await MobileCover.find({});
    res.status(200).json(formatNested(covers));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST add new cover
const addMobileCover = async (req, res) => {
  try {
    const { company, model, categories } = req.body;

    // Basic validation
    if (!company || !model || typeof categories !== 'object') {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const entries = [];

    // Flatten the categories and image URLs
    for (const category in categories) {
      const imageUrls = categories[category];

      if (!Array.isArray(imageUrls)) continue;

      imageUrls.forEach((imageUrl) => {
        entries.push({
          company,
          model,
          category,
          imageUrl,
        });
      });
    }

    // Insert all entries into MongoDB
    const saved = await MobileCover.insertMany(entries);

    res.status(201).json({
      message: 'Mobile cover data added successfully',
      count: saved.length,
      data: saved,
    });
  } catch (error) {
    console.error('Error in addMobileCover:', error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE: Replace imageUrl
const updateMobileCoverImage = async (req, res) => {
  const { company, model, category, oldImageUrl, newImageUrl } = req.body;
  try {
    const cover = await MobileCover.findOneAndUpdate(
      { company, model, category, imageUrl: oldImageUrl },
      { imageUrl: newImageUrl },
      { new: true }
    );
    if (!cover) return res.status(404).json({ error: 'Cover not found' });

    res.status(200).json({ message: 'Image URL updated', data: cover });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: specific image
const deleteCoverImage = async (req, res) => {
  const { company, model, category, imageUrl } = req.body;
  try {
    const deleted = await MobileCover.findOneAndDelete({ company, model, category, imageUrl });
    if (!deleted) return res.status(404).json({ error: 'Image not found' });

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE: entire category or model
const deleteCovers = async (req, res) => {
  const { company, model, category } = req.body;
  try {
    const query = { company };
    if (model) query.model = model;
    if (category) query.category = category;

    const result = await MobileCover.deleteMany(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No records found to delete' });
    }

    res.status(200).json({ message: 'Deleted successfully', count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Optional filtered GET by query
const getMobileCoversByFilter = async (req, res) => {
  try {
    const { company, model, category } = req.query;
    const query = {};
    if (company) query.company = company;
    if (model) query.model = model;
    if (category) query.category = category;

    const covers = await MobileCover.find(query);
    res.status(200).json(formatNested(covers));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMobileCovers,
  addMobileCover,
  getMobileCoversByFilter,
  updateMobileCoverImage,
  deleteCoverImage,
  deleteCovers
};
