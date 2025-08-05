import React from 'react';

const ProductList = ({ products, addToCart }) => {
  return (
    <section id="products">
      <h2>Products</h2>
      <div className="product-container">
        {products.map(product => (
          <div key={product.id} className="product">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price.toFixed(2)}</p>
            <button onClick={() => addToCart(product.id)} className="add-to-cart">Add to Cart</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductList;
