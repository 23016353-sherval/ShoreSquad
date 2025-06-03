// ===== SHORESQUAD APP JAVASCRIPT =====
// Modern ES6+ JavaScript for interactive beach cleanup coordination

// ===== APP CONFIGURATION =====
const CONFIG = {
  // API endpoints (placeholder for future backend integration)
  API_BASE_URL: 'https://api.shoresquad.com',
  WEATHER_API_KEY: 'your-weather-api-key', // Replace with actual API key
  MAPS_API_KEY: 'your-maps-api-key', // Replace with actual Google Maps API key
  
  // App settings
  DEFAULT_LOCATION: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  CLEANUP_RADIUS: 50, // kilometers
  
  // Animation settings
  SCROLL_OFFSET: 100,
  DEBOUNCE_DELAY: 250,
  ANIMATION_DURATION: 300
};

// ===== UTILITY FUNCTIONS =====
class Utils {
  // Debounce function for performance optimization
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function for scroll events
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Format date for events
  static formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  // Format time for events
  static formatTime(time) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(time));
  }

  // Show loading spinner
  static showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.classList.add('active');
      spinner.setAttribute('aria-hidden', 'false');
    }
  }

  // Hide loading spinner
  static hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.classList.remove('active');
      spinner.setAttribute('aria-hidden', 'true');
    }
  }

  // Show notification (basic implementation)
  static showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-secondary)' : 'var(--color-primary)'};
      color: white;
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      z-index: var(--z-tooltip);
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ===== NAVIGATION CONTROLLER =====
class Navigation {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.navToggle = document.querySelector('.nav-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupScrollEffects();
    this.setupSmoothScrolling();
  }

  setupEventListeners() {
    // Mobile menu toggle
    if (this.navToggle) {
      this.navToggle.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Close mobile menu when clicking nav links
    this.navLinks.forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.navbar.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Handle escape key for mobile menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileMenu();
      }
    });
  }

  setupScrollEffects() {
    const handleScroll = Utils.throttle(() => {
      const scrolled = window.pageYOffset > 50;
      this.navbar.style.background = scrolled 
        ? 'rgba(255, 255, 255, 0.98)' 
        : 'rgba(255, 255, 255, 0.95)';
      this.navbar.style.boxShadow = scrolled 
        ? 'var(--shadow-lg)' 
        : 'none';
    }, 16);

    window.addEventListener('scroll', handleScroll);
  }

  setupSmoothScrolling() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  toggleMobileMenu() {
    const isOpen = this.navMenu.classList.contains('active');
    
    if (isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    this.navMenu.classList.add('active');
    this.navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Prevent scroll
    
    // Animate hamburger menu
    const spans = this.navToggle.querySelectorAll('span');
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
  }

  closeMobileMenu() {
    this.navMenu.classList.remove('active');
    this.navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // Restore scroll
    
    // Reset hamburger menu
    const spans = this.navToggle.querySelectorAll('span');
    spans.forEach(span => {
      span.style.transform = '';
      span.style.opacity = '';
    });
  }
}

