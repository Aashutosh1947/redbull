// --- Configuration ---
const TOTAL_FRAMES = 240;
const images = [];
let targetFrame = 0;
let currentFrame = 0;
const interpolationFactor = 0.08; // Inertial smoothing coefficient

// --- Elements ---
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');
const heroSection = document.getElementById('hero-section');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loaderPercent = document.getElementById('loader-percentage');
const loaderStatus = document.getElementById('loader-status');
const slides = document.querySelectorAll('.slide-overlay');
const dots = document.querySelectorAll('.nav-dot');
const scrollIndicator = document.getElementById('scroll-indicator');

// --- Custom Cursor ---
const cursor = document.getElementById('custom-cursor');
const cursorGlow = document.getElementById('custom-cursor-glow');

if (cursor && cursorGlow) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    // Slight delay on glow for premium springy effect
    cursorGlow.animate({
      left: e.clientX + 'px',
      top: e.clientY + 'px'
    }, { duration: 250, fill: 'forwards' });
  });

  // Track hover on clickable elements
  const hoverables = 'a, button, .nav-dot';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) {
      document.body.classList.add('hovering-link');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) {
      document.body.classList.remove('hovering-link');
    }
  });
}

// --- Preload Images ---
function preloadImages() {
  let loadedCount = 0;
  
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      // Format number to 3 digits (e.g., 001, 012, 120)
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
      
      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        
        loaderBar.style.width = `${percent}%`;
        loaderPercent.textContent = `${percent}%`;
        
        if (percent < 30) {
          loaderStatus.textContent = "Freezing ice crystals...";
        } else if (percent < 70) {
          loaderStatus.textContent = "Chilling mountain water...";
        } else if (percent < 95) {
          loaderStatus.textContent = "Injecting taurine & lightning...";
        } else {
          loaderStatus.textContent = "Vitalizing body and mind...";
        }

        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 800);
            resolve();
          }, 500);
        }
      };
      
      // Fallback for load errors
      img.onerror = () => {
        console.warn(`Failed to load frame ${i}, substituting empty frame.`);
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          preloader.classList.add('fade-out');
          setTimeout(() => preloader.style.display = 'none', 800);
          resolve();
        }
      };

      images.push(img);
    }
  });
}

// --- Canvas Aspect Ratio Aware Drawer ---
function drawFrame(img) {
  if (!img || !img.complete) return;
  
  const canvasAspect = canvas.width / canvas.height;
  const imgAspect = img.width / img.height;
  let drawWidth, drawHeight, offsetX, offsetY;

  // Simulate cover fit
  if (canvasAspect > imgAspect) {
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgAspect;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    drawWidth = canvas.height * imgAspect;
    drawHeight = canvas.height;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// --- Resize Canvas ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Draw the current interpolated frame immediately
  const drawIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(currentFrame)));
  drawFrame(images[drawIndex]);
}

window.addEventListener('resize', resizeCanvas);

// --- Scroll Handling ---
let lastScrollFraction = 0;

function handleScroll() {
  if (!heroSection) return;
  
  const rect = heroSection.getBoundingClientRect();
  const scrollableDistance = heroSection.scrollHeight - window.innerHeight;
  
  // Calculate relative scroll fraction (0 to 1) of the hero sticky portion
  let scrollFraction = -rect.top / scrollableDistance;
  scrollFraction = Math.max(0, Math.min(1, scrollFraction));
  
  lastScrollFraction = scrollFraction;
  
  // Map scroll fraction to image index (0 to 239)
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
  
  // Fade landing text based on scroll progress (0 to 30%)
  const landingText = document.getElementById('hero-landing-text');
  if (landingText) {
    if (scrollFraction <= 0.3) {
      const opacity = 1.0 - (scrollFraction / 0.3);
      landingText.style.opacity = opacity;
      landingText.style.visibility = 'visible';
    } else {
      landingText.style.opacity = 0;
      landingText.style.visibility = 'hidden';
    }
  }

  // Active slide state toggle based on scroll splits
  let activeSlideIndex = 0;
  if (scrollFraction >= 0.15) {
    if (scrollFraction < 0.5) {
      activeSlideIndex = 1;
    } else if (scrollFraction < 0.8) {
      activeSlideIndex = 2;
    } else {
      activeSlideIndex = 3;
    }
  }
  
  slides.forEach((slide, idx) => {
    // slides list has elements slide-1, slide-2, slide-3.
    // idx 0 corresponds to slide-1, idx 1 to slide-2, idx 2 to slide-3.
    if (idx === (activeSlideIndex - 1)) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });

  dots.forEach((dot, idx) => {
    if (idx === activeSlideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  // Fade out mouse scroll indicator as user scrolls down
  if (scrollFraction > 0.1) {
    scrollIndicator.classList.add('hide');
  } else {
    scrollIndicator.classList.remove('hide');
  }

  // Update navigation link highlights
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link, idx) => {
    if (idx === activeSlideIndex) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

window.addEventListener('scroll', handleScroll);

// --- Navigation Click Handlers ---
const slideFractions = [0, 0.35, 0.68, 1.0];

function scrollToSlide(index) {
  if (!heroSection) return;
  const scrollableDistance = heroSection.scrollHeight - window.innerHeight;
  const targetFraction = slideFractions[index];
  const targetScroll = heroSection.offsetTop + (targetFraction * scrollableDistance);
  
  window.scrollTo({
    top: targetScroll,
    behavior: 'smooth'
  });
}

// Side dots navigation
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => scrollToSlide(index));
});

// Header navigation links
const headerLinks = document.querySelectorAll('.desktop-nav .nav-link');
headerLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const index = parseInt(link.getAttribute('data-index'), 10);
    scrollToSlide(index);
  });
});

// Header CTA button
const headerCta = document.getElementById('header-cta');
if (headerCta) {
  headerCta.addEventListener('click', (e) => {
    e.preventDefault();
    const index = parseInt(headerCta.getAttribute('data-index'), 10);
    scrollToSlide(index);
  });
}

// Footer navigation links
const footerLinks = document.querySelectorAll('.footer-nav-link');
footerLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const index = parseInt(link.getAttribute('data-index'), 10);
    scrollToSlide(index);
  });
});

// --- Smooth Render Animation Loop (Inertial Interpolation) ---
function animationLoop() {
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) < 0.01) {
    currentFrame = targetFrame;
  } else {
    currentFrame += diff * interpolationFactor;
  }
  
  const drawIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(currentFrame)));
  drawFrame(images[drawIndex]);
  
  requestAnimationFrame(animationLoop);
}

// --- Initialize App ---
async function init() {
  await preloadImages();
  resizeCanvas();
  // Draw first frame immediately
  drawFrame(images[0]);
  // Start drawing loop for smooth inertial frame updates
  animationLoop();
}

// --- Variants Carousel Chevron Scroll ---
const carouselContainer = document.getElementById('carousel-container');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
if (carouselContainer && carouselPrev && carouselNext) {
  carouselPrev.addEventListener('click', () => {
    carouselContainer.scrollBy({ left: -320, behavior: 'smooth' });
  });
  carouselNext.addEventListener('click', () => {
    carouselContainer.scrollBy({ left: 320, behavior: 'smooth' });
  });
}

// --- Smooth Entrance Animations ---
const observerOptions = {
  threshold: 0.1
};
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('opacity-100', 'translate-y-0');
      entry.target.classList.remove('opacity-0', 'translate-y-10');
    }
  });
}, observerOptions);

document.querySelectorAll('section:not(#hero-section), .glass-panel').forEach(el => {
  el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
  observer.observe(el);
});

init();
