import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { blogAPI } from '../utils/api';
import '../styles/pages.css';

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page')) || 1;
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Sidebar states
  const [allTags, setAllTags] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    loadBlogs();
  }, [page, tag, search]);

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 5 };
      if (tag) params.tag = tag;
      if (search) params.search = search;
      const res = await blogAPI.getBlogs(params);
      setPosts(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalPosts(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarData = async () => {
    try {
      // Fetch tags
      const tagRes = await blogAPI.getBlogTags();
      setAllTags(tagRes.data.data || []);

      // Fetch recent posts
      const recentRes = await blogAPI.getBlogs({ page: 1, limit: 5 });
      setRecentPosts(recentRes.data.data || []);
    } catch (err) {
      console.error('Failed to load sidebar data:', err);
    }
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (t) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tag', t);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Header />
      
      {/* Blog Hero */}
      <section className="page-hero">
        <h1 style={{ color: '#ffffff !important', marginBottom: '8px' }}>The Journal</h1>
        <p style={{ letterSpacing: '0.12em' }}>Fashion, Trends, and Styling from Meloraa</p>
      </section>

      {/* Main Two-Column Layout */}
      <div className="blog-two-col-container">
        <div className="blog-two-col">
          
          {/* Left Sidebar */}
          <aside className="blog-sidebar">
            
            {/* Recent Posts Widget */}
            <div className="sidebar-widget">
              <h3 className="widget-title">RECENT POSTS</h3>
              <div className="recent-posts-list">
                {recentPosts.map(p => (
                  <div key={p._id} className="recent-post-card">
                    <Link to={`/journal/${p.slug}`} className="recent-post-thumb">
                      {p.coverImage ? (
                        <img src={p.coverImage} alt={p.title} />
                      ) : (
                        <div className="thumb-fallback">📰</div>
                      )}
                    </Link>
                    <div className="recent-post-info">
                      <h4 className="recent-post-title">
                        <Link to={`/journal/${p.slug}`}>{p.title}</Link>
                      </h4>
                      <span className="recent-post-date">
                        {new Date(p.publishedAt || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Widget */}
            <div className="sidebar-widget">
              <h3 className="widget-title">SEARCH</h3>
              <form onSubmit={handleSearchSubmit} className="sidebar-search-form">
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  value={searchInput} 
                  onChange={(e) => setSearchInput(e.target.value)} 
                />
                <button type="submit">🔍</button>
              </form>
            </div>

          </aside>

          {/* Right Main Content */}
          <main className="blog-main-content">
            
            {/* Filter tags header */}
            {(tag || search) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '32px', background: '#faf6f2', padding: '16px 24px', borderRadius: '8px', border: '1px solid #f0ebe4' }}>
                <span style={{ fontSize: '0.95rem', color: '#444' }}>
                  {tag && <span>Showing articles tagged with: <strong>#{tag}</strong></span>}
                  {tag && search && <span> and </span>}
                  {search && <span>matching search: <strong>"{search}"</strong></span>}
                </span>
                <button 
                  onClick={handleClearFilters} 
                  style={{ background: 'var(--maroon)', color: '#fff', border: 0, borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--maroon)' }} />
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '80px 24px', background: '#faf8f6', borderRadius: '12px', border: '1px solid #f0ebe4' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📰</div>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.5rem', marginBottom: '8px' }}>No Articles Found</h2>
                <p style={{ color: '#8c857d' }}>We couldn't find any articles matching your criteria.</p>
              </div>
            ) : (
              <>
                {/* Stacked Articles List */}
                <div className="blog-stacked-list">
                  {posts.map(post => (
                    <article key={post._id} className="blog-post-card">
                      
                      {/* 1. Tags Header */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="blog-post-card-category">
                          {post.tags.map((t, idx) => (
                            <span key={t}>
                              <Link to={`/journal?tag=${t}`}>{t.toUpperCase()}</Link>
                              {idx < post.tags.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 2. Title */}
                      <h2 className="blog-post-card-title">
                        <Link to={`/journal/${post.slug}`}>{post.title}</Link>
                      </h2>

                      {/* 3. Metadata */}
                      <div className="blog-post-card-meta">
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>Posted by {post.author}</span>
                        {post.tags && post.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>Posted in {post.tags.join(', ')}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>0 comments</span>
                      </div>

                      {/* 4. Banner Image */}
                      <Link to={`/journal/${post.slug}`} className="blog-post-card-banner">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt={post.title} />
                        ) : (
                          <div className="banner-fallback">📰</div>
                        )}
                      </Link>

                      {/* 5. Excerpt / Short Description */}
                      <div className="blog-post-card-excerpt">
                        <p>{post.excerpt || post.content?.replace(/[#*`>_\-]/g, '').substring(0, 240) + '...'}</p>
                      </div>

                      {/* 6. Read More Button */}
                      <div className="blog-post-card-action">
                        <Link to={`/journal/${post.slug}`} className="btn-read-more-black">
                          READ MORE
                        </Link>
                      </div>

                    </article>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="blog-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginTop: '48px' }}>
                    <button 
                      disabled={page === 1} 
                      onClick={() => handlePageChange(page - 1)} 
                      className="btn btn-outline" 
                      style={{ padding: '8px 16px', minWidth: 'auto' }}
                    >
                      &larr; Prev
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#6b665e', margin: '0 12px' }}>Page {page} of {totalPages}</span>
                    <button 
                      disabled={page === totalPages} 
                      onClick={() => handlePageChange(page + 1)} 
                      className="btn btn-outline" 
                      style={{ padding: '8px 16px', minWidth: 'auto' }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </>
            )}

          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
}
