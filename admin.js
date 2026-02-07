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
let reviewQuestions = [];

// ১. JSON কোডকে রিভিউ লিস্টে রূপান্তর করা
let reviewQuestions = [];

// JSON থেকে রিভিউ লিস্ট তৈরি
function parseJsonToReview() {
    const jsonText = document.getElementById('bulkJsonArea').value.trim();
    if (!jsonText) return alert("JSON কোড পেস্ট করুন!");

    try {
        const rawData = JSON.parse(jsonText);
        reviewQuestions = Array.isArray(rawData) ? rawData : (rawData.mcq_solutions || rawData.questions || []);
        renderReviewList();
        document.getElementById('reviewContainer').classList.remove('hidden');
    } catch (err) {
        alert("ভুল JSON ফরম্যাট!");
    }
}

// রিভিউ লিস্ট রেন্ডার (ছবির প্রিভিউ বক্সসহ)
function renderReviewList() {
    const list = document.getElementById('jsonReviewList');
    list.innerHTML = reviewQuestions.map((q, index) => `
        <div class="bg-slate-50 p-5 rounded-[32px] border border-slate-200 mb-4 space-y-3">
            <div class="flex justify-between items-center">
                <span class="font-black text-indigo-600">প্রশ্ন নং: ${index + 1}</span>
            </div>
            
            <textarea onchange="reviewQuestions[${index}].question = this.value" class="w-full p-3 rounded-2xl border-none text-sm shadow-sm">${q.question || ''}</textarea>
            
            <div class="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100">
                <div id="img-preview-${index}" class="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border">
                    ${q.imageUrl ? `<img src="${q.imageUrl}" class="w-full h-full object-cover">` : '<span class="text-2xl">🖼️</span>'}
                </div>
                <div class="flex-1">
                    <p class="text-[10px] font-bold text-slate-400 mb-2">প্রশ্ন বা ব্যাখ্যার ছবি যোগ করুন</p>
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

// প্রতিটি প্রশ্নের জন্য আলাদা ছবি আপলোড এবং ইনস্ট্যান্ট ভিউ
async function uploadMcqImage(index, input) {
    if (input.files && input.files[0]) {
        const preview = document.getElementById(`img-preview-${index}`);
        preview.innerHTML = `<div class="animate-spin text-xs">⌛</div>`; // লোডিং দেখাবে
        
        const url = await uploadToImgBB(input.files[0]);
        if (url) {
            reviewQuestions[index].imageUrl = url; // ডাটা আপডেট
            preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`; // সাথে সাথে ছবি ভিউ
            console.log("Image Saved: ", url);
        } else {
            preview.innerHTML = '❌';
            alert("ছবি আপলোড ব্যর্থ হয়েছে!");
        }
    }
}


// ৩. ডাটা আপডেট করা
function updateReviewData(index, field, value) {
    reviewQuestions[index][field] = value;
}

function updateOptionData(index, optKey, value) {
    if(!reviewQuestions[index].options) reviewQuestions[index].options = {};
    reviewQuestions[index].options[optKey] = value;
}


// ৫. ফাইনাল পাবলিশ
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
        alert("পুরো সেটটি সফলভাবে পাবলিশ হয়েছে! 🚀");
        location.reload();
    }).catch(err => alert("এরর: " + err.message));
}

// সময় ফরম্যাট করার ফাংশন
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
    const jsonText = document.getElementById('bulkJsonArea').value.trim();
    const path = document.getElementById('dbPath').value || 'contents';
    const setTitle = document.getElementById('postTitle').value || "New MCQ Set";

    if(!jsonText) return alert("Doya kore JSON code paste korun!");

    try {
        const rawData = JSON.parse(jsonText);
        let questionsArray = [];

        // 1. Array check kora
        if (Array.isArray(rawData)) {
            questionsArray = rawData;
        } else if (rawData.mcq_solutions) {
            questionsArray = rawData.mcq_solutions;
        } else if (rawData.questions) {
            questionsArray = rawData.questions;
        }

        if (questionsArray.length === 0) throw new Error("No MCQ found!");

        // 2. Data format kora jate apps-er sathe mele
        const formattedQuestions = questionsArray.map(item => ({
            question: item.question || `Question ${item.no || ''}`,
            options: item.options || {
                "A": item.optA || "A",
                "B": item.optB || "B",
                "C": item.optC || "C",
                "D": item.optD || "D"
            },
            answer: item.answer || item.ans || "",
            explanation: item.explanation || item.hint || ""
        }));

        const finalData = {
            title: setTitle,
            type: "mcq_set",
            questions: formattedQuestions,
            timestamp: Date.now()
        };

        // 3. Firebase-e save kora
        await db.ref(path).push(finalData);
        alert(`Success! ${formattedQuestions.length} MCQ published. ✅`);
        document.getElementById('bulkJsonArea').value = "";
        location.reload();

    } catch (err) {
        console.error(err);
        alert("Invalid JSON format! Oboshshoi [ {..}, {..} ] format e hote hobe.");
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

        // Recursive Function: ফোল্ডারের ভেতরে কন্টেন্ট থাকলে তাও খুঁজে বের করবে
        
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
