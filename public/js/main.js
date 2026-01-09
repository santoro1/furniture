// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Favour Furniture website loaded');
    
    // Add click event to wishlist buttons (placeholder)
    const wishlistButtons = document.querySelectorAll('.btn-wishlist');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Please login to like products');
        });
    });
});