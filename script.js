/**
 * DHUMKETU MASTER SCRIPT - 2026 (FINAL REFINED)
 */

// ১. ফায়ারবেস কনফিগারেশন
const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// গ্লোবাল ভেরিয়েবল
let currentPath = 'contents';
let currentFilter = null;
let currentMCQSet = [];
let currentQuestionIndex = 0;
let userScore = 0;

// ২. সময় ফরম্যাট (বাংলায়)
function formatTime(ts) {
    if (!ts) return "";
    try {
        const date = new Date(ts);
        return date.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return ""; }
}

// ৩. লাইভ ক্লক (সেকেন্ড অনুযায়ী চলবে)
function startLiveClock() {
    const clockElement = document.getElementById('notice-clock');
    if (!clockElement) return;
    setInterval(() => {
        const now = new Date();
        clockElement.innerText = now.toLocaleTimeString('en-GB', { hour12: false });
    }, 1000);
}

function setupNoticeMarquee() {
    db.ref('siteNotice').on('value', snapshot => {
        const marquee = document.getElementById('notice-marquee');
        const data = snapshot.val();
        
        if (!data || !marquee) return;

        let allNotices = [];
        if (typeof data === 'object') {
            Object.values(data).forEach(item => {
                const txt = (typeof item === 'object') ? item.text : item;
                if(txt) allNotices.push(txt);
            });
        } else {
            allNotices.push(data);
        }

        // একটি সিঙ্গেল লাইন তৈরি করুন যার শেষে অনেকটা খালি জায়গা থাকবে
        const singleLine = "📢 " + allNotices.join(' | ') + " --- ধূমকেতু এডুকেশনাল হাবে স্বাগতম!          ";
        
        // গ্যাপ দূর করতে টেক্সটটি ২ বার রিপিট করুন
        // এখন সিএসএস-এর -50% এনিমেশনের কারণে এটি চিরকাল গ্যাপহীন লুপে চলবে
        marquee.innerText = singleLine + singleLine;
        
        // টেক্সটের দৈর্ঘ্য অনুযায়ী স্পিড সেট করা (যাতে খুব দ্রুত বা ধীরে না হয়)
        const duration = Math.max(15, singleLine.length / 8); 
        marquee.style.animationDuration = `${duration}s`;
    });
}


// ৫. গুগল ট্রান্সলেট (শুধুমাত্র বাংলা ও ইংরেজি)
window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,bn', // শুধুমাত্র এই দুটি থাকবে
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

// ৬. পেজ ইনিশিয়ালাইজেশন
document.addEventListener('DOMContentLoaded', () => {
    startLiveClock();
    setupNoticeMarquee();
    loadSection('contents');
    setupUpdates();
    
    // Google Translate Script Load
    if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);
    }
});

// --- বাকি সব ফাংশন (loadSection, renderUI, createCard, ইত্যাদি) আপনার আগের কোড অনুযায়ী নিচে থাকবে ---



// (বাকি কার্ড এবং MCQ ফাংশনগুলো এখানে যোগ করুন...)



// মার্কি অ্যানিমেশন শুরু করা
function startMarqueeAnimation(element) {
    // রিসেট মার্কি স্টাইল
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = null;
    
    // মার্কি অ্যানিমেশন
    element.style.animation = 'marquee-serial 60s linear infinite';
}

// ৫. মেইন ডাটা লোডার (Folder Navigation)
function loadSection(path, btn = null) {
    currentPath = path;
    currentFilter = null;
    if(btn) updateNavUI(btn);
    
    showLoading(true);
    document.getElementById('breadcrumb').innerHTML = `🏠 ${path.toUpperCase().replace(/\//g, ' › ')}`;
    
    const backBtn = document.getElementById('back-btn');
    if(backBtn) backBtn.classList.toggle('hidden', path === 'contents');

    db.ref(path).once('value', snapshot => {
        showLoading(false);
        const data = snapshot.val() || {};
        renderUI(data, path);
    });
}

