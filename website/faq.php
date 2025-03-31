<?php
$pageTitle = "Frequently Asked Questions - Jarvi Discord Music Bot";
include_once 'includes/header.php';
?>

<!-- FAQ Hero Section -->
<section class="faq-hero">
    <div class="container">
        <div class="faq-hero-content">
            <h1>Frequently Asked Questions</h1>
            <p>Find answers to the most common questions about Jarvi bot</p>
        </div>
    </div>
</section>

<!-- FAQ Section -->
<section class="faq-section">
    <div class="container">
        <!-- Category Tabs -->
        <div class="faq-categories">
            <h2>Browse by Category</h2>
            <div class="category-tabs">
                <button class="category-tab active" data-category="general">General</button>
                <button class="category-tab" data-category="commands">Commands</button>
                <button class="category-tab" data-category="music">Music Features</button>
                <button class="category-tab" data-category="troubleshooting">Troubleshooting</button>
            </div>
        </div>
        
        <!-- FAQ Items -->
        <div class="faq-items">
            <!-- General FAQs -->
            <div class="faq-category active" id="general">
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What is Jarvi?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Jarvi is a feature-rich Discord music bot designed to provide high-quality music playback in your Discord server. It supports multiple music sources including YouTube, Spotify, and more, with an intuitive command system for effortless control.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How do I add Jarvi to my server?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Click the "Add to Discord" button on our website and follow the authorization process. You'll need to have the "Manage Server" permission on the Discord server where you want to add Jarvi.</p>
                        <p><a href="https://discord.com/oauth2/authorize?client_id=1340194029517799434" class="btn btn-sm btn-outline">Add Jarvi to Discord</a></p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Is Jarvi free to use?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes! Jarvi is 100% free to use with all features included. There are no premium tiers or paid features - everything is available to all users at no cost.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What permissions does Jarvi need?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Jarvi requires the following permissions to function properly:</p>
                        <ul>
                            <li>View Channels - To see and join voice channels</li>
                            <li>Send Messages - To respond to commands</li>
                            <li>Embed Links - To send rich embeds with music information</li>
                            <li>Attach Files - For certain features like lyrics</li>
                            <li>Connect - To join voice channels</li>
                            <li>Speak - To play audio in voice channels</li>
                            <li>Use Voice Activity - For voice detection</li>
                        </ul>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How do I get support for Jarvi?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>You can get support by:</p>
                        <ul>
                            <li>Joining our <a href="https://discord.gg/tBNezcRHMe">support server</a> for real-time help</li>
                            <li>Using the contact form on our <a href="contact.php">Contact page</a></li>
                            <li>Sending an email to support@jarvi-bot.com</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Commands FAQs -->
            <div class="faq-category" id="commands">
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What's the default prefix for Jarvi?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>The default prefix for Jarvi is <code>!</code>. You can also use <code>@Jarvi</code> to mention the bot as a prefix.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How do I see all available commands?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Use <code>!help</code> to see a list of all available commands. You can also use <code>!help [command]</code> to get more information about a specific command.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Does Jarvi support slash commands?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes! Jarvi supports Discord's slash commands. You can use commands like <code>/play</code>, <code>/skip</code>, and more for an even more intuitive experience.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How do I change the bot's prefix?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>You can change the prefix using the <code>!setprefix [new prefix]</code> command. This feature is available to all users.</p>
                    </div>
                </div>
            </div>
            
            <!-- Music Features FAQs -->
            <div class="faq-category" id="music">
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What music sources does Jarvi support?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Jarvi supports multiple music sources including:</p>
                        <ul>
                            <li>YouTube</li>
                            <li>Spotify</li>
                            <li>SoundCloud</li>
                            <li>Deezer</li>
                            <li>Apple Music</li>
                            <li>Direct URLs to audio files</li>
                        </ul>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>How do I play music with Jarvi?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>You can play music by using the <code>!play</code> command followed by a song name, URL, or playlist link. Examples:</p>
                        <ul>
                            <li><code>!play despacito</code> - searches for and plays the song</li>
                            <li><code>!play https://www.youtube.com/watch?v=dQw4w9WgXcQ</code> - plays the song from the URL</li>
                            <li><code>!play https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M</code> - queues the entire playlist</li>
                        </ul>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What audio quality does Jarvi provide?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Jarvi provides high-quality audio with a bitrate of up to 256kbps for crystal-clear music playback on all servers.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Does Jarvi support playlists?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes! Jarvi can play entire playlists from YouTube, Spotify, and other supported platforms. Simply use the <code>!play</code> command with a playlist URL.</p>
                        <p>You can also create and save your own custom playlists using the <code>!playlist</code> commands.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>What audio filters are available?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Jarvi offers several audio filters to enhance your music experience:</p>
                        <ul>
                            <li>Bassboost - Enhances bass frequencies</li>
                            <li>Nightcore - Speeds up and raises the pitch</li>
                            <li>8D - Creates a rotating audio effect</li>
                            <li>Vaporwave - Slows down and lowers the pitch</li>
                            <li>And more!</li>
                        </ul>
                        <p>Use <code>!filter [filter name]</code> to apply a filter. All filters are available to all users.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Is 24/7 mode available?</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Yes! 24/7 mode is available to all users. This feature keeps Jarvi in your voice channel around the clock, even when no one is in the channel. This prevents the bot from disconnecting due to inactivity and ensures continuous music playback.</p>
                        <p>You can enable 24/7 mode with the <code>!247</code> command.</p>
                    </div>
                </div>
            </div>
            
            <!-- Troubleshooting FAQs -->
            <div class="faq-category" id="troubleshooting">
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Jarvi isn't responding to commands</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>If Jarvi isn't responding to commands, try these troubleshooting steps:</p>
                        <ol>
                            <li>Make sure Jarvi has the necessary permissions in your server and channel</li>
                            <li>Check if you're using the correct prefix (default is <code>!</code>)</li>
                            <li>Try mentioning the bot with <code>@Jarvi</code> followed by the command</li>
                            <li>Check if the bot is online by using <code>!ping</code></li>
                            <li>Try re-inviting the bot to your server</li>
                        </ol>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Jarvi is not playing music</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>If Jarvi joins the voice channel but doesn't play music, try these solutions:</p>
                        <ol>
                            <li>Make sure Jarvi has the "Speak" permission in the voice channel</li>
                            <li>Try using a different music source or URL</li>
                            <li>Check if the song or playlist is available in your region</li>
                            <li>Use <code>!leave</code> and then try connecting again with <code>!join</code></li>
                            <li>Restart the queue with <code>!stop</code> and then play music again</li>
                        </ol>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>The audio quality is poor</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>If you're experiencing poor audio quality, try these tips:</p>
                        <ol>
                            <li>Check your server region and make sure it matches your actual location</li>
                            <li>Try a different voice channel with a lower user count</li>
                            <li>Make sure your internet connection is stable</li>
                            <li>Try lowering the volume with <code>!volume 80</code> to reduce potential distortion</li>
                            <li>Disable any active audio filters with <code>!filter clear</code></li>
                        </ol>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Jarvi disconnects frequently</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>If Jarvi keeps disconnecting from voice channels, try these fixes:</p>
                        <ol>
                            <li>Make sure your server has a stable internet connection</li>
                            <li>Enable 24/7 mode with <code>!247</code> to prevent automatic disconnects</li>
                            <li>Check if your server region is experiencing issues</li>
                            <li>Make sure Jarvi has all required permissions</li>
                            <li>Join our support server for help with persistent issues</li>
                        </ol>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>Commands not working with slash commands</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>If slash commands aren't working, try these solutions:</p>
                        <ol>
                            <li>Make sure you've invited Jarvi with the proper slash command permissions</li>
                            <li>Reinvite the bot with the invite link on our website</li>
                            <li>Make sure Jarvi has the "Use Application Commands" permission</li>
                            <li>Try using traditional prefix commands until the issue is resolved</li>
                            <li>Wait a few minutes as slash commands can take time to register</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Contact Section -->
<section class="contact-cta">
    <div class="container">
        <h2>Still have questions?</h2>
        <p>We're here to help! Reach out to us through our support channels.</p>
        <div class="cta-buttons">
            <a href="https://discord.gg/tBNezcRHMe" class="btn btn-secondary">Join Support Server</a>
            <a href="contact.php" class="btn btn-primary">Contact Us</a>
        </div>
    </div>
</section>

<?php include_once 'includes/footer.php'; ?>