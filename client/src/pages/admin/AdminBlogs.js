import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { blogAPI, uploadAPI } from '../../utils/api';

export default function AdminBlogs() {
  const { user } = useSelector(s => s.auth);
  const isAdmin = user?.role === 'admin';
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await blogAPI.adminGetBlogs();
      setBlogs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBlog({
      title: '',
      excerpt: '',
      content: '',
      coverImage: '',
      author: 'Meloraa Editorial',
      tags: '',
      status: 'draft'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (blog) => {
    setEditingBlog({
      ...blog,
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags || ''
    });
    setShowModal(true);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Uploading banner image...');
    const fd = new FormData();
    fd.append('images', file);
    try {
      const res = await uploadAPI.upload(fd);
      const url = res.data.urls[0];
      setEditingBlog(prev => ({ ...prev, coverImage: url }));
      toast.update(toastId, { render: 'Image uploaded successfully!', type: 'success', isLoading: false, autoClose: 2000 });
    } catch (err) {
      toast.update(toastId, { render: 'Upload failed', type: 'error', isLoading: false, autoClose: 3000 });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingBlog.title || !editingBlog.content) {
      return toast.error('Title and content are required');
    }
    setSaving(true);
    const toastId = toast.loading('Saving blog post...');
    try {
      const payload = {
        ...editingBlog,
        tags: typeof editingBlog.tags === 'string' ? editingBlog.tags.split(',').map(t => t.trim()).filter(Boolean) : editingBlog.tags
      };

      if (editingBlog._id) {
        await blogAPI.adminUpdateBlog(editingBlog._id, payload);
      } else {
        await blogAPI.adminCreateBlog(payload);
      }

      await loadBlogs();
      setShowModal(false);
      toast.update(toastId, { render: 'Blog post saved successfully!', type: 'success', isLoading: false, autoClose: 2000 });
    } catch (err) {
      toast.update(toastId, { render: err.response?.data?.message || 'Failed to save blog post', type: 'error', isLoading: false, autoClose: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    const toastId = toast.loading('Deleting blog post...');
    try {
      await blogAPI.adminDeleteBlog(id);
      await loadBlogs();
      toast.update(toastId, { render: 'Blog post deleted successfully!', type: 'success', isLoading: false, autoClose: 2000 });
    } catch (err) {
      toast.update(toastId, { render: 'Failed to delete blog post', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  // Filter logic
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          blog.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manage Blogs</h1>
          <p>Create, edit, and publish journal articles for your store</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            ＋ Write Article
          </button>
        )}
      </div>

      {/* Filter and search bar */}
      <div className="admin-filters" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '300px' }}
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-input"
          style={{ maxWidth: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table view */}
      <div className="card table-wrap" style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #f0ebe4' }}>
        {loading ? (
          <div className="loading-center" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--maroon)' }} />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
            <div className="empty-state-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--maroon)' }}>No Blog Posts Found</div>
            <div className="empty-state-text" style={{ color: '#8c857d', marginTop: '8px' }}>
              Create your first journal article to share with your customers.
            </div>
          </div>
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0ebe4', color: '#6b665e', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 8px' }}>Article</th>
                <th style={{ padding: '12px 8px' }}>Author</th>
                <th style={{ padding: '12px 8px' }}>Tags</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Created</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map(blog => (
                <tr key={blog._id} style={{ borderBottom: '1px solid #f5ede6', fontSize: '0.9rem' }}>
                  <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {blog.coverImage ? (
                      <img src={blog.coverImage} alt={blog.title} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5dec9' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: '#f5ede6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#bcaea0' }}>📰</div>
                    )}
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a1917' }}>{blog.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>/{blog.slug}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px', color: '#6b665e' }}>{blog.author}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {blog.tags?.map((tag, i) => (
                        <span key={i} className="chip chip-ghost" style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#f5ede6', color: 'var(--maroon)', borderRadius: '4px' }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <span className={`chip ${blog.status === 'published' ? 'chip-success' : 'chip-warning'}`} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: blog.status === 'published' ? '#e2f4e8' : '#fff4e5', color: blog.status === 'published' ? '#2e7d32' : '#b78103' }}>
                      {blog.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', color: '#6b665e' }}>
                    {new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(blog)}>✎ Edit</button>
                      {isAdmin && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--maroon)' }} onClick={() => handleDelete(blog._id)}>✕ Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && editingBlog && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid #f0ebe4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f5ede6', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--maroon)', fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
                {editingBlog._id ? 'Edit Journal Article' : 'Write Journal Article'}
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '1.2rem' }}>✕</button>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Article Title</label>
              <input
                className="form-input"
                type="text"
                value={editingBlog.title}
                onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value })}
                placeholder="e.g. 5 Wardrobe Essentials for the Summer Season"
                disabled={!isAdmin}
              />
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Author Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={editingBlog.author}
                  onChange={e => setEditingBlog({ ...editingBlog, author: e.target.value })}
                  placeholder="Meloraa Editorial"
                  disabled={!isAdmin}
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Status</label>
                <select
                  className="form-input"
                  value={editingBlog.status}
                  onChange={e => setEditingBlog({ ...editingBlog, status: e.target.value })}
                  disabled={!isAdmin}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Tags (comma-separated)</label>
              <input
                className="form-input"
                type="text"
                value={editingBlog.tags}
                onChange={e => setEditingBlog({ ...editingBlog, tags: e.target.value })}
                placeholder="fashion, styling, summer, luxury"
                disabled={!isAdmin}
              />
            </div>

            {/* Cover Image Upload */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Cover Banner Image</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  type="text"
                  value={editingBlog.coverImage}
                  onChange={e => setEditingBlog({ ...editingBlog, coverImage: e.target.value })}
                  placeholder="Image URL (http...)"
                  style={{ flex: 1 }}
                  disabled={!isAdmin}
                />
                {isAdmin && (
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-outline" disabled={uploading}>
                      {uploading ? 'Uploading...' : '📁 Upload File'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleUpload(e.target.files[0])}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>
              {editingBlog.coverImage && (
                <img
                  src={editingBlog.coverImage}
                  alt="Cover Preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #f0ebe4', marginTop: '12px' }}
                />
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Excerpt / Short Description</label>
              <textarea
                className="form-input"
                rows="2"
                value={editingBlog.excerpt}
                onChange={e => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                placeholder="A brief summary of the article shown in the listing view..."
                disabled={!isAdmin}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Rich Content / Body</label>
              <textarea
                className="form-input"
                rows="12"
                value={editingBlog.content}
                onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })}
                placeholder="Write the full content of the journal article here..."
                style={{ fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.6' }}
                disabled={!isAdmin}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f5ede6', paddingTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
