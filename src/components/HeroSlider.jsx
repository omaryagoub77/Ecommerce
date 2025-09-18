import React, { useEffect, useRef, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { WifiOff, ChevronLeft, ChevronRight } from "lucide-react";
import "./HeroSlider.css";

const HeroSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Fetch slides from Firebase
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        setLoading(true);
        setError(null);
        const querySnapshot = await getDocs(collection(db, "heroes"));
        const heroList = querySnapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setSlides(heroList);
      } catch (error) {
        console.error("Error fetching heroes:", error);
        setError("Failed to load slides. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchHeroes();
  }, []);

  // Auto-slide management with Page Visibility API
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 5000);
  }, []);

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetAutoSlide = useCallback(() => {
    stopAutoSlide();
    startAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  // Handle Page Visibility API - FIXES TAB SWITCHING ISSUE
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoSlide();
      } else if (slides.length > 0) {
        startAutoSlide();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [slides.length, startAutoSlide, stopAutoSlide]);

  // Start auto-slide once, after slides are loaded
  useEffect(() => {
    if (slides.length === 0) return;
    startAutoSlide();
    return () => stopAutoSlide();
  }, [slides.length, startAutoSlide, stopAutoSlide]);

  // Navigation functions with useCallback for performance
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
    resetAutoSlide();
  }, [resetAutoSlide]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => prev - 1);
    resetAutoSlide();
  }, [resetAutoSlide]);

  // Handle infinite loop transitions
  const handleTransitionEnd = useCallback(() => {
    if (!slides.length) return;
    
    if (currentIndex === slides.length + 1) {
      setTransitionEnabled(false);
      setCurrentIndex(1);
    }
    if (currentIndex === 0) {
      setTransitionEnabled(false);
      setCurrentIndex(slides.length);
    }
  }, [currentIndex, slides.length]);

  // Re-enable transitions after instant jump
  useEffect(() => {
    if (!transitionEnabled) {
      const timeoutId = setTimeout(() => setTransitionEnabled(true), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [transitionEnabled]);

  // Loading state
  if (loading) {
    return (
      <div className="hero-slider">
        <div className="slider-loading">
          <div className="loading-skeleton"></div>
          <div className="loading-text">Loading slides...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="hero-slider">
        <div className="slider-error">
          <WifiOff size={48} />
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No slides state
  if (!slides.length) {
    return (
      <div className="hero-slider">
        <div className="slider-empty">
          <WifiOff size={48} />
          <p>No slides available</p>
        </div>
      </div>
    );
  }

  const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

  return (
    <div className="hero-slider">
      <div
        className="slides-container"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: transitionEnabled ? "transform 0.8s ease-in-out" : "none",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, index) => (
          <div className="slide" key={`${slide.id}-${index}`}>
            <img
              src={slide.image}
              alt={slide.title || "Hero"}
              className="slide-image"
              loading={index <= 2 ? "eager" : "lazy"} // Optimize loading
            />
            <div className="slide-overlay">
              <div className="slide-content">
                <h2 className="slide-title">{slide.title}</h2>
                {slide.description && (
                  <p className="slide-description">{slide.description}</p>
                )}
                {slide.subtitle && (
                  <button  onClick={() => {
        const section = document.getElementById(`men-section`);
        section?.scrollIntoView({ behavior: "smooth" });
      }}
       className="slide-subtitle  hero-btn">{slide.subtitle}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button 
        className="nav-btn nav-btn--left" 
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        className="nav-btn nav-btn--right" 
        onClick={goToNext}
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide indicators */}
      <div className="slide-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${
              (currentIndex - 1 + slides.length) % slides.length === index 
                ? 'indicator--active' 
                : ''
            }`}
            onClick={() => {
              setCurrentIndex(index + 1);
              resetAutoSlide();
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;