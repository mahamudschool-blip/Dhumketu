/**
 * DHUMKETU ADMIN MASTER SCRIPT - 2026 (FINAL REFINED)
 */

// ১. কনফিগারেশন
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

// গ্লোবাল ভ্যারিয়েবল
let currentProfileImgUrl = ""; 
let tempMcqSet = []; 
let reviewQuestions = [];

// ২. সময় ফরম্যাট করার ফাংশন (বাংলা অক্ষরে)
function formatTime(ts) {
    if (!ts) return "সময় পাওয়া যায়নি";
    const date = new Date(ts);
    return date.toLocaleDateString('bn-BD', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ৩. MCQ Review ও JSON লজিক
function parseJsonToReview() {
    const jsonText = document.getElementById('bulkJsonArea').value.trim();
    if (!jsonText) return alert("JSON কোড পেস্ট করুন!");

    try {
        const rawData = JSON.parse(jsonText);
        reviewQuestions = Array.isArray(rawData) ? rawData : (rawData.mcq_solutions || rawData.questions || []);
        
        if (reviewQuestions.length === 0) throw new Error("No questions found!");
        
        renderReviewList();
        document.getElementById('reviewContainer').classList.remove('hidden');
    } catch (err) {
        alert("ভুল JSON ফরম্যাট! সঠিক Array ব্যবহার করুন।");
    }
}

function renderReviewList() {
    const list = document.getElementById('jsonReviewList');
    list.innerHTML = reviewQuestions.map((q, index) => `
        <div class="bg-slate-50 p-5 rounded-[32px] border border-slate-200 mb-4 space-y-3">
            <div class="flex justify-between items-center">
                <span class="font-black text-indigo-600">প্রশ্ন নং: ${index + 1}</span>
                <button type="button" onclick="removeReviewItem(${index})" class="text-red-500 text-xs font-bold">বাতিল</button>
            </div>
            
            <textarea onchange="reviewQuestions[${index}].question = this.value" class="w-full p-3 rounded-2xl border-none text-sm shadow-sm" placeholder="প্রশ্ন">${q.question || ''}</textarea>
            
            <div class="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100">
                <div id="img-preview-${index}" class="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border">
                    ${q.imageUrl ? `<img src="${q.imageUrl}" class="w-full h-full object-cover">` : '<span class="text-2xl">🖼️</span>'}
                </div>
                <div class="flex-1">
                    <p class="text-[10px] font-bold text-slate-400 mb-2">ছবি যোগ করুন (বিকল্প)</p>
                    <input type="file" accept="image/*" onchange="uploadMcqImage(${index}, this)" class="text-[10px] w-full file:bg-indigo-600 file:text-white file:border-none file:px-3 file:py-1 file:rounded-full">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <input type="text" placeholder="সঠিক উত্তর" value="${q.answer || q.ans || ''}" onchange="reviewQuestions[${index}].answer = this.value" class="p-3 bg-white rounded-xl border-none text-xs font-bold shadow-sm">
                <input type="text" placeholder="ব্যাখ্যা/হিন্ট" value="${q.explanation || q.hint || ''}" onchange="reviewQuestions[${index}].explanation = this.value" class="p-3 bg-white rounded-xl border-none text-xs shadow-sm">
            </div>
        </div>
    `).join('');
}

async function uploadMcqImage(index, input) {
    if (input.files && input.files[0]) {
        const preview = document.getElementById(`img-preview-${index}`);
        preview.innerHTML = `<div class="animate-spin text-xs">⌛</div>`;
        
        const url = await uploadToImgBB(input.files[0]);
        if (url) {
            reviewQuestions[index].imageUrl = url;
            preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        } else {
            preview.innerHTML = '❌';
        }
    }
}

function removeReviewItem(index) {
    reviewQuestions.splice(index, 1);
    renderReviewList();
}

async function publishFinalSetFromReview() {
    const title = document.getElementById('postTitle').value || "নতুন MCQ সেট";
    const path = document.getElementById('dbPath').value || 'contents';

    const finalData = {
        title: title,
        type: "mcq_set",
        questions: reviewQuestions,
        timestamp: Date.now()
    };

    db.ref(path).push(finalData).then(() => {
        alert("সফলভাবে পাবলিশ হয়েছে! 🚀");
        location.reload();
    }).catch(err => alert("Error: " + err.message));
}

// ৪. কন্টেন্ট ম্যানেজমেন্ট (Manage Tab)
function loadManageContent() {
    const list = document.getElementById('manage-list');
    list.innerHTML = `<div class="p-10 text-center text-slate-400 italic">ডাটা লোড হচ্ছে...</div>`;
    
    db.ref('contents').on('value', (snapshot) => {
        const allData = snapshot.val();
        list.innerHTML = "";
        
        if (!allData) {
            list.innerHTML = `<div class="p-10 text-center text-slate-400">কোনো পোস্ট নেই।</div>`;
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
                                    <h4 class="font-bold text-slate-800 text-sm leading-tight">${item.title || "টাইটেল নেই"}</h4>
                                    <p class="text-[10px] text-indigo-500 font-bold mt-1">🕒 প্রকাশিত: ${formatTime(item.timestamp)}</p>
                                </div>
                            </div>
                            <button onclick="deleteItem('${itemPath}')" class="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition active:scale-90">
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

function deleteItem(fullPath) {
    if (confirm("আপনি কি নিশ্চিতভাবে এটি ডিলিট করতে চান?")) {
        db.ref(fullPath).remove()
            .then(() => alert("সাফল্যের সাথে ডিলিট হয়েছে! ✅"))
            .catch(err => alert("এরর: " + err.message));
    }
}

// ৫. জেনারেল কন্টেন্ট আপলোড
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
        let data = { title: title, type: type, timestamp: Date.now() };

        const imageFile = document.getElementById('imageInput').files[0];
        if (imageFile) data.imageUrl = await uploadToImgBB(imageFile);

        if (type === 'post') {
            data.body = document.getElementById('postBody').value;
            data.jsonCode = document.getElementById('postJson').value;
        } else if (type === 'video' || type === 'pdf') {
            data.url = document.getElementById('contentUrl').value;
        } else if (type === 'mcq') {
            data.questions = tempMcqSet; // Single add logic remains
        }

        await db.ref(path).push(data);
        alert("Published! 🚀");
        location.reload();
    } catch (err) {
        alert("Error: " + err.message);
        btn.innerText = "Publish Content";
        btn.disabled = false;
    }
});

// ৬. কমন টুলস (ImgBB, Tabs, Fields)
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const json = await res.json();
        return json.success ? json.data.url : "";
    } catch (e) { return ""; }
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

function toggleFormFields() {
    const type = document.getElementById('contentType').value;
    document.getElementById('textField').style.display = type === 'post' ? 'block' : 'none';
    document.getElementById('mcqField').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('bulkJsonField').style.display = type === 'mcq_set' ? 'block' : 'none';
    document.getElementById('urlField').style.display = (type === 'video' || type === 'pdf') ? 'block' : 'none';
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'manage-section') loadManageContent();
}

// প্রোফাইল ও অন্যান্য
function updateNotice() {
    const text = document.getElementById('noticeText').value;
    if(text) db.ref('notices').push({ text, timestamp: Date.now() }).then(() => alert("Notice Updated!"));
}

document.addEventListener('DOMContentLoaded', () => {
    loadCurrentAdminData();
    toggleFormFields();
});


