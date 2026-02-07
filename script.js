/**
 * DHUMKETU MASTER SCRIPT - 2026 (FINAL RECURSIVE EDITION)
 * Features: Folder Navigation, Deep Search Filter, MCQ System, MathJax Support
 */

// ১. ফায়ারবেস কনফিগারেশন
const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};

// ইনিশিয়ালাইজেশন
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
// ইউজারদের জন্য সময় দেখানোর ফাংশন
// ১. সময় ফরম্যাট (বাংলায়)
function formatTime(ts) {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ২. কন্টেন্ট কার্ড তৈরি (Title Card & Style)
function renderPostCard(item) {
    const timeStr = formatTime(item.timestamp);
    const typeIcon = item.type === 'mcq_set' ? '📚' : '📝';

    return `
        <div class="post-card" onclick="openFullPost('${item.id}')">
            <div class="card-header">
                <span class="type-badge">${typeIcon} ${item.type.toUpperCase()}</span>
                <span class="time-stamp">🕒 ${timeStr}</span>
            </div>
            <h2 class="post-title">${item.title}</h2>
            ${item.imageUrl ? `<img src="${item.imageUrl}" class="card-img">` : ''}
            <div class="card-footer">পড়তে ক্লিক করুন →</div>
        </div>
    `;
}

// ৩. ফুল স্ক্রিন পোস্ট দেখার ফাংশন (Full Screen Post View)
function openFullPost(postId) {
    db.ref('contents').child(postId).once('value', (snap) => {
        const data = snap.val();
        if (!data) return;

        // ফুল স্ক্রিন কন্টেইনার তৈরি
        const fullView = document.getElementById('fullPostView'); 
        fullView.style.display = 'block';
        fullView.innerHTML = `
            <div class="full-content-wrapper">
                <button class="close-btn" onclick="closeFullPost()">✕</button>
                <div class="full-body">
                    <h1 class="full-title">${data.title}</h1>
                    <p class="full-time">🕒 প্রকাশিত: ${formatTime(data.timestamp)}</p>
                    <hr>
                    
                    ${data.type === 'mcq_set' ? renderMcqForUser(data.questions) : `<div class="post-text">${data.body || ''}</div>`}
                </div>
            </div>
        `;
    });
}

// ৪. MCQ ছবিসহ ইউজার ভিউ (MCQ with Image Fix)
function renderMcqForUser(questions) {
    if (!questions) return '<p>কোনো প্রশ্ন পাওয়া যায়নি।</p>';
    
    return questions.map((q, i) => `
        <div class="mcq-item">
            <p class="mcq-q"><b>${i+1}. ${q.question}</b></p>
            
            ${q.imageUrl ? `<img src="${q.imageUrl}" class="mcq-img" onclick="window.open('${q.imageUrl}')">` : ''}
            
            <div class="options-grid">
                ${Object.entries(q.options || {}).map(([key, val]) => `
                    <div class="opt-btn">(${key}) ${val}</div>
                `).join('')}
            </div>
            
            <details class="explanation-box">
                <summary>ব্যাখ্যা দেখুন</summary>
                <p>সঠিক উত্তর: <b>${q.answer}</b></p>
                <p>${q.explanation || 'কোনো ব্যাখ্যা নেই।'}</p>
            </details>
        </div>
    `).join('');
}

function closeFullPost() {
    document.getElementById('fullPostView').style.display = 'none';
}

// আপনার ইনডেক্স পেজের পোস্ট কার্ডের কোডটি অনেকটা এরকম হবে:
function displayItem(item) {
    return `
        <div class="card">
            <img src="${item.imageUrl || 'default.jpg'}" alt="">
            <div class="card-details">
                <h3>${item.title}</h3>
                
                <div class="post-time" style="font-size: 10px; color: #888; margin-top: 5px;">
                    🕒 প্রকাশিত: ${formatTime(item.timestamp)}
                </div>
                
                <button onclick="openPost('${item.id}')">Read More</button>
            </div>
        </div>
    `;
}

// ২. মেইন ডাটা লোডার (Folder Navigation)
function loadSection(path, btn = null) {
    currentPath = path;
    currentFilter = null; // নতুন সেকশনে ঢুকলে ফিল্টার অফ হবে
    if(btn) updateNavUI(btn);
    
    showLoading(true);
    document.getElementById('breadcrumb').innerHTML = `🏠 ${path.toUpperCase().replace(/\//g, ' › ')}`;
    
    const backBtn = document.getElementById('back-btn');
    if(backBtn) backBtn.classList.toggle('hidden', path === 'contents');

    db.ref(path).on('value', snapshot => {
        showLoading(false);
        const data = snapshot.val() || {};
        renderUI(data, path);
    });
}
function loadManageContent() {
    const list = document.getElementById('manage-list');
    list.innerHTML = `<div class="p-10 text-center text-slate-400">অপেক্ষা করুন...</div>`;
    
    db.ref('contents').on('value', (snapshot) => {
        const allData = snapshot.val();
        list.innerHTML = "";
        
        if (!allData) {
            list.innerHTML = `<div class="p-10 text-center text-slate-400">কোনো পোস্ট পাওয়া যায়নি।</div>`;
            return;
        }

        function processNode(node, path) {
            Object.keys(node).forEach(key => {
                const item = node[key];
                if (item.title || item.type) {
                    const itemPath = `${path}/${key}`;
                    const typeIcon = item.type === 'mcq_set' ? '📚' : '📝';
                    
                    list.innerHTML += `
                        <div class="p-4 mb-3 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl">${typeIcon}</div>
                                <div>
                                    <h4 class="font-bold text-slate-800">${item.title || "টাইটেল নেই"}</h4>
                                    <p class="text-[10px] text-indigo-500 font-bold mt-1">🕒 প্রকাশিত: ${formatTime(item.timestamp)}</p>
                                </div>
                            </div>
                            <button onclick="deleteItem('${itemPath}')" class="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition">
                                🗑️
                            </button>
                        </div>`;
                } else if (typeof item === 'object') {
                    processNode(item, `${path}/${key}`);
                }
            });
        }
        processNode(allData, 'contents');
    });
}

// ৩. গ্রিড রেন্ডারিং (হোমে ফোল্ডার, ভেতরে শুধু ফাইল)
function renderUI(data, path) {
    const folderGrid = document.getElementById('folder-grid');
    const contentGrid = document.getElementById('content-grid');
    const noResults = document.getElementById('no-results');
    const viewTitle = document.getElementById('view-title');

    folderGrid.innerHTML = '';
    contentGrid.innerHTML = '';
    let hasItems = false;
    const isHomePage = (path === 'contents');

    Object.keys(data).forEach(key => {
        const item = data[key];
        
        // কন্টেন্ট রেন্ডার (সব জায়গায় দেখাবে)
        if (item && item.type) {
            contentGrid.innerHTML += createCard({id: key, path: path, ...item});
            hasItems = true;
        } 
        // ফোল্ডার রেন্ডার (শুধুমাত্র হোমে)
        else if (item && typeof item === 'object' && isHomePage) {
            folderGrid.innerHTML += `
                <div onclick="loadSection('${path}/${key}')" class="cursor-pointer bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-xl transition text-center group active:scale-95">
                    <div class="text-5xl mb-3 group-hover:scale-110 transition">📁</div>
                    <div class="text-sm font-black text-slate-700 uppercase tracking-tighter">${key}</div>
                </div>`;
            hasItems = true;
        }
        // ফোল্ডারের ভেতরে সাব-ফোল্ডার থাকলে তার ভেতরের ফাইলগুলোকে সরাসরি বের করে আনা (Recursive)
        else if (item && typeof item === 'object' && !isHomePage) {
            Object.keys(item).forEach(subKey => {
                const subItem = item[subKey];
                if(subItem && subItem.type) {
                    contentGrid.innerHTML += createCard({id: subKey, path: `${path}/${key}`, ...subItem});
                    hasItems = true;
                }
            });
        }
    });

    viewTitle.innerText = isHomePage ? "Recent Uploads" : path.split('/').pop().toUpperCase();
    if(noResults) noResults.classList.toggle('hidden', hasItems);
    if(window.MathJax) MathJax.typesetPromise();
}

// ৪. ক্যাটাগরি ফিল্টার (Deep Search - সব ফোল্ডার থেকে ফাইল খুঁজবে)
function filterType(type, btn) {
    currentFilter = (currentFilter === type) ? null : type;
    updateNavUI(btn);

    const contentGrid = document.getElementById('content-grid');
    const folderGrid = document.getElementById('folder-grid');
    const viewTitle = document.getElementById('view-title');

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
                        // স্পেসিফিক টাইপ ম্যাচিং
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
            viewTitle.innerText = `All ${type.toUpperCase()}s (${foundCount})`;
            document.getElementById('no-results').classList.toggle('hidden', foundCount > 0);
            if(window.MathJax) MathJax.typesetPromise();
        });
    } else {
        loadSection('contents');
    }
}