// ===== WEATHER SERVICE =====
class WeatherService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.baseUrl = 'https://api.data.gov.sg/v1/environment';
  }

  async getWeather(lat, lng) {
    const cacheKey = `current_${lat}_${lng}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Get real-time temperature from NEA API
      const tempResponse = await fetch(`${this.baseUrl}/air-temperature`);
      const tempData = await tempResponse.json();
      
      // Get 24-hour forecast from NEA API
      const forecastResponse = await fetch(`${this.baseUrl}/24-hour-weather-forecast`);
      const forecastData = await forecastResponse.json();
      
      const weather = this.processCurrentWeather(tempData, forecastData);
      
      this.cache.set(cacheKey, {
        data: weather,
        timestamp: Date.now()
      });
      
      return weather;
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getMockWeather(); // Fallback to mock data
    }
  }

  async get4DayForecast() {
    const cacheKey = '4day_forecast';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/4-day-weather-forecast`);
      const data = await response.json();
      
      const forecast = this.process4DayForecast(data);
      
      this.cache.set(cacheKey, {
        data: forecast,
        timestamp: Date.now()
      });
      
      return forecast;
    } catch (error) {
      console.error('4-day forecast error:', error);
      return this.getMock4DayForecast();
    }
  }

  processCurrentWeather(tempData, forecastData) {
    // Get average temperature from multiple stations
    let totalTemp = 0;
    let stationCount = 0;
    
    if (tempData.items && tempData.items[0] && tempData.items[0].readings) {
      tempData.items[0].readings.forEach(reading => {
        if (reading.value) {
          totalTemp += reading.value;
          stationCount++;
        }
      });
    }
    
    const avgTemp = stationCount > 0 ? Math.round(totalTemp / stationCount) : 28;
    
    // Get current forecast from 24-hour data
    let condition = 'Partly Cloudy';
    let humidity = { low: 60, high: 85 };
    let wind = { direction: 'Variable', speed: 'Light' };
    
    if (forecastData.items && forecastData.items[0]) {
      const general = forecastData.items[0].general;
      if (general) {
        condition = general.forecast || condition;
        humidity = general.relative_humidity || humidity;
        
        if (general.temperature) {
          // Use forecast temp range if available
        }
      }
    }
    
    return {
      temperature: avgTemp,
      condition: condition,
      humidity: humidity,
      wind: wind,
      cleanupFriendly: !condition.toLowerCase().includes('thundery') && 
                      !condition.toLowerCase().includes('heavy')
    };
  }

  process4DayForecast(data) {
    if (!data.items || !data.items[0] || !data.items[0].forecasts) {
      return this.getMock4DayForecast();
    }

    return data.items[0].forecasts.map(forecast => ({
      date: forecast.date,
      day: this.getDayName(forecast.date),
      condition: forecast.forecast,
      temperature: {
        low: forecast.temperature.low,
        high: forecast.temperature.high
      },
      humidity: forecast.relative_humidity,
      wind: forecast.wind,
      icon: this.getWeatherIcon(forecast.forecast),
      cleanupFriendly: !forecast.forecast.toLowerCase().includes('thundery') && 
                      !forecast.forecast.toLowerCase().includes('heavy')
    }));
  }

  getDayName(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }

  getWeatherIcon(condition) {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('thunder')) {
      return 'fas fa-cloud-bolt';
    } else if (lowerCondition.includes('showers') || lowerCondition.includes('rain')) {
      return 'fas fa-cloud-rain';
    } else if (lowerCondition.includes('cloudy')) {
      return 'fas fa-cloud';
    } else if (lowerCondition.includes('fair') || lowerCondition.includes('sunny')) {
      return 'fas fa-sun';
    } else {
      return 'fas fa-cloud-sun';
    }
  }

  getMockWeather() {
    return {
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: { low: 60, high: 85 },
      wind: { direction: 'SW', speed: 'Light' },
      cleanupFriendly: true
    };
  }

  getMock4DayForecast() {
    const today = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const date = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        day: this.getDayName(date.toISOString().split('T')[0]),
        condition: 'Partly Cloudy',
        temperature: { low: 24, high: 32 },
        humidity: { low: 60, high: 85 },
        wind: { direction: 'SW', speed: 'Light' },
        icon: 'fas fa-cloud-sun',
        cleanupFriendly: true
      };
    });
  }
}

// ===== EVENT MANAGER =====
class EventManager {
  constructor() {
    this.events = [];
    this.filters = {
      location: 'all',
      date: 'all',
      type: 'all'
    };
    
    this.loadMockEvents();
  }

