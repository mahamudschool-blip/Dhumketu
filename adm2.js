/**
 * DHUMKETU ADMIN MASTER SCRIPT - 2026 (FINAL FIXED)
 */

const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// গ্লোবাল ভ্যারিয়েবল (এডিট ট্র্যাক করার জন্য)
let isEditMode = false;
let editId = null;
let editPath = null;
let tempMcqSet = [];

// ১. এডিট ফাংশন (Manage ট্যাব থেকে কল হবে)
window.editPost = function(id, path) {
    isEditMode = true;
    editId = id;
    editPath = path;

    db.ref(`${path}/${id}`).once('value', snapshot => {
        const item = snapshot.val();
        if (!item) return alert("ডাটা খুঁজে পাওয়া যায়নি!");

        showTab('upload-tab'); // আপলোড ফর্মে নিয়ে যাবে

        // ফর্মে ডাটা বসানো
        document.getElementById('dbPath').value = path;
        document.getElementById('postTitle').value = item.title || "";
        document.getElementById('contentType').value = item.type;

        if (item.type === 'post') {
            document.getElementById('postBody').value = item.body || "";
            document.getElementById('postJson').value = item.jsonCode || "";
        } else if (item.type === 'video' || item.type === 'pdf') {
            document.getElementById('contentUrl').value = item.url || item.link || "";
        } else if (item.type === 'mcq') {
            tempMcqSet = item.questions || [];
            renderQueue();
        }

        // বাটন পরিবর্তন
        const btn = document.querySelector('#mainUploadForm button[type="submit"]');
        btn.innerText = "UPDATE NOW 🔄";
        btn.classList.replace('bg-indigo-600', 'bg-green-600');
        
        toggleFormFields();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

// ২. মেইন আপলোড ও আপডেট লজিক
document.getElementById('mainUploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const type = document.getElementById('contentType').value;
    const currentPath = document.getElementById('dbPath').value.trim() || 'contents';
    const title = document.getElementById('postTitle').value.trim();

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        let data = { 
            title: title, 
            type: type, 
            lastUpdated: Date.now()
        };

        if (type === 'post') {
            data.body = document.getElementById('postBody').value;
            data.jsonCode = document.getElementById('postJson').value;
        } else if (type === 'video' || type === 'pdf') {
            data.url = document.getElementById('contentUrl').value;
        } else if (type === 'mcq') {
            data.questions = tempMcqSet;
        }

        if (isEditMode) {
            // ✅ সুনির্দিষ্ট পাথে আপডেট পাঠানো
            await db.ref(`${editPath}/${editId}`).update(data);
            alert("সফলভাবে আপডেট হয়েছে! ✅");
        } else {
            // ✅ নতুন ডাটা পুশ করা
            data.timestamp = Date.now();
            await db.ref(currentPath).push(data);
            alert("সফলভাবে পাবলিশ হয়েছে! 🚀");
        }

        location.reload(); 
    } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.innerText = "Try Again";
    }
});

// ৩. ডাটা ম্যানেজমেন্ট লিস্ট (ফোল্ডার সাপোর্টসহ)
function loadManageContent() {
    const list = document.getElementById('manage-list');
    db.ref('contents').on('value', (snap) => {
        list.innerHTML = "";
        const allData = snap.val();
        if (!allData) return list.innerHTML = "No content found.";

        function crawl(node, path) {
            Object.keys(node).forEach(key => {
                const item = node[key];
                if (item.title || item.type) {
                    list.innerHTML += `
                        <div class="p-4 mb-3 bg-white rounded-2xl border flex items-center justify-between shadow-sm">
                            <div class="flex-1">
                                <h4 class="font-bold text-sm text-slate-800">${item.title}</h4>
                                <p class="text-[10px] text-indigo-500 font-mono italic">${path}/${key}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="editPost('${key}', '${path}')" class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold transition">EDIT</button>
                                <button onclick="deleteItem('${path}/${key}')" class="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-xs font-bold transition">DEL</button>
                            </div>
                        </div>`;
                } else if (typeof item === 'object') {
                    crawl(item, `${path}/${key}`);
                }
            });
        }
        crawl(allData, 'contents');
    });
}

// ৪. প্রয়োজনীয় অন্যান্য ফাংশন
function toggleFormFields() {
    const type = document.getElementById('contentType').value;
    document.getElementById('textField').style.display = type === 'post' ? 'block' : 'none';
    document.getElementById('mcqField').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('urlField').style.display = (type === 'video' || type === 'pdf') ? 'block' : 'none';
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'manage-tab') loadManageContent();
}

function formatTime(ts) {
    return ts ? new Date(ts).toLocaleString('bn-BD') : "";
}

window.deleteItem = (p) => confirm("ডিলিট করতে চান?") && db.ref(p).remove();
window.showTab = showTab;
window.toggleFormFields = toggleFormFields;

// ৫. ইনিশিয়ালাইজ
document.addEventListener('DOMContentLoaded', () => {
    toggleFormFields();
});
