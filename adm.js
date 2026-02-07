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

// Firebase ইন্সট্যান্স চেক
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else if (typeof firebase !== 'undefined') {
    firebase.app();
}

const db = firebase.database();

// গ্লোবাল ভ্যারিয়েবল
let currentProfileImgUrl = ""; 
let tempMcqSet = []; 
let reviewQuestions = [];
let currentMCQImage = null;

// ২. সময় ফরম্যাট করার ফাংশন (বাংলা অক্ষরে)
function formatTime(ts) {
    if (!ts) return "সময় পাওয়া যায়নি";
    try {
        const date = new Date(ts);
        return date.toLocaleDateString('bn-BD', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return "অজানা সময়";
    }
}

// ৩. ডিবাগ ফাংশন
function debugLog(message, data = null) {
    console.log(`[DEBUG] ${message}`, data || '');
}

// ৪. MCQ Review ও JSON লজিক
function parseJsonToReview() {
    const jsonText = document.getElementById('bulkJsonArea').value.trim();
    if (!jsonText) return alert("JSON কোড পেস্ট করুন!");

    try {
        const rawData = JSON.parse(jsonText);
        reviewQuestions = Array.isArray(rawData) ? rawData : (rawData.mcq_solutions || rawData.questions || []);
        
        if (reviewQuestions.length === 0) throw new Error("No questions found!");
        
        renderReviewList();
        document.getElementById('reviewContainer').classList.remove('hidden');
        document.getElementById('reviewCount').innerText = reviewQuestions.length;
    } catch (err) {
        alert("ভুল JSON ফরম্যাট! সঠিক Array ব্যবহার করুন।");
        console.error(err);
    }
}

function renderReviewList() {
    const list = document.getElementById('jsonReviewList');
    list.innerHTML = reviewQuestions.map((q, index) => `
        <div class="bg-slate-50 p-5 rounded-[32px] border border-slate-200 mb-4 space-y-3">
            <div class="flex justify-between items-center">
                <span class="font-black text-indigo-600">প্রশ্ন নং: ${index + 1}</span>
                <button type="button" onclick="removeReviewItem(${index})" class="text-red-500 text-xs font-bold hover:text-red-700">বাতিল</button>
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
        preview.innerHTML = '<div class="animate-spin text-xs">⌛</div>';
        
        try {
            const url = await uploadToImgBB(input.files[0]);
            if (url) {
                reviewQuestions[index].imageUrl = url;
                preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
            } else {
                preview.innerHTML = '<span class="text-red-500">❌</span>';
            }
        } catch (error) {
            console.error("Image upload error:", error);
            preview.innerHTML = '<span class="text-red-500">❌</span>';
        }
    }
}

function removeReviewItem(index) {
    if (confirm("এই প্রশ্ন বাতিল করতে চান?")) {
        reviewQuestions.splice(index, 1);
        renderReviewList();
        document.getElementById('reviewCount').innerText = reviewQuestions.length;
    }
}

async function publishFinalSetFromReview() {
    const title = document.getElementById('postTitle').value.trim() || "নতুন MCQ সেট";
    const path = document.getElementById('dbPath').value.trim() || 'contents';

    if (reviewQuestions.length === 0) {
        alert("কোনো প্রশ্ন নেই! প্রথমে প্রশ্ন যোগ করুন।");
        return;
    }

    const finalData = {
        title: title,
        type: "mcq_set",
        questions: reviewQuestions,
        timestamp: Date.now(),
        author: "admin"
    };

    try {
        debugLog("Publishing MCQ Set:", finalData);
        await db.ref(path).push(finalData);
        alert("সফলভাবে পাবলিশ হয়েছে! 🚀");
        location.reload();
    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    }
}

function loadManageContent() {
    const list = document.getElementById('manage-list');
    
    // Firebase থেকে কন্টেন্ট রিড করা
    db.ref('contents').on('value', (snapshot) => {
        const allData = snapshot.val();
        list.innerHTML = "";
        
        if (!allData) {
            list.innerHTML = "<p class='p-10 text-center text-slate-400'>কোনো কন্টেন্ট পাওয়া যায়নি।</p>";
            return;
        }

        /**
         * @param {Object} node - বর্তমান ডাটা অবজেক্ট
         * @param {String} currentPath - বর্তমান ফোল্ডার পাথ
         */
        function crawl(node, currentPath) {
            Object.keys(node).forEach(key => {
                const item = node[key];

                // যদি টাইটেল থাকে, তার মানে এটি একটি ফাইল/পোস্ট
                if (item.title || item.type) {
                    list.innerHTML += `
                        <div class="p-4 mb-3 bg-white rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <div class="flex-1 overflow-hidden">
                                <h4 class="font-bold text-sm text-slate-800 truncate">${item.title}</h4>
                                <p class="text-[10px] text-indigo-500 font-mono italic truncate">${currentPath}/${key}</p>
                            </div>
                            <div class="flex gap-2 ml-4">
                                <button onclick="window.location.href='edit.html?id=${key}&path=${currentPath}'" 
                                    class="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition">
                                    ✏️ EDIT
                                </button>
                                
                                <button onclick="deleteItem('${currentPath}/${key}')" 
                                    class="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold">
                                    🗑️ DEL
                                </button>
                            </div>
                        </div>`;
                } 
                // যদি অবজেক্ট হয় কিন্তু টাইটেল না থাকে, তার মানে এটি একটি ফোল্ডার
                else if (typeof item === 'object' && item !== null) {
                    crawl(item, `${currentPath}/${key}`);
                }
            });
        }

        // 'contents' মেইন রুট থেকে খোঁজা শুরু হবে
        crawl(allData, 'contents');
    });
}

// ১. এডিট মোড ওপেন করা
function editPost(id, path) {
    db.ref(`${path}/${id}`).once('value', snapshot => {
        const item = snapshot.val();
        if (!item) return;

        // ইনপুট ফিল্ডগুলোতে ডাটা বসানো
        document.getElementById('contentTitle').value = item.title;
        document.getElementById('contentLink').value = item.link;
        document.getElementById('contentType').value = item.type;
        
        // আপলোড বাটনের টেক্সট পরিবর্তন এবং নতুন ফাংশন সেট করা
        const uploadBtn = document.querySelector("button[onclick='uploadContent()']");
        uploadBtn.innerText = "UPDATE POST 🔄";
        uploadBtn.onclick = () => saveEditedPost(id, path);
        
        // স্ক্রল করে উপরে নিয়ে যাওয়া
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ২. এডিট করা ডাটা সেভ করা
function saveEditedPost(id, path) {
    const title = document.getElementById('contentTitle').value;
    const link = document.getElementById('contentLink').value;
    const type = document.getElementById('contentType').value;

    if (!title || !link) {
        alert("Please fill all fields!");
        return;
    }

    db.ref(`${path}/${id}`).update({
        title: title,
        link: link,
        type: type,
        lastUpdated: Date.now()
    }).then(() => {
        alert("Post Updated Successfully! ✅");
        location.reload(); // পেজ রিফ্রেশ করে বাটন রিসেট করা
    }).catch(err => {
        alert("Error: " + err.message);
    });
}

function deleteItem(fullPath) {
    if (confirm("আপনি কি নিশ্চিতভাবে এটি ডিলিট করতে চান?")) {
        db.ref(fullPath).remove()
            .then(() => alert("সাফল্যের সাথে ডিলিট হয়েছে! ✅"))
            .catch(err => {
                alert("এরর: " + err.message);
                console.error(err);
            });
    }
}

// ৬. জেনারেল কন্টেন্ট আপলোড
document.getElementById('mainUploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const type = document.getElementById('contentType').value;
    const path = document.getElementById('dbPath').value.trim() || 'contents';
    const title = document.getElementById('postTitle').value.trim();

    if(!title && type !== 'mcq') {
        alert("Title is required!");
        return;
    }

    const originalBtnText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        let data = { 
            title: title, 
            type: type, 
            timestamp: Date.now(),
            author: "admin"
        };

        const imageFile = document.getElementById('imageInput').files[0];
        if (imageFile) {
            debugLog("Uploading image...");
            data.imageUrl = await uploadToImgBB(imageFile);
        }

        if (type === 'post') {
            data.body = document.getElementById('postBody').value;
            const jsonCode = document.getElementById('postJson').value.trim();
            if (jsonCode) data.jsonCode = jsonCode;
        } else if (type === 'video' || type === 'pdf') {
            const url = document.getElementById('contentUrl').value.trim();
            if (!url) {
                alert("URL is required!");
                btn.innerText = originalBtnText;
                btn.disabled = false;
                return;
            }
            data.url = url;
        } else if (type === 'mcq') {
            if (tempMcqSet.length === 0) {
                alert("প্রথমে MCQ সেটে প্রশ্ন যোগ করুন!");
                btn.innerText = originalBtnText;
                btn.disabled = false;
                return;
            }
            data.questions = tempMcqSet;
            data.questionCount = tempMcqSet.length;
        }

        debugLog("Publishing data:", data);
        await db.ref(path).push(data);
        alert("Published! 🚀");
        location.reload();
    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
});

// ৭. MCQ ফর্ম ম্যানেজমেন্ট
document.getElementById('mcqImageInput')?.addEventListener('change', async function(e) {
    if (e.target.files && e.target.files[0]) {
        const preview = document.getElementById('mcqImgPreview');
        preview.innerHTML = '<div class="animate-spin">⌛</div>';
        
        try {
            const url = await uploadToImgBB(e.target.files[0]);
            if (url) {
                preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
                currentMCQImage = url;
            } else {
                preview.innerHTML = '<span class="text-red-500">❌</span>';
                currentMCQImage = null;
            }
        } catch (error) {
            console.error("MCQ image upload error:", error);
            preview.innerHTML = '<span class="text-red-500">❌</span>';
            currentMCQImage = null;
        }
    }
});

function resetMCQForm() {
    document.getElementById('mcqQuestion').value = '';
    document.getElementById('optA').value = '';
    document.getElementById('optB').value = '';
    document.getElementById('optC').value = '';
    document.getElementById('optD').value = '';
    document.getElementById('correctAns').value = '';
    document.getElementById('mcqExplanation').value = '';
    document.getElementById('mcqImgPreview').innerHTML = '<span class="text-2xl">🖼️</span>';
    if (document.getElementById('mcqImageInput')) {
        document.getElementById('mcqImageInput').value = '';
    }
    currentMCQImage = null;
}

function addToSet() {
    const question = document.getElementById('mcqQuestion').value.trim();
    const optionA = document.getElementById('optA').value.trim();
    const optionB = document.getElementById('optB').value.trim();
    const optionC = document.getElementById('optC').value.trim();
    const optionD = document.getElementById('optD').value.trim();
    const correct = document.getElementById('correctAns').value;
    const explanation = document.getElementById('mcqExplanation').value.trim();

    if (!question || !optionA || !optionB || !optionC || !optionD || !correct) {
        alert("Please fill all required fields!");
        return;
    }

    const newMCQ = {
        question: question,
        options: {
            A: optionA,
            B: optionB,
            C: optionC,
            D: optionD
        },
        answer: correct,
        explanation: explanation,
        imageUrl: currentMCQImage || null
    };

    tempMcqSet.push(newMCQ);
    renderQueue();
    resetMCQForm();
    
    alert(`✅ Question added! Total: ${tempMcqSet.length}`);
}

function renderQueue() {
    const queue = document.getElementById('mcqQueueDisplay');
    const count = document.getElementById('qCount');
    
    count.innerText = tempMcqSet.length;
    queue.innerHTML = tempMcqSet.map((q, i) => `
        <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition">
            <div class="flex items-center gap-3">
                <span class="text-xs font-bold bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center">${i+1}</span>
                <div>
                    <span class="text-sm truncate max-w-[200px] block">${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}</span>
                    <span class="text-[10px] text-slate-500">সঠিক উত্তর: ${q.answer}</span>
                </div>
                ${q.imageUrl ? '<span class="text-xs text-slate-500 ml-2">🖼️</span>' : ''}
            </div>
            <button onclick="removeFromSet(${i})" class="text-red-500 text-xs hover:text-red-700 transition">🗑️</button>
        </div>
    `).join('');
}

function removeFromSet(index) {
    if (confirm("Are you sure you want to remove this question?")) {
        tempMcqSet.splice(index, 1);
        renderQueue();
    }
}

// ৮. টিচার প্রোফাইল ম্যানেজমেন্ট
async function uploadProfilePic(input) {
    if (input.files && input.files[0]) {
        try {
            const url = await uploadToImgBB(input.files[0]);
            if(url) {
                currentProfileImgUrl = url;
                document.getElementById('p-preview').innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-full">`;
            }
        } catch (error) {
            console.error("Profile pic upload error:", error);
            alert("Profile picture upload failed!");
        }
    }
}

