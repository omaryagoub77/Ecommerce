import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { WifiOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useGesture } from "@use-gesture/react";

import "./HeroSlider.css";

const HeroSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const intervalRef = useRef(null);
  const preloadedImages = useRef(new Set());

  // Fetch slides from Firebase
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        setError(null);
        const querySnapshot = await getDocs(collection(db, "heroes"));
        const slideData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSlides(slideData);
      } catch (err) {
        console.error("Error fetching slides:", err);
        setError("Failed to load slides. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Detect touch devices
  useEffect(() => {
    const checkTouch = () => {
      const touchCapable =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;

      setIsTouchDevice(touchCapable);
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Auto slide logic
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      safeIncrementIndex();
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
    setCurrentIndex((prev) => (prev >= slides.length + 1 ? 1 : prev + 1));
  }, [slides.length]);

  const safeDecrementIndex = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? slides.length : prev - 1));
  }, [slides.length]);

  const handleTransitionEnd = () => {
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
  };

  useEffect(() => {
    if (!transitionEnabled) {
      const timer = setTimeout(() => setTransitionEnabled(true), 50);
      return () => clearTimeout(timer);
    }
  }, [transitionEnabled]);

  // Indicator click
  const handleIndicatorClick = (index) => {
    setCurrentIndex(index + 1);
    resetAutoSlide();
  };

  // Scroll to section
  const scrollToMenSection = () => {
    const section = document.getElementById("men-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // Preload next image safely
  useEffect(() => {
    if (slides.length > 0) {
      const nextImage = slides[currentIndex % slides.length]?.image;
      if (nextImage && !preloadedImages.current.has(nextImage)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = nextImage;
        document.head.appendChild(link);
        preloadedImages.current.add(nextImage);
      }
    }
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
  const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

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
      {...(isTouchDevice ? bind() : {})}
      className="hero-slider"
      role="region"
      aria-label="Hero Image Slider"
      aria-live="polite"
    >
      <div
        className={`slides-container ${!transitionEnabled ? "no-transition" : ""}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, index) => (
          <div
            className="slide"
            key={`${slide?.id || "placeholder"}-${index}`}
            aria-hidden={index !== currentIndex}
          >
            <img
              src={slide?.image}
              alt={slide?.title || "Slide"}
              className="slide-image"
              loading={index <= 2 ? "eager" : "lazy"}
            />
            <div className="slide-overlay">
              <div className="slide-content">
                <h2 className="slide-title">{slide?.title}</h2>
                {slide?.description && (
                  <p className="slide-description">{slide.description}</p>
                )}
                {slide?.buttonText && (
                  <button
                    className="slide-subtitle hero-btn"
                    onClick={scrollToMenSection}
                  >
                    {slide.buttonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation (hidden on mobile if desired via CSS) */}
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

export default HeroSlider;
