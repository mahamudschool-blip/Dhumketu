/**
 * DHUMKETU MASTER SCRIPT - 2026 (FINAL UPDATED)
 * Fixed: Title Card UI, MCQ Image Preview, Full Screen View
 */

const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentPath = 'contents';
let currentMCQSet = [];
let currentQuestionIndex = 0;
let userScore = 0;

// ১. সময় ফরম্যাট (বাংলায়)
function formatTime(ts) {
    if (!ts) return "";
    const date = new Date(ts);
    return date.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ২. কন্টেন্ট কার্ড টেমপ্লেট (Title Card UI Fix)
function createCard(item) {
    const icons = { mcq_set: '📚', video: '🎥', pdf: '📄', post: '📝' };
    const timeStr = formatTime(item.timestamp);
    
    // কার্ডে ক্লিক করলে টাইপ অনুযায়ী অ্যাকশন
    const action = item.type === 'mcq_set' ? `openFullPost('${item.id}', '${item.path}')` : 
                   item.type === 'post' ? `openFullPost('${item.id}', '${item.path}')` : 
                   `window.open('${item.url || '#'}', '_blank')`;

    return `
        <div onclick="${action}" class="post-card bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 hover:shadow-2xl transition cursor-pointer group animate-fade-in flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                        ${icons[item.type] || '📄'} ${item.type.replace('_', ' ')}
                    </span>
                    <span class="text-[10px] text-slate-400 font-bold">🕒 ${timeStr}</span>
                </div>
                ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-40 object-cover rounded-2xl mb-4 border border-slate-50">` : ''}
                <h3 class="font-bold text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors text-lg">${item.title}</h3>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">${item.path.split('/').pop()}</span>
                <span class="text-indigo-500 font-black text-xs">পড়ুন →</span>
            </div>
        </div>`;
}

// ৩. ফুল স্ক্রিন পোস্ট ভিউ (Full Screen & MCQ Image Fix)
function openFullPost(id, path) {
    db.ref(`${path}/${id}`).once('value', s => {
        const item = s.val();
        if(!item) return;

        const fullView = document.getElementById('fullPostView');
        if(!fullView) return alert("Error: fullPostView element not found!");

        fullView.style.display = 'block';
        document.body.style.overflow = 'hidden'; // ব্যাকগ্রাউন্ড স্ক্রল বন্ধ

        let contentHtml = "";

        if (item.type === 'mcq_set') {
            currentMCQSet = item.questions || [];
            contentHtml = renderMcqForUser(currentMCQSet);
        } else {
            contentHtml = `
                <div class="prose max-w-none text-slate-700">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full rounded-3xl mb-6 shadow-lg">` : ''}
                    <div class="whitespace-pre-wrap leading-relaxed text-lg">${item.body || ''}</div>
                    ${item.jsonCode ? `<div class="mt-6 bg-slate-900 rounded-2xl p-6 overflow-x-auto text-green-400 font-mono text-sm"><code>${item.jsonCode}</code></div>` : ''}
                </div>`;
        }

        fullView.innerHTML = `
            <div class="fixed inset-0 bg-white z-[9999] overflow-y-auto animate-slide-up">
                <div class="max-w-3xl mx-auto p-6 pb-20">
                    <div class="flex justify-between items-center mb-8 sticky top-0 bg-white/90 backdrop-blur py-4 z-10 border-b">
                        <button onclick="closeFullPost()" class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">✕</button>
                        <span class="text-[10px] font-black uppercase text-indigo-500 tracking-widest">${item.type}</span>
                    </div>
                    <h1 class="text-3xl font-black text-slate-900 leading-tight mb-2">${item.title}</h1>
                    <p class="text-sm text-slate-400 mb-8">🕒 প্রকাশিত: ${formatTime(item.timestamp)}</p>
                    ${contentHtml}
                </div>
            </div>`;
        
        if(window.MathJax) MathJax.typesetPromise();
    });
}

// ৪. MCQ ছবিসহ ইউজার ভিউ লজিক (IMAGE FIX)
function renderMcqForUser(questions) {
    return questions.map((q, i) => `
        <div class="mb-10 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
            <div class="flex gap-4 mb-4">
                <span class="w-8 h-8 bg-indigo-600 text-white rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm">${i+1}</span>
                <p class="font-bold text-slate-800 text-lg leading-snug">${q.question}</p>
            </div>
            
            ${q.imageUrl ? `<div class="mb-6 rounded-2xl overflow-hidden border-4 border-white shadow-sm">
                <img src="${q.imageUrl}" class="w-full h-auto cursor-zoom-in" onclick="window.open('${q.imageUrl}')">
            </div>` : ''}
            
            <div class="grid gap-3">
                ${Object.entries(q.options || {}).map(([key, val]) => `
                    <div class="p-4 bg-white rounded-2xl border border-slate-200 text-slate-700 font-medium flex items-center gap-3">
                        <span class="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-[10px] font-black text-slate-400">${key}</span>
                        ${val}
                    </div>
                `).join('')}
            </div>
            
            <details class="mt-4 group">
                <summary class="list-none cursor-pointer text-indigo-600 font-bold text-sm flex items-center gap-2">
                    <span class="group-open:rotate-180 transition-transform">▼</span> সঠিক উত্তর ও ব্যাখ্যা
                </summary>
                <div class="mt-3 p-4 bg-green-50 rounded-2xl border border-green-100 text-green-900 animate-fade-in">
                    <p class="font-black mb-1">সঠিক উত্তর: ${q.answer}</p>
                    <p class="text-sm opacity-80">${q.explanation || 'কোনো ব্যাখ্যা নেই।'}</p>
                </div>
            </details>
        </div>
    `).join('');
}

function closeFullPost() {
    document.getElementById('fullPostView').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ৫. গ্রিড রেন্ডারিং (Fix for Folder Grid)
function renderUI(data, path) {
    const folderGrid = document.getElementById('folder-grid');
    const contentGrid = document.getElementById('content-grid');
    const viewTitle = document.getElementById('view-title');

    folderGrid.innerHTML = '';
    contentGrid.innerHTML = '';
    let hasItems = false;
    const isHomePage = (path === 'contents');

    Object.keys(data).forEach(key => {
        const item = data[key];
        if (item && item.type) {
            contentGrid.innerHTML += createCard({id: key, path: path, ...item});
            hasItems = true;
        } else if (item && typeof item === 'object' && isHomePage) {
            folderGrid.innerHTML += `
                <div onclick="loadSection('${path}/${key}')" class="cursor-pointer bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-xl transition text-center group active:scale-95">
                    <div class="text-5xl mb-3 group-hover:scale-110 transition">📁</div>
                    <div class="text-sm font-black text-slate-700 uppercase tracking-tighter">${key}</div>
                </div>`;
            hasItems = true;
        }
    });

    viewTitle.innerText = isHomePage ? "Recent Uploads" : path.split('/').pop().toUpperCase();
    if(window.MathJax) MathJax.typesetPromise();
}

// ক্যাটাগরি ফিল্টার এবং অন্যান্য আগের ফাংশনগুলো নিচের দিকে থাকবে...
function loadSection(path, btn = null) {
    currentPath = path;
    showLoading(true);
    db.ref(path).on('value', snapshot => {
        showLoading(false);
        renderUI(snapshot.val() || {}, path);
    });
}

function showLoading(s) { document.getElementById('loading-state').style.display = s ? 'block' : 'none'; }

document.addEventListener('DOMContentLoaded', () => {
    loadSection('contents');
    setupUpdates(); // প্রোফাইল সিঙ্ক ফাংশন (আপনার কোড থেকে)
});