function updateAdminDetails() {
    const adminData = {
        name: document.getElementById('admin-name').value.trim(),
        email: document.getElementById('admin-email').value.trim(),
        qualification: document.getElementById('admin-qual').value.trim(),
        specialty: document.getElementById('admin-specialty')?.value.trim() || "",
        whatsapp: document.getElementById('admin-wa').value.trim(),
        facebook: document.getElementById('admin-fb').value.trim(),
        blog: document.getElementById('admin-blog')?.value.trim() || "",
        hours: document.getElementById('admin-hours')?.value.trim() || "9:00 AM - 5:00 PM",
        location: document.getElementById('admin-location')?.value.trim() || "Dhaka, Bangladesh"
    };
    
    if (currentProfileImgUrl) {
        adminData.photo = currentProfileImgUrl;
    }

    debugLog("Updating admin data:", adminData);
    db.ref('teacher').update(adminData)
        .then(() => alert("✅ Profile Saved Successfully!"))
        .catch(err => {
            alert("Error: " + err.message);
            console.error(err);
        });
}

function loadCurrentAdminData() {
    db.ref('teacher').once('value', (snap) => {
        const t = snap.val();
        if(t) {
            document.getElementById('admin-name').value = t.name || "";
            document.getElementById('admin-email').value = t.email || "";
            document.getElementById('admin-qual').value = t.qualification || "";
            document.getElementById('admin-specialty').value = t.specialty || "";
            document.getElementById('admin-hours').value = t.hours || "";
            document.getElementById('admin-location').value = t.location || "";
            document.getElementById('admin-wa').value = t.whatsapp || "";
            document.getElementById('admin-fb').value = t.facebook || "";
            document.getElementById('admin-blog').value = t.blog || "";
            
            if(t.photo) {
                document.getElementById('p-preview').innerHTML = `<img src="${t.photo}" class="w-full h-full object-cover rounded-full">`;
                currentProfileImgUrl = t.photo;
            }
        }
    }).catch(err => {
        console.error("Error loading admin data:", err);
    });
}
// ৯. নোটিশ ম্যানেজমেন্ট - COMPACT VERSION
// adm.js এর সংশোধনী
function updateNotice() {
    const text = document.getElementById('noticeText').value.trim();
    if(!text) return alert("লিখুন!");

    // .set() দিলে আগেরটা মুছে যায়, .push() দিলে সব জমা থাকে
    db.ref('siteNotice').push({
        text: text,
        timestamp: Date.now()
    }).then(() => alert("সফল!"));
}