function renderUI(data, path) {
    const folderGrid = document.getElementById('folder-grid');
    const contentGrid = document.getElementById('content-grid');
    const noResults = document.getElementById('no-results');
    const viewTitle = document.getElementById('view-title');
    const viewSubtitle = document.getElementById('view-subtitle');

    // গ্রিড ক্লিয়ার করা
    folderGrid.innerHTML = '';
    contentGrid.innerHTML = '';
    let hasItems = false;
    const isHomePage = (path === 'contents');

    if (!data) {
        if(noResults) noResults.classList.remove('hidden');
        return;
    }

    Object.keys(data).forEach(key => {
        const item = data[key];
        
        // যদি এটি কন্টেন্ট/ফাইল হয় (যার ভেতরে 'type' প্রপার্টি আছে)
        if (item && item.type) {
            contentGrid.innerHTML += createCard({id: key, path: path, ...item});
            hasItems = true;
        } 
        // যদি এটি একটি ফোল্ডার হয় (যা আসলে একটি অবজেক্ট কিন্তু ফাইল নয়)
        else if (item && typeof item === 'object') {
            folderGrid.innerHTML += `
                <div onclick="loadSection('${path}/${key}')" class="cursor-pointer bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-xl transition text-center group active:scale-95">
                    <div class="text-5xl mb-3 group-hover:scale-110 transition">📁</div>
                    <div class="text-sm font-black text-slate-700 uppercase tracking-tighter">${key}</div>
                </div>`;
            hasItems = true;
        }
    });

    // টাইটেল আপডেট
    const displayTitle = path.split('/').pop();
    viewTitle.innerText = isHomePage ? "Recent Uploads" : displayTitle.toUpperCase();
    viewSubtitle.innerText = isHomePage ? "Stay updated with latest educational materials" : `Browsing ${displayTitle}`;
    
    // রেজাল্ট না থাকলে মেসেজ দেখানো
    if(noResults) noResults.classList.toggle('hidden', hasItems);
    
    // MathJax রেন্ডারিং (যদি থাকে)
    if(window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

// ৭. ক্যাটাগরি ফিল্টার (Deep Search - সব ফোল্ডার থেকে ফাইল খুঁজবে)
function filterType(type, btn) {
    currentFilter = (currentFilter === type) ? null : type;
    updateNavUI(btn);

    const contentGrid = document.getElementById('content-grid');
    const folderGrid = document.getElementById('folder-grid');
    const viewTitle = document.getElementById('view-title');
    const viewSubtitle = document.getElementById('view-subtitle');

    if (currentFilter) {
        showLoading(true);
        folderGrid.innerHTML = ''; 
        contentGrid.innerHTML = '';
        
        db.ref('contents').once('value', snapshot => {
            showLoading(false);
            const allData = snapshot.val() || {};
            let foundCount = 0;

            function searchDeep(obj, path) {
                if (!obj || typeof obj !== 'object') return;
                Object.keys(obj).forEach(key => {
                    const item = obj[key];
                    if (item && item.type) {
                        if (item.type === currentFilter) {
                            contentGrid.innerHTML += createCard({id: key, path: path, ...item});
                            foundCount++;
                        }
                    } else if (typeof item === 'object') {
                        searchDeep(item, `${path}/${key}`);
                    }
                });
            }

            searchDeep(allData, 'contents');
            viewTitle.innerText = `সকল ${typeNames[type] || type} (${foundCount})`;
            viewSubtitle.innerText = `${typeNames[type] || type} ফিল্টার করা`;
            document.getElementById('no-results').classList.toggle('hidden', foundCount > 0);
            if(window.MathJax) MathJax.typesetPromise();
        });
    } else {
        loadSection('contents');
    }
}

// ৮. কন্টেন্ট কার্ড টেমপ্লেট - IMPROVED VERSION
const icons = { 
    mcq_set: '📚', 
    mcq: '❓', 
    video: '🎥', 
    image: '🖼️', 
    pdf: '📄', 
    post: '📝' 
};

const typeColors = {
    mcq_set: 'from-purple-500 to-purple-700',
    mcq: 'from-blue-500 to-blue-700',
    video: 'from-red-500 to-red-700',
    image: 'from-green-500 to-green-700',
    pdf: 'from-amber-500 to-amber-700',
    post: 'from-indigo-500 to-indigo-700'
};

const typeNames = {
    mcq_set: 'MCQ সেট',
    mcq: 'MCQ প্রশ্ন',
    video: 'ভিডিও',
    image: 'ছবি',
    pdf: 'PDF ফাইল',
    post: 'পোস্ট'
};

function createCard(item) {
    // একশন নির্ধারণ
    const action = item.type === 'mcq_set' ? `openMCQSet('${item.id}', '${item.path}')` : 
                   item.type === 'mcq' ? `openSingleMCQ('${item.id}', '${item.path}')` : 
                   item.type === 'post' ? `openFullPost('${item.id}', '${item.path}')` : 
                   item.type === 'video' ? `window.open('${item.url || '#'}', '_blank')` :
                   item.type === 'pdf' ? `window.open('${item.url || '#'}', '_blank')` :
                   `openFullPost('${item.id}', '${item.path}')`;

    // সময় ফরম্যাট
    const timeStr = formatTime(item.timestamp);
    
    // কন্টেন্ট প্রিভিউ তৈরি
    let contentPreview = '';
    if (item.body && item.type === 'post') {
        contentPreview = item.body.substring(0, 120) + (item.body.length > 120 ? '...' : '');
    } else if (item.type === 'mcq_set' && item.questions) {
        contentPreview = `${item.questions.length} টি প্রশ্ন`;
    } else if (item.type === 'mcq') {
        contentPreview = 'একটি MCQ প্রশ্ন';
    } else if (item.type === 'video') {
        contentPreview = 'ভিডিও লেকচার';
    } else if (item.type === 'pdf') {
        contentPreview = 'PDF ডকুমেন্ট';
    }
    
    return `
        <div onclick="${action}" class="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 animate-fade-in">
            <!-- Header with Type Badge and Time -->
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="text-3xl">${icons[item.type] || '📄'}</div>
                    <span class="text-sm font-black bg-gradient-to-r ${typeColors[item.type] || 'from-slate-500 to-slate-700'} text-white px-4 py-1.5 rounded-full uppercase tracking-tight shadow-sm">
                        ${typeNames[item.type] || item.type}
                    </span>
                </div>
                <div class="text-right">
                    <span class="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                        <span class="text-yellow-500">🕒</span> ${timeStr}
                    </span>
                </div>
            </div>
            
            <!-- Featured Image -->
            ${item.imageUrl ? `
                <div class="mb-5 overflow-hidden rounded-xl border-2 border-slate-100 shadow-sm">
                    <img src="${item.imageUrl}" 
                         class="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                         alt="${item.title}"
                         loading="lazy">
                </div>` : ''}
            
            <!-- Title - LARGER FONT -->
            <h3 class="font-black text-xl md:text-2xl text-slate-800 leading-tight mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                ${item.title || 'Untitled'}
            </h3>
            
            <!-- Content Preview -->
            ${contentPreview ? `
                <div class="mb-4">
                    <p class="text-base text-slate-600 leading-relaxed line-clamp-2">
                        ${contentPreview}
                    </p>
                </div>` : ''}
            
            <!-- Stats and Meta Information -->
            <div class="flex flex-wrap gap-2 mb-5">
                ${item.questionCount ? `
                    <span class="text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium shadow-sm">
                        <span class="text-lg">📊</span> ${item.questionCount} প্রশ্ন
                    </span>` : ''}
                
                ${item.author ? `
                    <span class="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium shadow-sm">
                        <span class="text-lg">👤</span> ${item.author}
                    </span>` : ''}
                
                ${item.difficulty ? `
                    <span class="text-sm ${getDifficultyColor(item.difficulty)} px-3 py-1.5 rounded-full font-medium shadow-sm">
                        ${getDifficultyIcon(item.difficulty)} ${item.difficulty}
                    </span>` : ''}
                
                ${item.category ? `
                    <span class="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium shadow-sm">
                        📁 ${item.category}
                    </span>` : ''}
            </div>
            
            <!-- Footer with Path and View Button -->
            <div class="flex justify-between items-center pt-4 border-t border-slate-100">
                <div class="text-sm font-medium text-slate-500 truncate max-w-[50%] bg-slate-50 px-3 py-1.5 rounded-lg">
                    📂 ${item.path.replace('contents/', '') || 'মূল ফোল্ডার'}
                </div>
                <div class="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg font-bold group-hover:scale-105 transition shadow-lg">
                    👉 দেখুন
                </div>
            </div>
        </div>`;
}

// ডিফিকাল্টি কালার ফাংশন
function getDifficultyColor(difficulty) {
    const colors = {
        'সহজ': 'bg-green-100 text-green-700',
        'মাধ্যম': 'bg-yellow-100 text-yellow-700',
        'কঠিন': 'bg-red-100 text-red-700',
        'Easy': 'bg-green-100 text-green-700',
        'Medium': 'bg-yellow-100 text-yellow-700',
        'Hard': 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || 'bg-slate-100 text-slate-700';
}

// ডিফিকাল্টি আইকন ফাংশন
function getDifficultyIcon(difficulty) {
    const icons = {
        'সহজ': '✅',
        'মাধ্যম': '⚠️',
        'কঠিন': '❌',
        'Easy': '✅',
        'Medium': '⚠️',
        'Hard': '❌'
    };
    return icons[difficulty] || '📝';
}

// ৯. ফুল স্ক্রিন পোস্ট ভিউ
function openFullPost(postId, path = 'contents') {
    db.ref(`${path}/${postId}`).once('value', (snap) => {
        const data = snap.val();
        if (!data) {
            alert("পোস্ট লোড করা যায়নি!");
            return;
        }

        const fullView = document.getElementById('fullPostView');
        if (!fullView) {
            const newDiv = document.createElement('div');
            newDiv.id = 'fullPostView';
            newDiv.className = 'fixed inset-0 bg-white z-50 overflow-y-auto';
            document.body.appendChild(newDiv);
        }
        
        fullView.style.display = 'block';
        fullView.innerHTML = `
            <div class="full-content-wrapper p-4 md:p-8">
                <!-- Close Button -->
                <button class="close-btn fixed top-4 right-4 bg-white hover:bg-red-500 hover:text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg transition z-50" 
                        onclick="closeFullPost()">✕</button>
                
                <div class="full-body max-w-4xl mx-auto mt-4">
                    <!-- Post Header -->
                    <div class="mb-8">
                        <div class="flex flex-wrap items-center gap-2 mb-4">
                            <span class="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full font-bold">
                                ${data.type === 'post' ? '📝 আর্টিকেল' : 
                                  data.type === 'mcq_set' ? '📚 MCQ সেট' : 
                                  data.type === 'mcq' ? '❓ MCQ' : 
                                  data.type.toUpperCase()}
                            </span>
                            <span class="text-sm text-slate-600 flex items-center gap-1">
                                🕒 ${formatTime(data.timestamp)}
                            </span>
                            ${data.author ? `
                                <span class="text-sm text-slate-600 flex items-center gap-1">
                                    👤 ${data.author}
                                </span>` : ''}
                        </div>
                        
                        <h1 class="text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">
                            ${data.title || 'Untitled'}
                        </h1>
                        
                        ${data.subtitle ? `
                            <p class="text-xl text-slate-600 mb-6">
                                ${data.subtitle}
                            </p>` : ''}
                    </div>
                    
                    <!-- Featured Image -->
                    ${data.imageUrl ? `
                        <div class="mb-8">
                            <img src="${data.imageUrl}" alt="${data.title}" 
                                 class="w-full h-auto max-h-[500px] object-contain rounded-2xl shadow-lg mx-auto border border-slate-200">
                            ${data.imageCaption ? `
                                <p class="text-center text-sm text-slate-500 mt-2 italic">
                                    ${data.imageCaption}
                                </p>` : ''}
                        </div>` : ''}
                    
                    <!-- Content Body -->
                    <div class="prose prose-lg max-w-none mb-10">
                        ${data.type === 'mcq_set' ? 
                            `<div class="mcq-set-container">
                                <h2 class="text-2xl font-bold text-slate-800 mb-6">প্রশ্নসমূহ (${data.questions?.length || 0})</h2>
                                ${renderMcqForUser(data.questions)}
                            </div>` : 
                            `<div class="post-content text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                                ${data.body || '<p class="text-slate-500 italic">কোনো কন্টেন্ট নেই।</p>'}
                            </div>`}
                    </div>
                    
                    <!-- Additional Information -->
                    ${data.tags || data.category ? `
                        <div class="mt-10 pt-6 border-t border-slate-200">
                            <h3 class="text-lg font-bold text-slate-800 mb-3">ট্যাগস</h3>
                            <div class="flex flex-wrap gap-2">
                                ${data.tags ? data.tags.split(',').map(tag => `
                                    <span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                                        #${tag.trim()}
                                    </span>
                                `).join('') : ''}
                                ${data.category ? `
                                    <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                                        📁 ${data.category}
                                    </span>` : ''}
                            </div>
                        </div>` : ''}
                    
                    <!-- JSON Code (if exists) -->
                    ${data.jsonCode ? `
                        <div class="mt-10 bg-slate-900 rounded-2xl p-6">
                            <div class="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">JSON Code</div>
                            <pre class="text-green-400 overflow-x-auto text-sm p-4 bg-slate-800 rounded-lg"><code>${data.jsonCode}</code></pre>
                        </div>` : ''}
                    
                    <!-- Share Buttons -->
                    <div class="mt-10 pt-6 border-t border-slate-200 flex gap-4">
                        <button onclick="sharePost('${data.title}', '${window.location.href}')" 
                                class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition flex items-center gap-2">
                            📤 শেয়ার করুন
                        </button>
                        <button onclick="printPost()" 
                                class="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition flex items-center gap-2">
                            🖨️ প্রিন্ট করুন
                        </button>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="max-w-4xl mx-auto mt-10 pt-6 border-t border-slate-200">
                    <button onclick="closeFullPost()" 
                            class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-3 rounded-xl font-bold text-lg hover:scale-105 transition shadow-lg">
                        বন্ধ করুন
                    </button>
                </div>
            </div>
        `;
        
        if(window.MathJax) MathJax.typesetPromise();
    });
}

function closeFullPost() {
    const fullView = document.getElementById('fullPostView');
    if(fullView) fullView.style.display = 'none';
}

// শেয়ার ফাংশন
function sharePost(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: 'Dhumketu Educational Hub থেকে পড়ুন: ',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url)
            .then(() => alert('লিঙ্ক কপি হয়েছে!'))
            .catch(() => {
                const tempInput = document.createElement('input');
                tempInput.value = url;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                alert('লিঙ্ক কপি হয়েছে!');
            });
    }
}

// প্রিন্ট ফাংশন
function printPost() {
    window.print();
}

// ১০. MCQ ইউজার ভিউ
function renderMcqForUser(questions) {
    if (!questions || !Array.isArray(questions)) return '<p class="text-slate-500 text-center py-8">কোনো প্রশ্ন পাওয়া যায়নি।</p>';
    
    return questions.map((q, i) => {
        const optionsHtml = q.options ? 
            Object.entries(q.options).map(([key, val]) => 
                `<div class="opt-btn p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer">
                    <span class="font-bold text-slate-600 mr-2">${key})</span> ${val}
                </div>`
            ).join('') : 
            `<div class="opt-btn p-4 bg-white border-2 border-slate-200 rounded-xl">A) ${q.optionA || ''}</div>
             <div class="opt-btn p-4 bg-white border-2 border-slate-200 rounded-xl">B) ${q.optionB || ''}</div>
             <div class="opt-btn p-4 bg-white border-2 border-slate-200 rounded-xl">C) ${q.optionC || ''}</div>
             <div class="opt-btn p-4 bg-white border-2 border-slate-200 rounded-xl">D) ${q.optionD || ''}</div>`;
        
        return `
        <div class="mcq-item mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p class="mcq-q text-lg font-bold text-slate-800 mb-4"><span class="text-indigo-600">${i+1}.</span> ${q.question}</p>
            
            ${q.imageUrl ? `
                <div class="mb-6">
                    <img src="${q.imageUrl}" class="mcq-img max-w-full h-auto rounded-xl cursor-pointer mx-auto" 
                         onclick="window.open('${q.imageUrl}', '_blank')"
                         alt="MCQ Image">
                    <p class="text-xs text-center text-slate-500 mt-2">ছবি দেখতে ক্লিক করুন</p>
                </div>` : ''}
            
            <div class="options-grid grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                ${optionsHtml}
            </div>
            
            <details class="explanation-box bg-green-50 p-4 rounded-xl border border-green-200">
                <summary class="font-bold text-green-800 cursor-pointer flex items-center gap-2">
                    <span>📖</span> উত্তর ও ব্যাখ্যা দেখুন
                </summary>
                <div class="mt-3 pt-3 border-t border-green-200">
                    <p class="font-bold mb-2 text-green-700">সঠিক উত্তর: <span class="text-lg">${q.answer || 'নির্ধারিত হয়নি'}</span></p>
                    ${q.explanation ? `<p class="text-slate-700">${q.explanation}</p>` : '<p class="text-slate-500 italic">কোনো ব্যাখ্যা নেই।</p>'}
                </div>
            </details>
        </div>
        `;
    }).join('');
}

// ১১. MCQ সিস্টেম ফাংশনস
function openSingleMCQ(id, path) {
    db.ref(`${path}/${id}`).once('value', snapshot => {
        const q = snapshot.val();
        document.getElementById('viewModal').style.display = 'block';
        document.getElementById('exam-progress').classList.add('hidden');
        document.getElementById('mcq-navigation').classList.add('hidden');
        document.getElementById('single-mcq-footer').classList.remove('hidden');
        
        document.getElementById('m-title').innerText = "Single MCQ";
        let html = `<p class="mb-6 font-bold text-xl text-slate-800">${q.question || q.title}</p>`;
        
        if (q.imageUrl) {
            html += `<img src="${q.imageUrl}" class="w-full h-auto rounded-xl mb-6 border border-slate-200" alt="MCQ Image">`;
        }
        
        html += `<div class="grid gap-4">`;
        
        if (q.options) {
            Object.keys(q.options).forEach(opt => {
                html += `<button onclick="checkSingleAns(this, '${opt}', '${q.answer}')" class="w-full text-left p-5 border-2 border-slate-100 rounded-2xl font-bold flex items-center group transition hover:border-indigo-300 hover:bg-indigo-50">
                    <span class="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-100 transition">${opt}</span>
                    ${q.options[opt]}</button>`;
            });
        }
        
        html += `<div id="expl" class="hidden p-6 bg-green-50 rounded-2xl border border-green-200 mt-6">
                    <p class="font-bold text-green-800 mb-2">📝 ব্যাখ্যা:</p>
                    <p class="text-slate-700">${q.explanation || 'কোনো ব্যাখ্যা নেই।'}</p>
                </div></div>`;
        
        document.getElementById('m-body').innerHTML = html;
        if(window.MathJax) MathJax.typesetPromise();
    });
}

function checkSingleAns(btn, selected, correct) {
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => b.onclick = null);
    
    if(selected === correct) {
        btn.classList.add('option-correct');
        btn.innerHTML += '<span class="ml-2 text-green-600">✓</span>';
    } else {
        btn.classList.add('option-wrong');
        buttons.forEach(b => { 
            if(b.innerText.startsWith(correct)) {
                b.classList.add('option-correct');
                b.innerHTML += '<span class="ml-2 text-green-600">✓</span>';
            }
        });
    }
    document.getElementById('expl').classList.remove('hidden');
}