// ৫. কন্টেন্ট কার্ড টেমপ্লেট
function createCard(item) {
    const icons = { mcq_set: '📚', mcq: '❓', video: '🎥', image: '🖼️', pdf: '📄', post: '📝' };
    const action = item.type === 'mcq_set' ? `openMCQSet('${item.id}', '${item.path}')` : 
                   item.type === 'mcq' ? `openSingleMCQ('${item.id}', '${item.path}')` : 
                   item.type === 'post' ? `openPost('${item.id}', '${item.path}')` : 
                   `window.open('${item.url || '#'}', '_blank')`;

    return `
        <div onclick="${action}" class="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 hover:shadow-2xl transition cursor-pointer group animate-fade-in">
            <div class="flex justify-between items-start mb-4">
                <div class="text-3xl">${icons[item.type] || '📄'}</div>
                <span class="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-tighter">${item.type}</span>
            </div>
            ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-32 object-cover rounded-2xl mb-4 border border-slate-50">` : ''}
            <h3 class="font-bold text-slate-800 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">${item.title}</h3>
            <div class="text-[9px] font-bold text-slate-400">PATH: ${item.path.replace('contents/', '')}</div>
        </div>`;
}

// ৬. ভিউয়ার ফাংশনস (Post, MCQ, MCQ Set)
function openPost(id, path) {
    db.ref(`${path}/${id}`).once('value', s => {
        const item = s.val();
        document.getElementById('viewModal').style.display = 'block';
        
        let bodyHtml = item.imageUrl ? `<img src="${item.imageUrl}" class="w-full rounded-3xl mb-6">` : '';
        bodyHtml += `<div class="prose max-w-none text-slate-700 whitespace-pre-wrap mb-4">${item.body || ''}</div>`;
        
        // যদি JSON কোড থাকে তবে সেটি কোড ব্লকে দেখাবে
        if(item.jsonCode) {
            bodyHtml += `
                <div class="mt-6 bg-slate-900 rounded-2xl p-6 relative group">
                    <div class="absolute right-4 top-4 text-[10px] text-slate-500 font-bold uppercase">JSON CODE</div>
                    <pre class="text-green-400 overflow-x-auto font-mono text-sm leading-relaxed"><code>${item.jsonCode}</code></pre>
                </div>`;
        }
        
        document.getElementById('m-body').innerHTML = bodyHtml;
        document.getElementById('m-title').innerText = item.title;
        if(window.MathJax) MathJax.typesetPromise();
    });
}


function openSingleMCQ(id, path) {
    db.ref(`${path}/${id}`).once('value', snapshot => {
        const q = snapshot.val();
        document.getElementById('viewModal').style.display = 'block';
        document.getElementById('exam-progress').classList.add('hidden');
        document.getElementById('mcq-navigation').classList.add('hidden');
        document.getElementById('single-mcq-footer').classList.remove('hidden');
        
        document.getElementById('m-title').innerText = "Single MCQ";
        let html = `<p class="mb-6 font-bold text-xl">${q.question || q.title}</p><div class="grid gap-4">`;
        Object.keys(q.options).forEach(opt => {
            html += `<button onclick="checkSingleAns(this, '${opt}', '${q.answer}')" class="w-full text-left p-5 border-2 border-slate-100 rounded-2xl font-bold flex items-center group transition">
                <span class="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-100">${opt}</span>
                ${q.options[opt]}</button>`;
        });
        html += `<div id="expl" class="hidden p-6 bg-green-50 rounded-2xl border border-green-200 mt-6"><p class="font-bold text-green-800">ব্যাখ্যা:</p><p>${q.explanation || 'নেই'}</p></div></div>`;
        document.getElementById('m-body').innerHTML = html;
        if(window.MathJax) MathJax.typesetPromise();
    });
}

function checkSingleAns(btn, selected, correct) {
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => b.onclick = null);
    if(selected === correct) btn.classList.add('option-correct');
    else {
        btn.classList.add('option-wrong');
        buttons.forEach(b => { if(b.innerText.startsWith(correct)) b.classList.add('option-correct'); });
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
    const q = currentMCQSet[currentQuestionIndex];
    document.getElementById('m-title').innerText = `প্রশ্ন ${currentQuestionIndex + 1}`;
    document.getElementById('progress-text').innerText = `Question ${currentQuestionIndex + 1} of ${currentMCQSet.length}`;
    document.getElementById('progress-fill').style.width = `${((currentQuestionIndex + 1) / currentMCQSet.length) * 100}%`;
    document.getElementById('score-text').innerText = `Score: ${userScore} / ${currentMCQSet.length}`;

    let html = `<p class="mb-8 font-bold text-xl text-slate-800">${q.question}</p><div class="grid gap-4">`;
    Object.keys(q.options).forEach(opt => {
        html += `<button onclick="checkSetAns(this, '${opt}', '${q.answer}')" class="text-left p-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition flex items-center group">
            <span class="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mr-4 font-bold text-slate-600 group-hover:bg-white">${opt}</span>
            ${q.options[opt]}</button>`;
    });
    document.getElementById('m-body').innerHTML = html + `</div>`;
    if(window.MathJax) MathJax.typesetPromise();
}

function checkSetAns(btn, selected, correct) {
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => b.onclick = null);
    if(selected === correct) { btn.classList.add('option-correct'); userScore++; }
    else {
        btn.classList.add('option-wrong');
        buttons.forEach(b => { if(b.innerText.includes(correct)) b.classList.add('option-correct'); });
    }
    document.getElementById('score-text').innerText = `Score: ${userScore} / ${currentMCQSet.length}`;
}

// ৭. ইউটিলিটি ফাংশনস
function nextQuestion() {
    if(currentQuestionIndex < currentMCQSet.length - 1) { currentQuestionIndex++; showQuestion(); }
    else { alert("পরীক্ষা শেষ! স্কোর: " + userScore); closeModal(); }
}

function prevQuestion() { if(currentQuestionIndex > 0) { currentQuestionIndex--; showQuestion(); } }

function goBack() {
    const parts = currentPath.split('/');
    if(parts.length > 1) { parts.pop(); loadSection(parts.join('/')); }
}

function closeModal() { document.getElementById('viewModal').style.display = 'none'; }
function showLoading(s) { document.getElementById('loading-state').style.display = s ? 'block' : 'none'; }

function updateNavUI(btn) { 
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-active'));
    if(btn) btn.classList.add('nav-active');
}

// ৮. রিয়েলটাইম আপডেট
/**
 * USER SIDE: Sync Profile from Firebase
 */
function setupUpdates() {
    // টিচার প্রোফাইল সিঙ্ক
    db.ref('teacher').on('value', snap => {
        const t = snap.val();
        if (!t) return;

        // ছবির জন্য লজিক
        const photoContainer = document.getElementById('t-photo-container');
        if (photoContainer) {
            if (t.photo) {
                photoContainer.innerHTML = `<img src="${t.photo}" alt="Teacher" class="w-full h-full object-cover rounded-full shadow-md border-2 border-white">`;
            } else {
                photoContainer.innerHTML = `<span class="text-5xl">👨‍🎓</span>`; // ডিফল্ট ইমোজি
            }
        }

        // টেক্সট ফিল্ডগুলো আপডেট (ID-র সাথে মিলিয়ে)
        const mappings = {
            't-name': t.name,
            't-qualification': t.qualification,
            't-specialty': t.specialty,
            't-hours': t.hours,
            't-email': t.email,
            't-location': t.location
        };

        for (let id in mappings) {
            const el = document.getElementById(id);
            if (el && mappings[id]) el.innerText = mappings[id];
        }

        // সোশ্যাল মিডিয়া লিঙ্ক আপডেট
        if (document.getElementById('t-wa')) document.getElementById('t-wa').href = `https://wa.me/${t.whatsapp}`;
        if (document.getElementById('t-fb')) document.getElementById('t-fb').href = t.facebook;
        
        const blogBtn = document.getElementById('t-blog');
        const headerBlog = document.getElementById('blog-btn');
        if (t.blog) {
            if (blogBtn) blogBtn.href = t.blog;
            if (headerBlog) headerBlog.onclick = () => window.open(t.blog, '_blank');
        }
    });

    // নোটিশ আপডেট (Marquee)
    db.ref('notices').limitToLast(1).on('value', snap => {
        const val = snap.val();
        if (val) {
            const lastNotice = Object.values(val)[0];
            const noticeEl = document.getElementById('notice-marquee');
            if (noticeEl) noticeEl.innerText = lastNotice.text || lastNotice;
        }
    });
}


function openGemini() { window.open('https://gemini.google.com/', '_blank'); }
function scrollToTeacher() { document.getElementById('teacher-details').scrollIntoView({behavior: 'smooth'}); }
function showMathHelp() { document.getElementById('math-help-modal').classList.remove('hidden'); }
function hideMathHelp() { document.getElementById('math-help-modal').classList.add('hidden'); }

// পেজ স্টার্ট
document.addEventListener('DOMContentLoaded', () => {
    loadSection('contents');
    setupUpdates();
});
