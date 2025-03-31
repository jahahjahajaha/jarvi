/**
 * Jarvi Discord Bot Website
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile navigation toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });
    }
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default if it's not just "#" (which would be the top of the page)
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Close mobile menu if open
                    if (nav.classList.contains('active')) {
                        nav.classList.remove('active');
                        document.body.classList.remove('nav-open');
                    }
                    
                    // Scroll to the element
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for header height
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // FAQ accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Fixed header on scroll
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Animated counter for stats
    function animateCounter(el, target) {
        const duration = 2000; // 2 seconds
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;
        
        // Get the starting number
        let startValue = 0;
        let currentValue = 0;
        
        // Format the target number to determine if it has K, M, etc.
        let suffix = '';
        let numericTarget = target;
        
        if (typeof target === 'string') {
            if (target.includes('K')) {
                suffix = 'K';
                numericTarget = parseFloat(target.replace('K', '')) * 1000;
            } else if (target.includes('M')) {
                suffix = 'M';
                numericTarget = parseFloat(target.replace('M', '')) * 1000000;
            } else if (target.includes('%')) {
                suffix = '%';
                numericTarget = parseFloat(target.replace('%', ''));
            } else if (target.includes('+')) {
                suffix = '+';
                numericTarget = parseFloat(target.replace('+', ''));
            } else {
                numericTarget = parseFloat(target);
            }
        }
        
        const timer = setInterval(() => {
            frame++;
            
            // Calculate the progress (0 to 1)
            const progress = frame / totalFrames;
            
            // Calculate the current value using easing
            currentValue = startValue + (numericTarget - startValue) * easeOutQuad(progress);
            
            // Update the element
            if (suffix === 'K') {
                el.textContent = (currentValue / 1000).toFixed(1) + suffix;
            } else if (suffix === 'M') {
                el.textContent = (currentValue / 1000000).toFixed(1) + suffix;
            } else if (suffix === '%' || suffix === '+') {
                el.textContent = Math.floor(currentValue) + suffix;
            } else {
                el.textContent = Math.floor(currentValue);
            }
            
            // If we've reached the target or completed all frames, stop the animation
            if (frame === totalFrames) {
                clearInterval(timer);
                // Make sure the final value is exactly the target
                if (suffix === 'K') {
                    el.textContent = (numericTarget / 1000).toFixed(1) + suffix;
                } else if (suffix === 'M') {
                    el.textContent = (numericTarget / 1000000).toFixed(1) + suffix;
                } else if (suffix === '%' || suffix === '+') {
                    el.textContent = Math.floor(numericTarget) + suffix;
                } else {
                    el.textContent = Math.floor(numericTarget);
                }
            }
        }, frameDuration);
    }
    
    // Easing function for smoother animation
    function easeOutQuad(t) {
        return t * (2 - t);
    }
    
    // Intersection Observer for triggering animations when elements come into view
    const animatedElements = document.querySelectorAll('.stat-number');
    
    if ('IntersectionObserver' in window && animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = el.textContent;
                    animateCounter(el, target);
                    
                    // Unobserve after animation has been triggered
                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.1
        });
        
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }
    
    // Active link highlighting based on scroll position
    function setActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', setActiveLink);
    
    // Initialize the active link
    setActiveLink();
    
});