  loadMockEvents() {
    // Mock event data for demo purposes
    this.events = [
      {
        id: 1,
        title: 'Santa Monica Beach Cleanup',
        location: 'Santa Monica, CA',
        date: '2025-06-15',
        time: '09:00',
        duration: 180, // minutes
        attendees: 24,
        description: 'Join us for a morning of beach cleaning and ocean conservation. All supplies provided!',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop',
        coordinates: { lat: 34.0195, lng: -118.4912 },
        organizer: 'LA Beach Squad'
      },
      {
        id: 2,
        title: 'Malibu Sunset Cleanup',
        location: 'Malibu, CA',
        date: '2025-06-22',
        time: '17:00',
        duration: 180,
        attendees: 18,
        description: 'Clean the beach as the sun sets! Perfect for those epic golden hour photos.',
        image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=200&fit=crop',
        coordinates: { lat: 34.0259, lng: -118.7798 },
        organizer: 'Sunset Squad'
      },
      {
        id: 3,
        title: 'Venice Beach Squad Meetup',
        location: 'Venice, CA',
        date: '2025-06-29',
        time: '10:00',
        duration: 180,
        attendees: 42,
        description: 'Monthly squad meetup with beach cleanup, games, and good vibes. New members welcome!',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
        coordinates: { lat: 33.9850, lng: -118.4695 },
        organizer: 'Venice Eco Warriors'
      }
    ];
  }

  getEvents(filters = {}) {
    let filteredEvents = [...this.events];
    
    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        filteredEvents = filteredEvents.filter(event => {
          // Implement filtering logic based on the filter type
          return true; // Placeholder
        });
      }
    });
    
    return filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  joinEvent(eventId) {
    Utils.showLoading();
    
    // Simulate API call
    setTimeout(() => {
      const event = this.events.find(e => e.id === eventId);
      if (event) {
        event.attendees += 1;
        Utils.showNotification(`Successfully joined "${event.title}"!`, 'success');
        this.updateEventDisplay(event);
      } else {
        Utils.showNotification('Event not found.', 'error');
      }
      Utils.hideLoading();
    }, 1000);
  }

  updateEventDisplay(event) {
    const eventCard = document.querySelector(`[data-event-id="${event.id}"]`);
    if (eventCard) {
      const attendeeCount = eventCard.querySelector('.attendee-count');
      if (attendeeCount) {
        attendeeCount.textContent = `${event.attendees} going`;
      }
    }
  }
}

// ===== ANIMATION CONTROLLER =====
class AnimationController {
  constructor() {
    this.observedElements = new Set();
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupParallaxEffects();
    this.setupHoverEffects();
  }

  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    // Observe elements that should animate in
    const animateElements = document.querySelectorAll('.feature-card, .event-card, .section-header');
    animateElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      this.observer.observe(el);
    });
  }

  setupParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.floating-card');
    
    const handleScroll = Utils.throttle(() => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach((el, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = scrolled * speed;
        el.style.transform = `translateY(${yPos}px)`;
      });
    }, 16);

    window.addEventListener('scroll', handleScroll);
  }

  setupHoverEffects() {
    // Add sophisticated hover effects to interactive elements
    const cards = document.querySelectorAll('.feature-card, .event-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        e.target.style.transform = 'translateY(-8px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', (e) => {
        e.target.style.transform = 'translateY(0) scale(1)';
      });
    });
  }
}

// ===== FORM HANDLER =====
class FormHandler {
  constructor() {
    this.forms = document.querySelectorAll('form');
    this.init();
  }

  init() {
    this.setupFormValidation();
    this.setupFormSubmission();
  }

