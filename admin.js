/**
 * DHUMKETU ADMIN MASTER SCRIPT - 2026 (FINAL FIXED)
 */

const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};
const IMGBB_API_KEY = "D77b90eef305e2ea4b7817bc5b1e527c"; 

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentProfileImgUrl = ""; 
let tempMcqSet = []; // MCQ Set এর জন্য

// ১. MCQ Set এ প্রশ্ন যোগ করা
function addToSet() {
    const q = document.getElementById('mcqQuestion').value;
    const options = {
        A: document.getElementById('optA').value,
        B: document.getElementById('optB').value,
        C: document.getElementById('optC').value,
        D: document.getElementById('optD').value
    };
    const ans = document.getElementById('correctAns').value;

    if (!q || !options.A || !ans) {
        alert("Please complete the current question!");
        return;
    }

    tempMcqSet.push({ question: q, options: options, answer: ans });
    document.getElementById('qCount').innerText = tempMcqSet.length;
    renderQueue();
    
    // ইনপুট ক্লিয়ার
    ['mcqQuestion', 'optA', 'optB', 'optC', 'optD', 'correctAns'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function renderQueue() {
    const display = document.getElementById('mcqQueueDisplay');
    display.innerHTML = tempMcqSet.map((item, index) => `
        <div class="bg-indigo-50 p-2 rounded-lg text-[11px] flex justify-between items-center border border-indigo-100 mb-1">
            <span class="truncate"><b>${index+1}.</b> ${item.question}</span>
            <button type="button" onclick="removeFromSet(${index})" class="text-red-500 font-bold px-2">✕</button>
        </div>
    `).join('');
}

function removeFromSet(index) {
    tempMcqSet.splice(index, 1);
    document.getElementById('qCount').innerText = tempMcqSet.length;
    renderQueue();
}

// ২. মেইন সাবমিট ফাংশন (সব টাইপের জন্য একটিই)
document.getElementById('mainUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const type = document.getElementById('contentType').value;
    const path = document.getElementById('dbPath').value || 'contents';
    const title = document.getElementById('postTitle').value;

    if(!title && type !== 'mcq') return alert("Title is required!");

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        let data = {
            title: title,
            type: type,
            timestamp: Date.now()
        };

        // ছবি থাকলে আপলোড হবে
        const imageFile = document.getElementById('imageInput').files[0];
        if (imageFile) {
            data.imageUrl = await uploadToImgBB(imageFile);
        }

        // টাইপ অনুযায়ী ডাটা ফরম্যাট
        if (type === 'post') {
            data.body = document.getElementById('postBody').value;
            data.jsonCode = document.getElementById('postJson').value;
        } else if (type === 'video' || type === 'pdf') {
            data.url = document.getElementById('contentUrl').value;
        } else if (type === 'mcq') {
            // যদি সেট হিসেবে পাবলিশ করতে চান
            if (tempMcqSet.length > 0) {
                data.type = "mcq_set";
                data.title = document.getElementById('mcqSetTitle').value || title;
                data.questions = tempMcqSet;
            } else {
                // সিঙ্গেল MCQ পাবলিশ
                data.question = document.getElementById('mcqQuestion').value;
                data.options = {
                    A: document.getElementById('optA').value,
                    B: document.getElementById('optB').value,
                    C: document.getElementById('optC').value,
                    D: document.getElementById('optD').value
                };
                data.answer = document.getElementById('correctAns').value;
            }
        }

        await db.ref(path).push(data);
        alert("Published Successfully! 🚀");
        location.reload();

    } catch (err) {
        alert("Error: " + err.message);
        btn.innerText = "Publish Content";
        btn.disabled = false;
    }
});

// ৩. বাল্ক JSON পেস্ট আপলোড
async function uploadBulkJSON() {
    const jsonText = document.getElementById('bulkJsonArea').value;
    const path = document.getElementById('dbPath').value || 'contents';
    const title = document.getElementById('postTitle').value || "New MCQ Set";

    if(!jsonText) return alert("Paste JSON code first!");

    try {
        const questions = JSON.parse(jsonText);
        await db.ref(path).push({
            title: title,
            type: "mcq_set",
            questions: questions,
            timestamp: Date.now()
        });
        alert("Bulk Set Published! 📚");
        location.reload();
    } catch (err) {
        alert("Invalid JSON format!");
    }
}

// ৪. ট্যাব এবং ফিল্ড কন্ট্রোল
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function toggleFormFields() {
    const type = document.getElementById('contentType').value;
    document.getElementById('textField').style.display = type === 'post' ? 'block' : 'none';
    document.getElementById('mcqField').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('bulkJsonField').style.display = type === 'mcq_set' ? 'block' : 'none';
    document.getElementById('urlField').style.display = (type === 'video' || type === 'pdf') ? 'block' : 'none';
}

