<?php
// Set default page title if not defined
if (!isset($pageTitle)) {
    $pageTitle = "Jarvi - The Ultimate Discord Music Bot";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?></title>
    
    <!-- Meta tags for SEO -->
    <meta name="description" content="Jarvi is a 100% free Discord music bot with high-quality audio, intuitive commands, and support for YouTube, Spotify, and more!">
    <meta name="keywords" content="discord bot, music bot, discord music, jarvi, jarvi bot, discord music player, free discord bot">
    <meta name="author" content="KnarliX">
    
    <!-- Favicon -->
    <link rel="shortcut icon" href="images/favicon.ico" type="image/x-icon">
    
    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:title" content="<?php echo $pageTitle; ?>">
    <meta property="og:description" content="Jarvi is a 100% free Discord music bot with high-quality audio, intuitive commands, and support for YouTube, Spotify, and more!">
    <meta property="og:image" content="images/og-image.jpg">
    <meta property="og:url" content="https://jarvi-beta.rf.gd">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo $pageTitle; ?>">
    <meta name="twitter:description" content="Jarvi is a 100% free Discord music bot with high-quality audio, intuitive commands, and support for YouTube, Spotify, and more!">
    <meta name="twitter:image" content="images/og-image.jpg">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/style.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Jarvi Discord Music Bot",
        "applicationCategory": "Discord Bot",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        },
        "description": "Jarvi is a 100% free Discord music bot that provides high-quality music playback from multiple sources including YouTube, Spotify, and more."
    }
    </script>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo">
                <a href="index.php">
                    <img src="images/logo.svg" alt="Jarvi Discord Bot Logo" class="logo-img">
                    <span class="logo-text">Jarvi</span>
                </a>
            </div>
            
            <nav class="nav">
                <ul class="nav-list">
                    <li><a href="index.php" class="nav-link">Home</a></li>
                    <li><a href="index.php#features" class="nav-link">Features</a></li>
                    <li><a href="index.php#commands" class="nav-link">Commands</a></li>
                    <li><a href="index.php#developer" class="nav-link">Developer</a></li>
                    <li><a href="faq.php" class="nav-link">FAQ</a></li>
                    <li><a href="contact.php" class="nav-link">Contact</a></li>
                </ul>
            </nav>
            
            <div class="mobile-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
            
            <div class="cta-button">
                <a href="https://discord.com/oauth2/authorize?client_id=1340194029517799434" class="btn btn-sm">Add to Discord</a>
            </div>
        </div>
    </header>
    
    <main class="main-content">