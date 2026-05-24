const express = require('express');
const BlogPost = require('../models/BlogPost');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper to generate unique slug
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

// GET all published blog posts
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const query = { status: 'published' };
    
    // Optional filter by tag
    if (req.query.tag) {
      query.tags = req.query.tag;
    }

    // Optional filter by search query
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { excerpt: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const posts = await BlogPost.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      success: true,
      count: posts.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      data: posts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all unique published tags/categories
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.distinct('tags', { status: 'published' });
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single blog post by slug or ID
router.get('/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    
    // Try finding by slug first, then by ObjectId if it looks like one
    let query = { slug: slugOrId.toLowerCase() };
    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: slugOrId }, { slug: slugOrId.toLowerCase() }] };
    }

    const post = await BlogPost.findOne(query);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    // Check if draft and user is not admin
    if (post.status === 'draft') {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

// GET all blog posts (Admin list)
router.get('/admin/all', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Create new blog post
router.post('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, author, tags, status } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    let slug = generateSlug(title);
    
    // Check if slug is unique, append timestamp if duplicate
    const slugExists = await BlogPost.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const post = new BlogPost({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      author: author || 'Meloraa Editorial',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null
    });

    await post.save();
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT Update blog post
router.put('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    const fieldsToUpdate = ['title', 'excerpt', 'content', 'coverImage', 'author', 'tags', 'status'];
    
    // If status changes to published, set publishedAt date
    if (req.body.status && req.body.status !== post.status) {
      if (req.body.status === 'published') {
        post.publishedAt = new Date();
      } else {
        post.publishedAt = null;
      }
    }

    // Auto-generate new slug if title changes
    if (req.body.title && req.body.title !== post.title) {
      let newSlug = generateSlug(req.body.title);
      const slugExists = await BlogPost.findOne({ slug: newSlug, _id: { $ne: post._id } });
      if (slugExists) {
        newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
      }
      post.slug = newSlug;
    }

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'tags') {
          post.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim());
        } else {
          post[field] = req.body[field];
        }
      }
    });

    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE delete blog post
router.delete('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }
    res.json({ success: true, message: 'Blog post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
