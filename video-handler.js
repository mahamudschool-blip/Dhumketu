/**
 * DHUMKETU VIDEO HANDLER - 2026
 * ইউটিউব লিংক অটো-এম্বেড এবং রেসপন্সিভ প্লেয়ার লজিক
 */

// ১. ইউটিউব সাধারণ লিংক থেকে এম্বেড লিংক তৈরি
function convertToEmbedUrl(htmlContent) {
    if (!htmlContent) return "";
    
    // ইউটিউব লিংকের প্যাটার্ন (Short and Full link)
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)/g;
    
    return htmlContent.replace(youtubeRegex, (match, videoId) => {
        return `<div class="video-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                    </iframe>
                </div>`;
    });
}

// ২. ডাটাবেসে সেভ করার আগে এই ফাংশনটি কল হবে
async function saveWithVideoFix(path, title, body, imageUrl) {
    // বডি'র ভেতরে যদি কোনো ইউটিউব লিংক থাকে তা ঠিক করা
    const fixedBody = convertToEmbedUrl(body);
    
    try {
        await firebase.database().ref(path).update({
            title: title,
            body: fixedBody,
            imageUrl: imageUrl,
            lastEdit: Date.now()
        });
        return true;
    } catch (e) {
        console.error("Save Error:", e);
        return false;
    }
}