  setupFormValidation() {
    // Real-time form validation
    const inputs = document.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    let isValid = true;
    let errorMessage = '';

    // Basic validation
    if (!value) {
      isValid = false;
      errorMessage = 'This field is required.';
    } else if (type === 'email' && !this.isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address.';
    }

    this.setFieldState(field, isValid, errorMessage);
    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  setFieldState(field, isValid, errorMessage) {
    const container = field.closest('.form-group') || field.parentElement;
    
    // Remove existing error
    const existingError = container.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add error if invalid
    if (!isValid) {
      field.classList.add('field-invalid');
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.textContent = errorMessage;
      errorEl.style.cssText = `
        color: var(--color-secondary);
        font-size: var(--text-sm);
        margin-top: var(--space-1);
      `;
      container.appendChild(errorEl);
    } else {
      field.classList.remove('field-invalid');
    }
  }

  clearFieldError(field) {
    field.classList.remove('field-invalid');
    const container = field.closest('.form-group') || field.parentElement;
    const error = container.querySelector('.field-error');
    if (error) {
      error.remove();
    }
  }

  setupFormSubmission() {
    this.forms.forEach(form => {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isFormValid = true;

    // Validate all fields
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isFormValid = false;
      }
    });

    if (isFormValid) {
      this.submitForm(form);
    } else {
      Utils.showNotification('Please fix the errors and try again.', 'error');
    }
  }

  submitForm(form) {
    Utils.showLoading();
    
    // Simulate form submission
    setTimeout(() => {
      Utils.hideLoading();
      Utils.showNotification('Thank you! Your submission has been received.', 'success');
      form.reset();
    }, 1500);
  }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupARIALabels();
    this.setupScreenReaderSupport();
  }

  setupKeyboardNavigation() {
    // Handle keyboard navigation for interactive elements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  setupFocusManagement() {
    // Enhance focus visibility
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 2px solid var(--color-primary) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupARIALabels() {
    // Ensure all interactive elements have proper ARIA labels
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        console.warn('Button without accessible label found:', button);
      }
    });
  }

  setupScreenReaderSupport() {
    // Add live region for dynamic content updates
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }

  announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
}

// ===== PERFORMANCE MONITOR =====
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    this.measurePageLoad();
    this.setupPerformanceObserver();
    this.monitorResourceUsage();
  }

  measurePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      this.metrics.pageLoad = navigation.loadEventEnd - navigation.loadEventStart;
      
      if (this.metrics.pageLoad > 3000) {
        console.warn('Page load time is slow:', this.metrics.pageLoad + 'ms');
      }
    });
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.lcp = entry.startTime;
          }
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  monitorResourceUsage() {
    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('High memory usage detected');
        }
      }, 30000); // Check every 30 seconds
    }
  }
}