function openMCQSet(id, path) {
    db.ref(`${path}/${id}`).once('value', s => {
        const data = s.val();
        currentMCQSet = data.questions || [];
        currentQuestionIndex = 0;
        userScore = 0;
        document.getElementById('viewModal').style.display = 'block';
        document.getElementById('exam-progress').classList.remove('hidden');
        document.getElementById('mcq-navigation').classList.remove('hidden');
        document.getElementById('single-mcq-footer').classList.add('hidden');
        showQuestion();
    });
}

function showQuestion() {
    if (currentMCQSet.length === 0) {
        document.getElementById('m-body').innerHTML = '<p class="text-center text-slate-500 py-8">কোনো প্রশ্ন নেই।</p>';
        return;
    }
    
    const q = currentMCQSet[currentQuestionIndex];
    document.getElementById('m-title').innerText = `প্রশ্ন ${currentQuestionIndex + 1}`;
    document.getElementById('progress-text').innerText = `Question ${currentQuestionIndex + 1} of ${currentMCQSet.length}`;
    document.getElementById('progress-fill').style.width = `${((currentQuestionIndex + 1) / currentMCQSet.length) * 100}%`;
    document.getElementById('score-text').innerText = `Score: ${userScore} / ${currentMCQSet.length}`;

    let html = `<p class="mb-6 font-bold text-xl text-slate-800">${q.question}</p>`;
    
    if (q.imageUrl) {
        html += `<img src="${q.imageUrl}" class="w-full h-auto rounded-xl mb-6 border border-slate-200" alt="Question Image">`;
    }
    
    html += `<div class="grid gap-4">`;
    
    if (q.options) {
        Object.keys(q.options).forEach(opt => {
            html += `<button onclick="checkSetAns(this, '${opt}', '${q.answer}')" class="text-left p-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition flex items-center group">
                <span class="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mr-4 font-bold text-slate-600 group-hover:bg-white transition">${opt}</span>
                ${q.options[opt]}</button>`;
        });
    }
    
    document.getElementById('m-body').innerHTML = html + `</div>`;
    if(window.MathJax) MathJax.typesetPromise();
}

