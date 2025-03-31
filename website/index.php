<?php
$pageTitle = "Jarvi - Ultimate Discord Music Bot";
include_once 'includes/header.php';
?>

<!-- Hero Section -->
<section class="hero">
    <div class="hero-container">
        <div class="hero-content">
            <h1>Meet <span class="highlight">Jarvi</span></h1>
            <h2>The Ultimate Discord Music Bot</h2>
            <p>Elevate your Discord server with high-quality music, intuitive commands, and seamless playback from YouTube, Spotify, and more!</p>
            <div class="cta-buttons">
                <a href="https://discord.com/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&scope=bot&permissions=8" class="btn btn-primary">Add to Discord</a>
                <a href="https://discord.gg/tBNezcRHMe" class="btn btn-secondary">Join Support Server</a>
            </div>
        </div>
        <div class="hero-image">
            <img src="images/hero-image.png" alt="Jarvi Bot in action" class="hero-img">
        </div>
    </div>
</section>

<!-- Features Section -->
<section class="features" id="features">
    <div class="container">
        <div class="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need in a music bot, and more</p>
        </div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-music"></i>
                </div>
                <h3>High-Quality Music</h3>
                <p>Crystal clear audio with support for high-bitrate streams and advanced audio filtering.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fab fa-spotify"></i>
                </div>
                <h3>Multiple Sources</h3>
                <p>Play music from YouTube, Spotify, SoundCloud, and more with simple commands.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-sliders-h"></i>
                </div>
                <h3>Audio Filters</h3>
                <p>Enhance your listening experience with bass boost, nightcore, 8D audio and other filters.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-list"></i>
                </div>
                <h3>Advanced Queue</h3>
                <p>Manage your music queue with ease - shuffle, loop, skip, and more with simple commands.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h3>24/7 Playback</h3>
                <p>Keep the music playing with 24/7 mode - Jarvi stays in your voice channel around the clock.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-terminal"></i>
                </div>
                <h3>Simple Commands</h3>
                <p>Intuitive prefix commands and slash commands make controlling Jarvi effortless.</p>
            </div>
        </div>
    </div>
</section>

<!-- Commands Section -->
<section class="commands" id="commands">
    <div class="container">
        <div class="section-header">
            <h2>Commands</h2>
            <p>Control Jarvi with these simple commands</p>
        </div>
        
        <div class="commands-container">
            <div class="commands-category">
                <h3>Music Commands</h3>
                <div class="command-list">
                    <div class="command-item">
                        <div class="command-name">/play</div>
                        <div class="command-description">Play a song from YouTube, Spotify, or other sources</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/skip</div>
                        <div class="command-description">Skip the current song</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/queue</div>
                        <div class="command-description">View the current music queue</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/pause</div>
                        <div class="command-description">Pause the current song</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/resume</div>
                        <div class="command-description">Resume playback</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/nowplaying</div>
                        <div class="command-description">See what's currently playing</div>
                    </div>
                </div>
            </div>
            
            <div class="commands-category">
                <h3>Control Commands</h3>
                <div class="command-list">
                    <div class="command-item">
                        <div class="command-name">/volume</div>
                        <div class="command-description">Adjust the playback volume</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/loop</div>
                        <div class="command-description">Toggle looping for current song or queue</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/shuffle</div>
                        <div class="command-description">Shuffle the current queue</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/join</div>
                        <div class="command-description">Make Jarvi join your voice channel</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/leave</div>
                        <div class="command-description">Disconnect Jarvi from voice channel</div>
                    </div>
                    <div class="command-item">
                        <div class="command-name">/247</div>
                        <div class="command-description">Toggle 24/7 mode</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="commands-note">
            <p>Use <code>/help</code> in Discord to see the full list of commands!</p>
        </div>
    </div>
</section>

<!-- Stats Section -->
<section class="stats">
    <div class="container">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number" id="servers-count">500+</div>
                <div class="stat-label">Servers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="users-count">100K+</div>
                <div class="stat-label">Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="songs-count">1M+</div>
                <div class="stat-label">Songs Played</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="uptime">99.9%</div>
                <div class="stat-label">Uptime</div>
            </div>
        </div>
    </div>
</section>

<!-- Call to Action -->
<section class="cta">
    <div class="container">
        <h2>Ready to elevate your Discord server?</h2>
        <p>Add Jarvi to your server and experience the best music bot available!</p>
        <a href="https://discord.com/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&scope=bot&permissions=8" class="btn btn-cta">Add to Discord</a>
    </div>
</section>

<?php include_once 'includes/footer.php'; ?>