// ===== MAIN APP CLASS =====
class ShoreSquadApp {
  constructor() {
    this.navigation = null;
    this.weatherService = null;
    this.eventManager = null;
    this.animationController = null;
    this.formHandler = null;
    this.accessibilityManager = null;
    this.performanceMonitor = null;
    
    this.init();
  }

  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeApp());
      } else {
        this.initializeApp();
      }
    } catch (error) {
      console.error('App initialization error:', error);
      Utils.showNotification('Sorry, there was an error loading the app.', 'error');
    }
  }

  initializeApp() {
    // Initialize all components
    this.navigation = new Navigation();
    this.weatherService = new WeatherService();
    this.eventManager = new EventManager();
    this.animationController = new AnimationController();
    this.formHandler = new FormHandler();
    this.accessibilityManager = new AccessibilityManager();
    this.performanceMonitor = new PerformanceMonitor();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load initial data
    this.loadInitialData();
    
    // Add CSS animation classes
    this.addAnimationStyles();
    
    console.log('ShoreSquad app initialized successfully! 🌊');
  }

  setupEventListeners() {
    // Event join buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn[data-action="join-event"]') || 
          e.target.closest('.btn[data-action="join-event"]')) {
        const button = e.target.matches('.btn') ? e.target : e.target.closest('.btn');
        const eventId = parseInt(button.dataset.eventId);
        this.eventManager.joinEvent(eventId);
      }
    });

    // CTA buttons
    const ctaButtons = document.querySelectorAll('.btn[data-action="start-squad"], .btn[data-action="find-events"]');
    ctaButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = button.dataset.action;
        
        if (action === 'start-squad') {
          Utils.showNotification('Squad creation feature coming soon! 🚀', 'info');
        } else if (action === 'find-events') {
          document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
  async loadInitialData() {
    try {
      // Load weather data for Singapore (since we're using NEA API)
      const weather = await this.weatherService.getWeather(1.3521, 103.8198); // Singapore coordinates
      
      this.updateWeatherDisplay(weather);
      
      // Load 4-day forecast
      const forecast = await this.weatherService.get4DayForecast();
      this.createWeatherForecastSection(forecast);
      
      // Update event join buttons with event IDs
      this.updateEventButtons();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }  updateWeatherDisplay(weather) {
    const weatherCard = document.querySelector('.weather-card span');
    if (weatherCard && weather.cleanupFriendly) {
      weatherCard.textContent = `${weather.temperature}°C - Perfect cleanup weather!`;
    }
  }

  createWeatherForecastSection(forecast) {
    // Find the next cleanup section to insert weather forecast before it
    const nextCleanupSection = document.getElementById('next-cleanup');
    if (!nextCleanupSection) return;

    // Check if weather forecast already exists
    let weatherSection = document.getElementById('weather-forecast');
    if (weatherSection) {
      weatherSection.remove();
    }

    // Create weather forecast section
    weatherSection = document.createElement('section');
    weatherSection.id = 'weather-forecast';
    weatherSection.className = 'weather-forecast';
    
    weatherSection.innerHTML = `
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">4-Day Weather Forecast</h2>
          <p class="section-subtitle">Plan your beach cleanup activities with Singapore's weather forecast</p>
        </div>
        
        <div class="forecast-grid">
          ${forecast.map(day => `
            <div class="forecast-card ${day.cleanupFriendly ? 'cleanup-friendly' : 'cleanup-warning'}">
              <div class="forecast-day">
                <h3>${day.day}</h3>
                <p class="forecast-date">${this.formatDate(day.date)}</p>
              </div>
              
              <div class="forecast-icon">
                <i class="${day.icon}" aria-hidden="true"></i>
              </div>
              
              <div class="forecast-temp">
                <span class="temp-high">${day.temperature.high}°</span>
                <span class="temp-low">${day.temperature.low}°</span>
              </div>
              
              <div class="forecast-condition">
                <p>${day.condition}</p>
              </div>
              
              <div class="forecast-details">
                <div class="detail">
                  <i class="fas fa-tint" aria-hidden="true"></i>
                  <span>${day.humidity.low}-${day.humidity.high}%</span>
                </div>
                <div class="detail">
                  <i class="fas fa-wind" aria-hidden="true"></i>
                  <span>${day.wind.direction}</span>
                </div>
              </div>
              
              <div class="cleanup-indicator">
                ${day.cleanupFriendly ? 
                  '<i class="fas fa-check-circle"></i><span>Good for cleanup</span>' : 
                  '<i class="fas fa-exclamation-triangle"></i><span>Check conditions</span>'
                }
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="weather-source">
          <p><i class="fas fa-info-circle"></i> Weather data provided by Singapore's National Environment Agency (NEA)</p>
        </div>
      </div>
    `;

    // Insert before next cleanup section
    nextCleanupSection.parentNode.insertBefore(weatherSection, nextCleanupSection);
    
    // Add animation to new elements
    const forecastCards = weatherSection.querySelectorAll('.forecast-card');
    forecastCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Trigger animation after a small delay
    setTimeout(() => {
      forecastCards.forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    }, 100);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  updateEventButtons() {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach((card, index) => {
      const button = card.querySelector('.btn-primary');
      if (button) {
        button.dataset.action = 'join-event';
        button.dataset.eventId = index + 1;
        card.dataset.eventId = index + 1;
      }
    });
  }

  addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ===== INITIALIZE APP =====
// Create and start the app when the script loads
const app = new ShoreSquadApp();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShoreSquadApp, Utils };
}

// Global error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  Utils.showNotification('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  Utils.showNotification('A network error occurred. Please check your connection.', 'error');
});
