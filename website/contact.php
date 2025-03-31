<?php
$pageTitle = "Contact Us - Jarvi Discord Music Bot";
include_once 'includes/header.php';
?>

<!-- Contact Hero Section -->
<section class="contact-hero">
    <div class="container">
        <div class="contact-hero-content">
            <h1>Get in Touch</h1>
            <p>Have questions or feedback? We're here to help!</p>
        </div>
    </div>
</section>

<!-- Contact Form Section -->
<section class="contact-form-section">
    <div class="container">
        <div class="contact-grid">
            <div class="contact-info">
                <h2>Contact Information</h2>
                <p>Our team is dedicated to providing the best support possible. Choose the contact method that works best for you.</p>
                
                <div class="contact-methods">
                    <div class="contact-method">
                        <div class="contact-icon">
                            <i class="fab fa-discord"></i>
                        </div>
                        <div class="contact-details">
                            <h3>Discord Support Server</h3>
                            <p>Get real-time support in our Discord server</p>
                            <a href="https://discord.gg/tBNezcRHMe" class="btn btn-sm btn-outline">Join Support Server</a>
                        </div>
                    </div>
                    
                    <div class="contact-method">
                        <div class="contact-icon">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="contact-details">
                            <h3>Developer Contact</h3>
                            <p>Contact KnarliX directly on Discord</p>
                            <span class="developer-contact">Discord ID: 1212719184870383621</span>
                        </div>
                    </div>
                    
                    <div class="contact-method">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="contact-details">
                            <h3>Email Support</h3>
                            <p>Send us an email for detailed inquiries</p>
                            <a href="mailto:support@jarvi-bot.com" class="contact-link">support@jarvi-bot.com</a>
                        </div>
                    </div>
                    
                    <div class="contact-method">
                        <div class="contact-icon">
                            <i class="fab fa-youtube"></i>
                        </div>
                        <div class="contact-details">
                            <h3>YouTube</h3>
                            <p>Watch tutorials and update videos</p>
                            <a href="#" class="contact-link">Jarvi Bot Channel</a>
                        </div>
                    </div>
                </div>
                
                <div class="response-time">
                    <h3>Response Time</h3>
                    <p>We typically respond to all inquiries within 24 hours. For urgent matters, please join our Discord support server for faster assistance.</p>
                </div>
            </div>
            
            <div class="contact-form-container">
                <h2>Send a Message</h2>
                <form class="contact-form" id="contactForm" action="process_contact.php" method="POST">
                    <div class="form-group">
                        <label for="name">Your Name</label>
                        <input type="text" id="name" name="name" placeholder="Enter your name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email address" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="discord">Discord Username (optional)</label>
                        <input type="text" id="discord" name="discord" placeholder="Your Discord username with tag">
                    </div>
                    
                    <div class="form-group">
                        <label for="subject">Subject</label>
                        <select id="subject" name="subject" required>
                            <option value="" selected disabled>Select a subject</option>
                            <option value="general">General Inquiry</option>
                            <option value="support">Technical Support</option>
                            <option value="feature">Feature Request</option>
                            <option value="bug">Bug Report</option>
                            <option value="feedback">Feedback</option>
                            <option value="partnership">Partnership Opportunity</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea id="message" name="message" placeholder="Enter your message here..." rows="6" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="tos" name="tos" required>
                            <label for="tos">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </div>
</section>

<!-- FAQ Suggestion Section -->
<section class="faq-suggestion">
    <div class="container">
        <div class="faq-suggestion-content">
            <h2>Looking for quick answers?</h2>
            <p>Check our FAQ section for answers to common questions.</p>
            <a href="faq.php" class="btn btn-secondary">View FAQ</a>
        </div>
    </div>
</section>

<?php include_once 'includes/footer.php'; ?>