function checkSetAns(btn, selected, correct) {
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => b.onclick = null);
    
    if(selected === correct) { 
        btn.classList.add('option-correct');
        btn.innerHTML += '<span class="ml-2 text-green-600">✓</span>';
        userScore++; 
    } else {
        btn.classList.add('option-wrong');
        btn.innerHTML += '<span class="ml-2 text-red-600">✗</span>';
        buttons.forEach(b => { 
            if(b.innerText.includes(correct)) {
                b.classList.add('option-correct');
                b.innerHTML += '<span class="ml-2 text-green-600">✓</span>';
            }
        });
    }
    document.getElementById('score-text').innerText = `Score: ${userScore} / ${currentMCQSet.length}`;
}

// ১২. নোটিশ সেটআপ
function setupUpdates() {
    // টিচার প্রোফাইল সিঙ্ক
    db.ref('teacher').on('value', snap => {
        const t = snap.val();
        if (!t) return;

        const photoContainer = document.getElementById('t-photo-container');
        if (photoContainer) {
            if (t.photo) {
                photoContainer.innerHTML = `<img src="${t.photo}" alt="Teacher" class="w-full h-full object-cover rounded-full shadow-md border-4 border-white/20">`;
            } else {
                photoContainer.innerHTML = `<span class="text-5xl">👨‍🎓</span>`;
            }
        }

        const mappings = {
            't-name': t.name || 'Loading...',
            't-qualification': t.qualification || 'Loading...',
            't-specialty': t.specialty || 'Loading...',
            't-hours': t.hours || '9:00 AM - 5:00 PM',
            't-email': t.email || 'example@email.com',
            't-location': t.location || 'Dhaka, Bangladesh'
        };

        for (let id in mappings) {
            const el = document.getElementById(id);
            if (el) el.innerText = mappings[id];
        }

        // সোশ্যাল লিঙ্ক আপডেট
        if (t.whatsapp) {
            const waLink = document.getElementById('t-wa');
            if (waLink) {
                const cleanNumber = t.whatsapp.replace(/\D/g, '');
                waLink.href = `https://wa.me/${cleanNumber}`;
                waLink.innerHTML = `WhatsApp Chat`;
            }
        }
        
        if (t.facebook) {
            const fbLink = document.getElementById('t-fb');
            if (fbLink) {
                fbLink.href = t.facebook;
                fbLink.innerHTML = 'Facebook Profile';
            }
        }
        
        if (t.blog) {
            const blogLink = document.getElementById('t-blog');
            const headerBlog = document.getElementById('blog-btn');
            if (blogLink) blogLink.href = t.blog;
            if (headerBlog) headerBlog.onclick = () => window.open(t.blog, '_blank');
        }
    });

    // নোটিশ মার্কি সেটআপ
    setupNoticeMarquee();
    
    // নোটিশ রিয়েল-টাইম আপডেট
    db.ref('notices').on('value', () => {
        setupNoticeMarquee();
    });
}