function loadCurrentNotice() {
    db.ref('notices').orderByChild('timestamp').limitToLast(10).once('value')
        .then(snap => {
            const notices = snap.val();
            const historyDiv = document.getElementById('notice-history');
            const currentText = document.getElementById('current-notice-text');
            const currentTime = document.getElementById('current-notice-time');
            
            if (historyDiv) historyDiv.innerHTML = '';
            
            if (!notices) {
                currentText.innerText = "কোনো নোটিশ নেই।";
                currentTime.innerText = "";
                historyDiv.innerHTML = '<p class="text-slate-400 text-sm italic py-3">কোনো নোটিশ নেই</p>';
                return;
            }
            
            const noticeArray = [];
            Object.keys(notices).forEach(key => {
                if (notices[key] && notices[key].text) {
                    noticeArray.push({
                        id: key,
                        text: notices[key].text,
                        timestamp: notices[key].timestamp,
                        author: notices[key].author || 'admin'
                    });
                }
            });
            
            noticeArray.sort((a, b) => b.timestamp - a.timestamp);
            
            if (noticeArray.length > 0) {
                const latest = noticeArray[0];
                currentText.innerText = latest.text;
                currentTime.innerText = `🕒 ${formatTime(latest.timestamp)}`;
            }
            
            noticeArray.forEach((notice, index) => {
                if (historyDiv) {
                    historyDiv.innerHTML += `
                        <div class="p-2 mb-1 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-xs">
                            <div class="flex justify-between items-start">
                                <span class="font-bold text-indigo-600">${index + 1}.</span>
                                <span class="text-[10px] text-slate-500">${formatTime(notice.timestamp)}</span>
                            </div>
                            <p class="mt-1 truncate">${notice.text}</p>
                            <div class="flex justify-end mt-1">
                                <button onclick="deleteNotice('${notice.id}')" class="text-[10px] text-red-500 hover:text-red-700 px-1.5 py-0.5 bg-red-50 rounded">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `;
                }
            });
        })
        .catch(err => {
            console.error("Error loading notices:", err);
        });
}

