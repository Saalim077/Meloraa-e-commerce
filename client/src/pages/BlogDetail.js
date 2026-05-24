import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { blogAPI } from '../utils/api';
import '../styles/pages.css';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Sidebar states
  const [allTags, setAllTags] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadBlog();
  }, [slug]);

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadBlog = async () => {
    setLoading(true);
    try {
      const res = await blogAPI.getBlog(slug);
      setPost(res.data.data);
      setError(false);
    } catch (err) {
      console.error('Failed to load blog post:', err);
      setError(true);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/journal?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const renderContent = (text) => {
    if (!text) return '';
    return text.split('\n\n').map((paragraph, index) => {
      const p = paragraph.trim();
      if (!p) return null;

      if (p.startsWith('###')) {
        return <h4 key={index} style={{ color: '#1a1a1a', fontSize: '1.2rem', marginTop: '24px', marginBottom: '12px', fontWeight: '600' }}>{p.replace(/#/g, '').trim()}</h4>;
      }
      if (p.startsWith('##') || p.startsWith('#')) {
        return <h3 key={index} style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.45rem', marginTop: '30px', marginBottom: '14px', fontWeight: '600' }}>{p.replace(/#/g, '').trim()}</h3>;
      }

      if (p.startsWith('>')) {
        return (
          <blockquote key={index} style={{ borderLeft: '4px solid var(--maroon)', paddingLeft: '20px', margin: '24px 0', fontSize: '1.1rem', fontStyle: 'italic', color: '#6b665e' }}>
            {p.substring(1).trim()}
          </blockquote>
        );
      }

      if (p.startsWith('- ') || p.startsWith('* ')) {
        const items = p.split(/\n[-*]\s+/).map((item, i) => {
          const cleanItem = i === 0 ? item.replace(/^[-*]\s+/, '') : item;
          return <li key={i} style={{ marginBottom: '8px' }}>{cleanItem.trim()}</li>;
        });
        return <ul key={index} style={{ paddingLeft: '24px', marginBottom: '20px', color: '#444', lineHeight: '1.8' }}>{items}</ul>;
      }

      return <p key={index} style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#444', marginBottom: '20px' }}>{p}</p>;
    });
  };

  if (loading) {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--maroon)' }} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Header />
      
      {/* Blog Details Header */}
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
            
            {error || !post ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '80px 24px', background: '#faf8f6', borderRadius: '12px', border: '1px solid #f0ebe4' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--maroon)', fontSize: '1.5rem', marginBottom: '8px' }}>Article Not Found</h2>
                <p style={{ color: '#8c857d', marginBottom: '24px' }}>The journal post you are looking for does not exist or has been removed.</p>
                <Link to="/journal" className="btn btn-primary">Back to Journal</Link>
              </div>
            ) : (
              <article className="blog-detail-article">
                
                {/* Back to Journal Link */}
                <Link to="/journal" className="back-to-journal-link">
                  &larr; Back to Journal
                </Link>

                {/* Post Title */}
                <h1 className="blog-detail-title">{post.title}</h1>

                {/* Metadata */}
                <div className="blog-post-card-meta" style={{ marginBottom: '28px' }}>
                  <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>Posted by {post.author}</span>
                  <span>•</span>
                  <span>0 comments</span>
                </div>

                {/* Banner Image */}
                <div className="blog-detail-banner">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} />
                  ) : (
                    <div className="banner-fallback">📰</div>
                  )}
                </div>

                {/* Article Body */}
                <div className="article-body">
                  {renderContent(post.content)}
                </div>

                {/* Tags List */}
                {post.tags && post.tags.length > 0 && (
                  <div className="blog-detail-tags">
                    <span style={{ fontSize: '0.9rem', color: '#8c857d', fontWeight: '600' }}>Tags: </span>
                    {post.tags.map((t, idx) => (
                      <Link key={t} to={`/journal?tag=${t}`} className="blog-detail-tag-btn">
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}

              </article>
            )}

          </main>

        </div>
      </div>

      <Footer />
    </div>
  );
}
