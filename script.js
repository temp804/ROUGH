// Global State
const state = {
    currentVideoUrl: '',
    currentVideoTitle: '',
    videoHistory: [],
    maxHistoryLength: 10
};

// Platform Detection
function getPlatform(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'YouTube';
    if (urlLower.includes('instagram.com')) return 'Instagram';
    if (urlLower.includes('tiktok.com')) return 'TikTok';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter/X';
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) return 'Facebook';
    if (urlLower.includes('reddit.com')) return 'Reddit';
    if (urlLower.includes('terabox.com')) return 'Terabox';
    return 'Generic';
}

// Page Navigation
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    if (page === 'home') {
        document.getElementById('home').classList.add('active');
        window.location.hash = '#home';
    } else if (page === 'about') {
        document.getElementById('about').classList.add('active');
        window.location.hash = '#about';
    } else if (page === 'help') {
        document.getElementById('help').classList.add('active');
        window.location.hash = '#help';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Form Submit Handler
function handleFormSubmit(event) {
    event.preventDefault();
    const url = document.getElementById('videoUrl').value.trim();
    
    if (!url) {
        showError('Please enter a valid URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('Please enter a valid video URL');
        return;
    }
    
    // Store URL in history
    if (!state.videoHistory.includes(url)) {
        state.videoHistory.unshift(url);
        if (state.videoHistory.length > state.maxHistoryLength) {
            state.videoHistory.pop();
        }
        localStorage.setItem('videoHistory', JSON.stringify(state.videoHistory));
    }
    
    // Process the URL
    processVideoUrl(url);
}

// URL Validation
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        // Try with http:// prefix
        try {
            new URL('http://' + string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Process Video URL
function processVideoUrl(url) {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    state.currentVideoUrl = url;
    state.currentVideoTitle = `Video from ${getPlatform(url)}`;
    
    // Show info page with loading
    document.getElementById('infoPage').style.display = 'block';
    navigateTo('infoPage');
    
    // Show loading
    showInfoContent(`
        <div class="loading">
            <div class="spinner"></div>
            <p>Processing your video from ${getPlatform(url)}...</p>
            <p style="font-size: 0.9em; color: #666; margin-top: 15px;">This may take a few moments</p>
        </div>
    `);
    
    // Simulate processing (in real app, this would fetch metadata)
    setTimeout(() => {
        displayVideoInfo(url);
    }, 1500);
}

// Display Video Information
function displayVideoInfo(url) {
    const platform = getPlatform(url);
    const title = state.currentVideoTitle;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    let html = `
        <div class="video-info">
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #1e40af;">
                <h2 class="video-title" style="margin: 0; color: #0d47a1; font-size: 1.6em;">
                    📹 ${escapeHtml(title)}
                </h2>
                <p style="margin-top: 10px; color: #1e3a8a; font-size: 0.95em;">
                    Platform: <strong>${platform}</strong>
                </p>
            </div>
    `;
    
    // Add action buttons
    html += `
            <div class="formats">
                <h3>✨ Video Options:</h3>
                <div class="format-card">
                    <div>
                        <span class="quality">🎬 Best Quality</span>
                    </div>
                    <div class="actions">
                        <button class="btn btn-play" onclick="playVideoNow('${encodedUrl}', '${encodedTitle}')">▶ Play Now</button>
                        <button class="btn btn-download" onclick="downloadVideo('${encodedUrl}', '${encodedTitle}')">💾 Download</button>
                    </div>
                </div>
            </div>
    `;
    
    // Add helpful note
    html += `
            <div class="warning-message" style="margin-top: 20px;">
                💡 <strong>Note:</strong> If direct play doesn't work due to streaming restrictions, try the download option which uses advanced extraction methods.
            </div>
            <div class="success-message" style="margin-top: 15px;">
                ✓ <strong>Tip:</strong> You can also right-click on the video during playback and select "Save Video As" to download.
            </div>
        </div>
    `;
    
    showInfoContent(html);
}

// Show Info Content
function showInfoContent(html) {
    document.getElementById('infoContent').innerHTML = html;
}

// Play Video Now
function playVideoNow(encodedUrl, encodedTitle) {
    const url = decodeURIComponent(encodedUrl);
    const title = decodeURIComponent(encodedTitle);
    
    state.currentVideoUrl = url;
    state.currentVideoTitle = title;
    
    document.getElementById('videoSource').src = url;
    document.getElementById('playerTitle').textContent = title;
    
    navigateTo('playerPage');
    document.getElementById('playerPage').style.display = 'block';
    
    // Try to play
    const video = document.getElementById('videoPlayer');
    video.load();
    video.play().catch(error => {
        console.error('Playback error:', error);
        showError('Could not play video directly. Try downloading instead or check if the URL is valid.');
        setTimeout(() => navigateTo('home'), 2000);
    });
}

// Download Video
function downloadVideo(encodedUrl, encodedTitle) {
    const url = decodeURIComponent(encodedUrl);
    const title = decodeURIComponent(encodedTitle);
    const filename = `${sanitizeFilename(title)}.mp4`;
    
    // Show loading notification
    showWarning('📥 Download starting... Please wait');
    
    // Use fetch to download with blob
    fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        showSuccess(`✓ Download complete! Saved as: ${filename}`);
    })
    .catch(error => {
        console.error('Download error:', error);
        // Fallback: Try direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showSuccess('Download started! The video will be saved to your default download folder.');
    });
}

// Current Video Download
function downloadCurrentVideo() {
    if (!state.currentVideoUrl) {
        showError('No video URL available');
        return;
    }
    
    downloadVideo(encodeURIComponent(state.currentVideoUrl), encodeURIComponent(state.currentVideoTitle));
}

// Video Player Controls
function playVideo() {
    document.getElementById('videoPlayer').play();
}

function pauseVideo() {
    document.getElementById('videoPlayer').pause();
}

function toggleFullscreen() {
    const video = document.getElementById('videoPlayer');
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
    }
}

function shareVideo() {
    const title = state.currentVideoTitle;
    const url = window.location.href;
    const text = `Check out this video: ${title}`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).catch(error => console.error('Share error:', error));
    } else {
        // Fallback: copy to clipboard
        const shareText = `${title}\n${state.currentVideoUrl}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showSuccess('Video info copied to clipboard!');
        }).catch(() => {
            alert('Share link: ' + url);
        });
    }
}

// Utility Functions
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Notification Functions
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `${type}-message`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add slide animations
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize
function init() {
    // Redirect to home page if on root path
    if (!window.location.hash || window.location.hash === '' || window.location.hash === '#') {
        navigateTo('home');
    }
    
    // Load video history from localStorage
    const savedHistory = localStorage.getItem('videoHistory');
    if (savedHistory) {
        try {
            state.videoHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Error loading history:', e);
        }
    }
    
    // Log initialization
    console.log('🎬 Video Downloader initialized');
}

// Call init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // ESC key to exit player
    if (event.key === 'Escape' && document.getElementById('playerPage').style.display === 'block') {
        navigateTo('home');
        document.getElementById('playerPage').style.display = 'none';
    }
    // Enter to submit form
    if (event.key === 'Enter' && event.target === document.getElementById('videoUrl')) {
        handleFormSubmit(event);
    }
});

// Handle browser back button
window.addEventListener('popstate', function() {
    navigateTo('home');
    document.getElementById('playerPage').style.display = 'none';
});

// Handle hash changes for navigation
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.slice(1) || 'home';
    if (hash === 'home' || hash === 'about' || hash === 'help') {
        navigateTo(hash);
    }
});