// ১৩. ইউটিলিটি ফাংশনস
function nextQuestion() {
    if(currentQuestionIndex < currentMCQSet.length - 1) { 
        currentQuestionIndex++; 
        showQuestion(); 
    } else { 
        alert(`🎉 পরীক্ষা শেষ! আপনার স্কোর: ${userScore} / ${currentMCQSet.length}`);
        closeModal(); 
    }
}

function prevQuestion() { 
    if(currentQuestionIndex > 0) { 
        currentQuestionIndex--; 
        showQuestion(); 
    }
}

function goBack() {
    const parts = currentPath.split('/');
    if(parts.length > 1) { 
        parts.pop(); 
        loadSection(parts.join('/')); 
    }
}

function closeModal() { 
    document.getElementById('viewModal').style.display = 'none'; 
}

function showLoading(s) { 
    const loading = document.getElementById('loading-state');
    if (loading) loading.style.display = s ? 'block' : 'none'; 
}

function updateNavUI(btn) { 
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-active'));
    if(btn) btn.classList.add('nav-active');
}

function openBlogLink() {
    db.ref('teacher').once('value', snap => {
        const t = snap.val();
        if (t && t.blog) {
            window.open(t.blog, '_blank');
        } else {
            alert('ব্লগ লিঙ্ক পাওয়া যায়নি।');
        }
    });
}

