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
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all FAQ items
                faqItems.forEach(faqItem => {
                    faqItem.classList.remove('active');
                });
                
                // If the clicked item wasn't active, open it
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }
    
    // FAQ category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                
                // Remove active class from all tabs
                categoryTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Hide all FAQ categories
                const faqCategories = document.querySelectorAll('.faq-category');
                faqCategories.forEach(cat => cat.classList.remove('active'));
                
                // Show the selected category
                const selectedCategory = document.getElementById(category);
                if (selectedCategory) {
                    selectedCategory.classList.add('active');
                }
            });
        });
    }
    
    // Animate stats numbers on scroll
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length > 0) {
        const animateStats = () => {
            statNumbers.forEach(stat => {
                const value = stat.textContent;
                
                // Only animate if it hasn't been animated yet
                if (!stat.getAttribute('data-animated')) {
                    // Check if the element is in viewport
                    const rect = stat.getBoundingClientRect();
                    const isInViewport = (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                    
                    if (isInViewport) {
                        // Mark as animated
                        stat.setAttribute('data-animated', 'true');
                        
                        // Extract the numeric part
                        let targetValue = value;
                        if (value.includes('+')) {
                            targetValue = value.replace('+', '');
                        }
                        if (value.includes('K')) {
                            targetValue = parseFloat(targetValue) * 1000;
                        }
                        if (value.includes('M')) {
                            targetValue = parseFloat(targetValue) * 1000000;
                        }
                        if (value.includes('%')) {
                            targetValue = parseFloat(targetValue);
                        }
                        
                        // Animate the number
                        animateCounter(stat, parseFloat(targetValue), value);
                    }
                }
            });
        };
        
        // Run on page load and scroll
        animateStats();
        window.addEventListener('scroll', animateStats);
    }
    
    // Function to animate counter
    function animateCounter(el, target, finalText) {
        let current = 0;
        const increment = target / 50; // Divide the animation into 50 steps
        const duration = 1500; // Animation duration in ms
        const stepTime = duration / 50;
        
        const timer = setInterval(() => {
            current += increment;
            
            // Format the number with K or M suffix if needed
            let displayValue;
            
            if (finalText.includes('K')) {
                displayValue = (current / 1000).toFixed(1) + 'K';
            } else if (finalText.includes('M')) {
                displayValue = (current / 1000000).toFixed(1) + 'M';
            } else if (finalText.includes('%')) {
                displayValue = current.toFixed(1) + '%';
            } else {
                displayValue = Math.round(current);
            }
            
            // Add the '+' if the original had it
            if (finalText.includes('+')) {
                displayValue += '+';
            }
            
            el.textContent = displayValue;
            
            if (current >= target) {
                clearInterval(timer);
                el.textContent = finalText; // Set to the original text for accuracy
            }
        }, stepTime);
    }
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (href === '#') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = targetPosition - headerHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // If mobile nav is open, close it
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            }
        });
    });
    
    // Active link highlighting based on scroll position
    function setActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const headerHeight = document.querySelector('.header').offsetHeight;
            
            if (window.scrollY >= sectionTop - headerHeight - 100) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `index.php#${currentSection}` || 
                link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', setActiveLink);
    window.addEventListener('load', setActiveLink);
    
    // Form validation for contact form
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            let isValid = true;
            const name = document.getElementById('name');
            const email = document.getElementById('email');
            const message = document.getElementById('message');
            
            if (!name.value.trim()) {
                isValid = false;
                name.classList.add('error');
            } else {
                name.classList.remove('error');
            }
            
            if (!email.value.trim() || !isValidEmail(email.value)) {
                isValid = false;
                email.classList.add('error');
            } else {
                email.classList.remove('error');
            }
            
            if (!message.value.trim()) {
                isValid = false;
                message.classList.add('error');
            } else {
                message.classList.remove('error');
            }
            
            // If everything is valid, show a success message
            if (isValid) {
                // Here you would normally submit the form
                // For now, just show a success message
                const formContainer = contactForm.parentElement;
                
                contactForm.style.display = 'none';
                
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <h3>Message Sent Successfully!</h3>
                    <p>Thank you for contacting us. We'll get back to you as soon as possible.</p>
                `;
                
                formContainer.appendChild(successMessage);
                
                // Reset form for future use
                contactForm.reset();
            }
        });
    }
    
    // Email validation helper function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});