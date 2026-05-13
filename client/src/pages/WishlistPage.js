import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleWishlist, addToCart, openCart } from '../store';
import Header from '../components/Header';
import '../styles/wishlist.css';

export default function WishlistPage() {
    const dispatch = useDispatch();
    const { items } = useSelector(s => s.wishlist);

    const addToCartHandler = (product) => {
        dispatch(addToCart({
            _id: product._id,
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || product.image,
        }));
        dispatch(openCart());
    };

    return (
        <>
            <Header />
            <div className="wishlist-container">
                <div className="page-header wishlist-header">
                    <h1 className="wishlist-title">My Wishlist</h1>
                    <p className="wishlist-count">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
                </div>

                {items.length === 0 ? (
                    <div className="card wishlist-empty-state">
                        <div className="wishlist-empty-icon">♡</div>
                        <h3 className="wishlist-empty-title">Your wishlist is empty</h3>
                        <p className="wishlist-empty-text">Save items you love to buy them later.</p>
                        <Link to="/" className="btn btn-gold">Browse Products</Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {items.map(product => (
                            <div key={product._id} className="card wishlist-card">
                                {/* Remove button */}
                                <button onClick={() => dispatch(toggleWishlist(product))}
                                    className="wishlist-remove-btn"
                                    title="Remove from wishlist">♥</button>

                                <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="wishlist-image-container">
                                        <img src={product.images?.[0] || product.image || '/placeholder.jpg'} alt={product.name}
                                            className="wishlist-image" />
                                    </div>
                                </Link>

                                <div className="wishlist-info">
                                    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3 className="wishlist-product-name">{product.name}</h3>
                                    </Link>
                                    <div className="wishlist-action-row">
                                        <span className="wishlist-price">
                                            ₹{Number(product.price).toLocaleString('en-IN')}
                                        </span>
                                        <button onClick={() => { addToCartHandler(product); dispatch(toggleWishlist(product)); }}
                                            className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
                                            🛒 Move to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
