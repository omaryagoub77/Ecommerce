import { collection, getDocs, query, limit, startAfter, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// import { getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import cache from './cache';

// Firebase service with caching
class FirebaseService {
  constructor() {
    this.cache = cache;
  }

  // Generate cache key for queries
  generateCacheKey(collectionName, filters = {}) {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${collectionName}:${filterStr}`;
  }

  // Optimized fetch with caching
  async fetchProducts(filters = {}) {
    const cacheKey = this.generateCacheKey('products', filters);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit for:', cacheKey);
      return this.cache.get(cacheKey);
    }

    try {
      let q = collection(db, 'products');
      
      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.searchQuery) {
        q = query(q, 
          where('name', '>=', filters.searchQuery),
          where('name', '<=', filters.searchQuery + '\\uf8ff')
        );
      }
      
      // Add pagination
      if (filters.lastVisible) {
        q = query(q, startAfter(filters.lastVisible), limit(filters.pageSize || 12));
      } else {
        q = query(q, limit(filters.pageSize || 12));
      }
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      const result = {
        products,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === (filters.pageSize || 12)
      };
      
      // Cache the result (cache for 2 minutes for products)
      this.cache.set(cacheKey, result, 120000);
      console.log('Cache miss, fetched and cached:', cacheKey);
      
      return result;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Fetch hero slides with caching
  async fetchHeroSlides() {
    const cacheKey = 'heroes:all';
    
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit for hero slides');
      return this.cache.get(cacheKey);
    }

    try {
      const q = query(collection(db, 'heroes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const slides = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Cache hero slides for 10 minutes (they change less frequently)
      this.cache.set(cacheKey, slides, 600000);
      console.log('Cache miss, fetched and cached hero slides');
      
      return slides;
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      throw error;
    }
  }

  // Preload next page of products
  async preloadNextPage(filters) {
    if (!filters.lastVisible) return;
    
    const nextPageFilters = {
      ...filters,
      lastVisible: filters.lastVisible
    };
    
    // Preload in background without waiting
    setTimeout(() => {
      this.fetchProducts(nextPageFilters).catch(console.error);
    }, 1000);
  }

  // Clear cache (useful for refresh)
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size(),
      entries: Array.from(this.cache.cache.keys())
    };
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

export default firebaseService;