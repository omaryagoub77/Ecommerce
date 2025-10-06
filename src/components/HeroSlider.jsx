import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { WifiOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useGesture } from "@use-gesture/react";
import "./HeroSlider.css";

// Memoized slide component to prevent unnecessary re-renders
const Slide = memo(({ slide, isActive, isEager, scrollToMenSection }) => {
  return (
    <div className="slide" aria-hidden={!isActive}>
      <img
        src={slide.image}
        alt={slide.title || "Slide"}
        className="slide-image"
        loading={isEager ? "eager" : "lazy"}
        
      />
      <div className="slide-overlay">
        <div className="slide-content">
          <h2 className="slide-title">{slide.title}</h2>
          {slide.description && (
            <p className="slide-description">{slide.description}</p>
          )}
          {slide.buttonText && (
            <button className="slide-subtitle hero-btn" onClick={scrollToMenSection}>
              {slide.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const HeroSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const intervalRef = useRef(null);
  const preloadedImages = useRef(new Set());
  const sliderRef = useRef(null);

  // Real-time fetch slides from Firebase with ordering
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Create query to order by createdAt descending (newest first)
    const q = query(collection(db, "heroes"), orderBy("createdAt", "desc"));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const slideData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSlides(slideData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching slides:", err);
        setError("Failed to load slides. Please try again.");
        setLoading(false);
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Detect touch devices
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches
      );
    };
    
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Optimized auto slide logic
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev >= slides.length + 1 ? 1 : prev + 1));
    }, 5000);
  }, [slides.length]);

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

  // Pause on hover
  const handleMouseEnter = useCallback(() => {
    stopAutoSlide();
  }, [stopAutoSlide]);

  const handleMouseLeave = useCallback(() => {
    startAutoSlide();
  }, [startAutoSlide]);

  useEffect(() => {
    if (slides.length > 0) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [slides.length, startAutoSlide, stopAutoSlide]);

  // Pause on tab switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopAutoSlide();
      } else if (slides.length > 0) {
        startAutoSlide();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [slides.length, startAutoSlide, stopAutoSlide]);

  // Navigation handlers
  const safeIncrementIndex = useCallback(() => {
    setCurrentIndex(prev => (prev >= slides.length + 1 ? 1 : prev + 1));
  }, [slides.length]);

  const safeDecrementIndex = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? slides.length : prev - 1));
  }, [slides.length]);

  const handleTransitionEnd = useCallback(() => {
    if (currentIndex === slides.length + 1) {
      requestAnimationFrame(() => {
        setTransitionEnabled(false);
        setCurrentIndex(1);
      });
    } else if (currentIndex === 0) {
      requestAnimationFrame(() => {
        setTransitionEnabled(false);
        setCurrentIndex(slides.length);
      });
    }
  }, [currentIndex, slides.length]);

  useEffect(() => {
    if (!transitionEnabled) {
      const timer = setTimeout(() => setTransitionEnabled(true), 50);
      return () => clearTimeout(timer);
    }
  }, [transitionEnabled]);

  // Indicator click
  const handleIndicatorClick = useCallback((index) => {
    setCurrentIndex(index + 1);
    resetAutoSlide();
  }, [resetAutoSlide]);

  // Scroll to section
  const scrollToMenSection = useCallback(() => {
    const section = document.getElementById("men-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Optimized image preloading
  useEffect(() => {
    if (slides.length === 0) return;
    
    // Preload current, next, and previous images
    const preloadImages = [currentIndex - 1, currentIndex, currentIndex + 1].map(index => {
      const slideIndex = ((index % slides.length) + slides.length) % slides.length;
      return slides[slideIndex]?.image;
    }).filter(Boolean);
    
    preloadImages.forEach(imageUrl => {
      if (imageUrl && !preloadedImages.current.has(imageUrl)) {
        const img = new Image();
        img.src = imageUrl;
        preloadedImages.current.add(imageUrl);
      }
    });
  }, [currentIndex, slides]);

  // Swipe gesture binding (only for touch devices)
  const bind = useGesture(
    {
      onDragEnd: ({ swipe: [swipeX] }) => {
        if (swipeX === -1) {
          safeIncrementIndex();
          resetAutoSlide();
        } else if (swipeX === 1) {
          safeDecrementIndex();
          resetAutoSlide();
        }
      },
    },
    {
      enabled: isTouchDevice, // Only enable gestures on touch devices
      drag: {
        threshold: 30,
        axis: "x",
        swipe: {
          velocity: 0.3,
          distance: 50,
        },
      },
    }
  );

  // Extended slides for infinite loop
  const extendedSlides = slides.length > 0 
    ? [slides[slides.length - 1], ...slides, slides[0]]
    : [];

  // Loading state
  if (loading) {
    return (
      <div className="hero-slider">
        <div className="slider-loading">
          <div className="loading-skeleton" />
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
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No slides
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

  return (
    <div
      {...bind()}
      className="hero-slider"
      role="region"
      aria-label="Hero Image Slider"
      aria-live="polite"
      ref={sliderRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`slides-container ${!transitionEnabled ? "no-transition" : ""}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, index) => {
          // Determine if this slide should be eager loaded
          const isEager = index <= 2 || index === extendedSlides.length - 1;
          const isActive = index === currentIndex;
          
          return (
            <Slide
              key={`${slide.id}-${index}`}
              slide={slide}
              isActive={isActive}
              isEager={isEager}
              scrollToMenSection={scrollToMenSection}
            />
          );
        })}
      </div>

      {/* Navigation buttons */}
      <button
        className="nav-btn nav-btn--left"
        onClick={() => {
          safeDecrementIndex();
          resetAutoSlide();
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="nav-btn nav-btn--right"
        onClick={() => {
          safeIncrementIndex();
          resetAutoSlide();
        }}
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="slide-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${
              (currentIndex - 1 + slides.length) % slides.length === index
                ? "indicator--active"
                : ""
            }`}
            onClick={() => handleIndicatorClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(HeroSlider);