// ১০. কমন টুলস
async function uploadToImgBB(file) {
    if (!file) return "";
    
    const formData = new FormData();
    formData.append("image", file);
    
    try {
        debugLog("Uploading to ImgBB...", file.name);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { 
            method: "POST", 
            body: formData 
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        debugLog("ImgBB response:", json);
        
        if (json.success && json.data && json.data.url) {
            return json.data.url;
        } else {
            console.error("ImgBB upload failed:", json);
            return "";
        }
    } catch (e) { 
        console.error("ImgBB Upload Error:", e);
        return ""; 
    }
}

function toggleFormFields() {
    const type = document.getElementById('contentType').value;
    document.getElementById('textField').style.display = type === 'post' ? 'block' : 'none';
    document.getElementById('mcqField').style.display = type === 'mcq' ? 'block' : 'none';
    document.getElementById('bulkJsonField').style.display = type === 'mcq_set' ? 'block' : 'none';
    document.getElementById('urlField').style.display = (type === 'video' || type === 'pdf') ? 'block' : 'none';
}

function showTab(tabId) {
    // সব ট্যাব লুকানো
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    
    // নির্বাচিত ট্যাব দেখানো
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
    
    // ট্যাব অনুযায়ী কন্টেন্ট লোড করা
    if(tabId === 'manage-tab') loadManageContent();
    if(tabId === 'notice-tab') loadCurrentNotice();
    if(tabId === 'teacher-tab') loadCurrentAdminData();
}

// ১১. ইনিশিয়ালাইজেশন
function initializeAdmin() {
    debugLog("Initializing admin panel...");
    
    // ফর্ম ফিল্ড টগল
    toggleFormFields();
    
    // কারেন্ট ডাটা লোড
    loadCurrentAdminData();
    loadCurrentNotice();
    
    // ইভেন্ট লিসেনার সেটআপ
    const contentTypeSelect = document.getElementById('contentType');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', toggleFormFields);
    }
    
    // Firebase কানেকশন চেক
    checkFirebaseConnection();
}