// ৫. ImgBB আপলোড
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
    });
    const json = await res.json();
    return json.success ? json.data.url : "";
}

// ৬. টিচার প্রোফাইল ম্যানেজমেন্ট
async function uploadProfilePic(input) {
    if (input.files && input.files[0]) {
        const url = await uploadToImgBB(input.files[0]);
        if(url) {
            currentProfileImgUrl = url;
            document.getElementById('p-preview').innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-full">`;
        }
    }
}

function updateAdminDetails() {
    const adminData = {
        name: document.getElementById('admin-name').value,
        email: document.getElementById('admin-email').value,
        qualification: document.getElementById('admin-qual').value,
        specialty: document.getElementById('admin-specialty')?.value || "",
        whatsapp: document.getElementById('admin-wa').value,
        facebook: document.getElementById('admin-fb').value
    };
    if (currentProfileImgUrl) adminData.photo = currentProfileImgUrl;

    db.ref('teacher').update(adminData).then(() => alert("Profile Saved! ✅"));
}

function loadCurrentAdminData() {
    db.ref('teacher').once('value', (snap) => {
        const t = snap.val();
        if(t) {
            document.getElementById('admin-name').value = t.name || "";
            document.getElementById('admin-email').value = t.email || "";
            document.getElementById('admin-qual').value = t.qualification || "";
            document.getElementById('admin-wa').value = t.whatsapp || "";
            if(t.photo) document.getElementById('p-preview').innerHTML = `<img src="${t.photo}" class="w-full h-full object-cover rounded-full">`;
        }
    });
}

function updateNotice() {
    const text = document.getElementById('noticeText').value;
    if(text) db.ref('notices').push({ text, timestamp: Date.now() }).then(() => alert("Notice Updated!"));
}

// ডিলিট করার জন্য (Manage Tab এর জন্য)
// ডিলিট করার জন্য কন্টেন্ট লোড করা
function loadManageContent() {
    const list = document.getElementById('manage-list');
    list.innerHTML = `<div class="p-10 text-center animate-pulse text-slate-400">Loading contents...</div>`;
    
    // 'contents' নোড থেকে সব ডাটা রিড করা
    db.ref('contents').on('value', (snapshot) => {
        const allData = snapshot.val();
        list.innerHTML = "";
        
        if (!allData) {
            list.innerHTML = `<div class="p-10 text-center text-slate-400">No content found in database.</div>`;
            return;
        }

        // Recursive Function: ফোল্ডারের ভেতরে কন্টেন্ট থাকলে তাও খুঁজে বের করবে
        function processNode(node, path) {
            Object.keys(node).forEach(key => {
                const item = node[key];
                
                // যদি আইটেমের ভেতরে 'type' বা 'title' থাকে, তবে এটি একটি কন্টেন্ট
                if (item.title || item.type) {
                    const itemPath = `${path}/${key}`;
                    const typeIcon = item.type === 'mcq_set' ? '📚' : (item.type === 'video' ? '🎥' : '📝');
                    
                    list.innerHTML += `
                        <div class="p-4 mb-3 flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-red-100 transition">
                            <div class="flex items-center gap-3">
                                <span class="text-xl">${typeIcon}</span>
                                <div>
                                    <h4 class="font-bold text-slate-800 leading-tight">${item.title || "No Title"}</h4>
                                    <p class="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Path: ${itemPath}</p>
                                </div>
                            </div>
                            <button onclick="deleteItem('${itemPath}')" class="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition active:scale-90">
                                Delete
                            </button>
                        </div>`;
                } 
                // যদি এটি আরেকটি ফোল্ডার হয়, তবে সেটির ভেতরেও খুঁজবে
                else if (typeof item === 'object') {
                    processNode(item, `${path}/${key}`);
                }
            });
        }

        processNode(allData, 'contents');
    });
}

// আইটেম ডিলিট করার ফাংশন
function deleteItem(fullPath) {
    if (confirm("Are you sure you want to delete this content?\n\nPath: " + fullPath)) {
        db.ref(fullPath).remove()
            .then(() => alert("Content deleted successfully! ✅"))
            .catch(err => alert("Error deleting: " + err.message));
    }
}


function deleteItem(key) {
    if(confirm("Delete this?")) db.ref('contents/'+key).remove();
}

document.addEventListener('DOMContentLoaded', () => {
    loadCurrentAdminData();
    toggleFormFields();
});