function openGemini() { 
    window.open('https://gemini.google.com/', '_blank'); 
}

function scrollToTeacher() { 
    document.getElementById('teacher-details').scrollIntoView({behavior: 'smooth'}); 
}

function showMathHelp() { 
    document.getElementById('math-help-modal').classList.remove('hidden'); 
}

function hideMathHelp() { 
    document.getElementById('math-help-modal').classList.add('hidden'); 
}

function copyMathToClipboard() {
    const mathElements = document.querySelectorAll('.math-equation');
    if (mathElements.length > 0) {
        const text = Array.from(mathElements).map(el => el.innerText).join('\n');
        navigator.clipboard.writeText(text)
            .then(() => alert('সমীকরণ কপি করা হয়েছে!'))
            .catch(err => alert('কপি করতে সমস্যা: ' + err));
    }
}

function askGemini() {
    const prompt = document.getElementById('aiPrompt')?.value;
    if (!prompt) {
        alert("প্রথমে কিছু লিখুন!");
        return;
    }
    const responseArea = document.getElementById('aiResponse');
    responseArea.innerHTML += `<p class="text-green-400">You: ${prompt}</p>`;
    responseArea.innerHTML += `<p class="text-yellow-400">Gemini: এই ফিচারটি Gemini API ইন্টিগ্রেশনের জন্য প্রস্তুত।</p>`;
    document.getElementById('aiPrompt').value = '';
    responseArea.scrollTop = responseArea.scrollHeight;
}

// ১৪. ফিল্টার ফাংশনস (MCQ)
function filterMCQByClass(className) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // Implement your filtering logic here
}

function filterMCQBySubject(subject) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // Implement your filtering logic here
}

function toggleMathDisplay(mode) {
    document.querySelectorAll('.math-display-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
    // Implement math display toggle logic here
}

// ১৫. পেজ স্টার্ট
document.addEventListener('DOMContentLoaded', () => {
    // ক্লক শুরু
    updateLiveClock();
    
    // কন্টেন্ট লোড
    loadSection('contents');
    
    // আপডেট সেটআপ
    setupUpdates();
    
    // Google Translate
    function googleTranslateElementInit() {
        new google.translate.TranslateElement({
            pageLanguage: 'bn',
            includedLanguages: 'en,bn,hi,ar',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
    }
    
    if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);
    }
    
    window.googleTranslateElementInit = googleTranslateElementInit;
});