// Firebase কানেকশন চেক
function checkFirebaseConnection() {
    const connectedRef = db.ref(".info/connected");
    connectedRef.on("value", function(snap) {
        if (snap.val() === true) {
            debugLog("Firebase connected successfully");
        } else {
            debugLog("Firebase disconnected");
        }
    });
}

// ১২. Gemini AI হেল্পার (প্লেসহোল্ডার)
function askGemini() {
    const prompt = document.getElementById('aiPrompt')?.value;
    const responseArea = document.getElementById('aiResponse');
    
    if (!prompt) {
        alert("প্রথমে কিছু লিখুন!");
        return;
    }
    
    responseArea.innerHTML += `<p class="text-green-400">You: ${prompt}</p>`;
    responseArea.innerHTML += `<p class="text-yellow-400">Gemini: এই ফিচারটি Gemini API ইন্টিগ্রেশনের জন্য প্রস্তুত।</p>`;
    
    // ইনপুট ক্লিয়ার
    document.getElementById('aiPrompt').value = '';
    
    // স্ক্রল ডাউন
    responseArea.scrollTop = responseArea.scrollHeight;
}

// ১৩. DOM লোড হওয়ার পর ইনিশিয়ালাইজ
document.addEventListener('DOMContentLoaded', () => {
    debugLog("DOM Content Loaded");
    
    // Firebase লোড হয়েছে কিনা চেক
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not loaded!");
        alert("Firebase লোড হয়নি। ইন্টারনেট কানেকশন চেক করুন।");
        return;
    }
    
    // অ্যাডমিন প্যানেল ইনিশিয়ালাইজ
    setTimeout(() => {
        initializeAdmin();
    }, 100);
});

// ১৪. গ্লোবাল এক্সপোজ
window.updateNotice = updateNotice;
window.loadCurrentNotice = loadCurrentNotice;
window.manageNotices = manageNotices;
window.deleteNotice = deleteNotice;
window.uploadProfilePic = uploadProfilePic;
window.updateAdminDetails = updateAdminDetails;
window.toggleFormFields = toggleFormFields;
window.showTab = showTab;
window.parseJsonToReview = parseJsonToReview;
window.removeReviewItem = removeReviewItem;
window.publishFinalSetFromReview = publishFinalSetFromReview;
window.uploadMcqImage = uploadMcqImage;
window.resetMCQForm = resetMCQForm;
window.addToSet = addToSet;
window.removeFromSet = removeFromSet;
window.askGemini = askGemini;