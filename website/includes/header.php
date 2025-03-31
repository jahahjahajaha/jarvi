<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle : 'Jarvi - Ultimate Discord Music Bot'; ?></title>
    
    <!-- Meta tags for SEO -->
    <meta name="description" content="Jarvi is the ultimate Discord music bot with high-quality audio, multiple music sources, and intuitive commands. Add to your server today!">
    <meta name="keywords" content="discord bot, music bot, discord music, jarvi, discord music player">
    <meta name="author" content="The Extremez Coder">
    
    <!-- Open Graph / Social Media -->
    <meta property="og:title" content="Jarvi - Ultimate Discord Music Bot">
    <meta property="og:description" content="Elevate your Discord server with the best music experience!">
    <meta property="og:image" content="https://jarvi-beta.rf.gd/images/og-image.png">
    <meta property="og:url" content="https://jarvi-beta.rf.gd">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Jarvi - Ultimate Discord Music Bot">
    <meta name="twitter:description" content="Elevate your Discord server with the best music experience!">
    <meta name="twitter:image" content="https://jarvi-beta.rf.gd/images/og-image.png">
    
    <!-- Favicon -->
    <link rel="icon" href="images/favicon.ico">
    <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Main CSS -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="logo">
                <a href="index.php">
                    <img src="images/logo.svg" alt="Jarvi Logo" class="logo-img">
                    <span class="logo-text">Jarvi</span>
                </a>
            </div>
            
            <nav class="nav">
                <ul class="nav-list">
                    <li class="nav-item"><a href="index.php" class="nav-link">Home</a></li>
                    <li class="nav-item"><a href="#features" class="nav-link">Features</a></li>
                    <li class="nav-item"><a href="#commands" class="nav-link">Commands</a></li>
                    <li class="nav-item"><a href="premium.php" class="nav-link">Premium</a></li>
                    <li class="nav-item"><a href="https://discord.gg/tBNezcRHMe" class="nav-link">Support</a></li>
                </ul>
            </nav>
            
            <div class="mobile-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
            
            <div class="cta-button">
                <a href="https://discord.com/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&scope=bot&permissions=8" class="btn btn-sm">Add to Discord</a>
            </div>
        </div>
    </header>
    
    <main class="main-content">