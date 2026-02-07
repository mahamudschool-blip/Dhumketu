/**
 * DHUMKETU EDIT MASTER SCRIPT - 2026
 * Complete content editing system for all content types
 */

// Firebase Configuration
const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};

// ImgBB API Key
const IMGBB_API_KEY = "D77b90eef305e2ea4b7817bc5b1e527c";

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Global Variables
let allContent = {};
let currentEditId = '';
let currentEditPath = '';
let currentEditType = '';
let currentMCQSetQuestions = [];

// ১. সব কন্টেন্ট লোড (Recursive Search)
function loadAllContent() {
    const contentList = document.getElementById('content-list');
    contentList.innerHTML = '<div class="text-center p-10 text-slate-400"><div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div><p>কন্টেন্ট লোড হচ্ছে...</p></div>';
    
    db.ref('contents').once('value', snapshot => {
        allContent = {};
        contentList.innerHTML = '';
        
        function processNode(node, path) {
            Object.keys(node).forEach(key => {
                const item = node[key];
                
                // Check if this is a content item
                if (item && item.type && item.title) {
                    const itemPath = `${path}/${key}`;
                    allContent[itemPath] = { ...item, fullPath: itemPath };
                    renderContentItem(item, key, itemPath);
                }
                // If it's a folder, go deeper
                else if (item && typeof item === 'object') {
                    processNode(item, `${path}/${key}`);
                }
            });
        }
        
        const data = snapshot.val() || {};
        processNode(data, 'contents');
        
        if (Object.keys(allContent).length === 0) {
            contentList.innerHTML = '<div class="text-center p-10 text-slate-400"><p>কোনো কন্টেন্ট পাওয়া যায়নি।</p></div>';
        }
    }).catch(error => {
        console.error("Error loading content:", error);
        contentList.innerHTML = '<div class="text-center p-10 text-red-400"><p>লোড করতে সমস্যা হয়েছে।</p></div>';
    });
}

// ২. কন্টেন্ট আইটেম রেন্ডার
function renderContentItem(item, id, path) {
    const contentList = document.getElementById('content-list');
    const icons = {
        'post': '📝',
        'mcq_set': '📚',
        'mcq': '❓',
        'video': '🎥',
        'pdf': '📄',
        'image': '🖼️'
    };
    
    const typeColor = {
        'post': 'bg-blue-900',
        'mcq_set': 'bg-purple-900',
        'mcq': 'bg-green-900',
        'video': 'bg-red-900',
        'pdf': 'bg-amber-900',
        'image': 'bg-pink-900'
    };
    
    const shortPath = path.replace('contents/', '').substring(0, 30);
    const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleDateString('bn-BD') : 'তারিখ নেই';
    
    const itemCard = document.createElement('div');
    itemCard.className = 'bg-slate-900 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition cursor-pointer';
    itemCard.onclick = () => openEditForm(id, path, item);
    
    itemCard.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
                <div class="text-3xl">${icons[item.type] || '📄'}</div>
                <div>
                    <div class="text-sm font-bold text-white">${item.title || 'নাম নেই'}</div>
                    <div class="text-xs text-slate-400 mt-1">${shortPath}</div>
                </div>
            </div>
            <div class="flex flex-col items-end gap-2">
                <span class="text-xs px-3 py-1 rounded-full ${typeColor[item.type] || 'bg-slate-700'}">${item.type || 'unknown'}</span>
                <span class="text-[10px] text-slate-500">${timestamp}</span>
            </div>
        </div>
        ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-32 object-cover rounded-xl mb-3">` : ''}
        <div class="text-xs text-slate-400">
            ${item.type === 'mcq_set' ? `প্রশ্ন: ${item.questions?.length || 0}টি` : ''}
            ${item.type === 'post' ? `লেখা: ${item.body?.substring(0, 50)}...` : ''}
            ${item.type === 'mcq' ? `প্রশ্ন: ${item.question?.substring(0, 50)}...` : ''}
        </div>
    `;
    
    contentList.appendChild(itemCard);
}

// ৩. সার্চ ফাংশনালিটি
function searchContent() {
    const searchTitle = document.getElementById('searchTitle').value.toLowerCase();
    const searchPath = document.getElementById('searchPath').value.toLowerCase();
    const contentList = document.getElementById('content-list');
    
    contentList.innerHTML = '';
    let foundCount = 0;
    
    Object.keys(allContent).forEach(path => {
        const item = allContent[path];
        const matchesTitle = !searchTitle || 
                           (item.title && item.title.toLowerCase().includes(searchTitle)) ||
                           (item.question && item.question.toLowerCase().includes(searchTitle));
        const matchesPath = !searchPath || path.toLowerCase().includes(searchPath);
        
        if (matchesTitle && matchesPath) {
            const id = path.split('/').pop();
            renderContentItem(item, id, path);
            foundCount++;
        }
    });
    
    if (foundCount === 0) {
        contentList.innerHTML = '<div class="text-center p-10 text-slate-400"><p>কোনো কন্টেন্ট পাওয়া যায়নি।</p></div>';
    }
}

// ৪. টাইপ সিলেক্ট ফাংশন
function selectType(type) {
    // Update UI
    document.querySelectorAll('.content-type-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600');
        btn.classList.add('bg-slate-700');
    });
    event.target.classList.add('active', 'bg-blue-600');
    
    // Filter content
    const contentList = document.getElementById('content-list');
    contentList.innerHTML = '';
    let foundCount = 0;
    
    if (type === 'all') {
        // Show all content
        Object.keys(allContent).forEach(path => {
            const item = allContent[path];
            const id = path.split('/').pop();
            renderContentItem(item, id, path);
            foundCount++;
        });
    } else {
        // Filter by type
        Object.keys(allContent).forEach(path => {
            const item = allContent[path];
            if (item.type === type) {
                const id = path.split('/').pop();
                renderContentItem(item, id, path);
                foundCount++;
            }
        });
    }
    
    if (foundCount === 0) {
        contentList.innerHTML = '<div class="text-center p-10 text-slate-400"><p>এই টাইপের কোনো কন্টেন্ট নেই।</p></div>';
    }
}

// ৫. এডিট ফর্ম খোলা
function openEditForm(id, path, item) {
    currentEditId = id;
    currentEditPath = path;
    currentEditType = item.type;
    
    // Show edit form
    document.getElementById('edit-form-container').classList.remove('hidden');
    document.getElementById('current-edit-id').textContent = id;
    
    // Set basic info
    document.getElementById('edit-type').value = item.type;
    document.getElementById('edit-path').value = path.replace(`/${id}`, '');
    document.getElementById('edit-title').value = item.title || '';
    
    // Show appropriate fields
    toggleEditFields();
    
    // Set type-specific fields
    if (item.type === 'post') {
        document.getElementById('edit-body').value = item.body || '';
        document.getElementById('edit-json').value = item.jsonCode || '';
    } else if (item.type === 'video' || item.type === 'pdf') {
        document.getElementById('edit-url').value = item.url || '';
    } else if (item.type === 'mcq') {
        document.getElementById('edit-mcq-question').value = item.question || '';
        document.getElementById('edit-opt-a').value = item.options?.A || '';
        document.getElementById('edit-opt-b').value = item.options?.B || '';
        document.getElementById('edit-opt-c').value = item.options?.C || '';
        document.getElementById('edit-opt-d').value = item.options?.D || '';
        document.getElementById('edit-correct-ans').value = item.answer || 'A';
        document.getElementById('edit-explanation').value = item.explanation || '';
    } else if (item.type === 'mcq_set') {
        currentMCQSetQuestions = item.questions || [];
        renderMCQSetQuestions();
    }
    
    // Set image
    if (item.imageUrl) {
        document.getElementById('edit-image-url').value = item.imageUrl;
        document.getElementById('edit-image-preview').innerHTML = `
            <img src="${item.imageUrl}" class="preview-image">
            <div class="text-sm text-slate-400 mt-2">বর্তমান ছবি</div>
        `;
    }
    
    // Scroll to edit form
    document.getElementById('edit-form-container').scrollIntoView({ behavior: 'smooth' });
}

// ৬. এডিট ফিল্ড টগল
function toggleEditFields() {
    const type = document.getElementById('edit-type').value;
    
    // Hide all fields first
    document.getElementById('edit-post-fields').classList.add('hidden');
    document.getElementById('edit-media-fields').classList.add('hidden');
    document.getElementById('edit-mcq-fields').classList.add('hidden');
    document.getElementById('edit-mcqset-fields').classList.add('hidden');
    document.getElementById('json-import-section').classList.add('hidden');
    
    // Show relevant fields
    if (type === 'post') {
        document.getElementById('edit-post-fields').classList.remove('hidden');
    } else if (type === 'video' || type === 'pdf') {
        document.getElementById('edit-media-fields').classList.remove('hidden');
    } else if (type === 'mcq') {
        document.getElementById('edit-mcq-fields').classList.remove('hidden');
    } else if (type === 'mcq_set') {
        document.getElementById('edit-mcqset-fields').classList.remove('hidden');
        document.getElementById('json-import-section').classList.remove('hidden');
    }
}

// ৭. MCQ সেট প্রশ্ন রেন্ডার
function renderMCQSetQuestions() {
    const container = document.getElementById('mcqset-questions-container');
    container.innerHTML = '';
    
    currentMCQSetQuestions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="font-bold text-white">প্রশ্ন ${index + 1}</span>
                <button onclick="removeQuestionFromSet(${index})" class="text-red-400 hover:text-red-300">🗑️ ডিলিট</button>
            </div>
            <textarea onchange="updateQuestionInSet(${index}, 'question', this.value)" 
                      class="input-box mb-2" rows="2">${q.question || ''}</textarea>
            
            ${q.imageUrl ? `
                <div class="mb-3">
                    <img src="${q.imageUrl}" class="preview-image">
                    <div class="flex gap-2 mt-2">
                        <input type="file" onchange="updateQuestionImage(${index}, this)" class="text-xs">
                        <button onclick="removeQuestionImage(${index})" class="text-xs text-red-400">ছবি সরান</button>
                    </div>
                </div>
            ` : `
                <div class="mb-3">
                    <input type="file" onchange="updateQuestionImage(${index}, this)" class="input-box text-xs">
                    <div class="text-xs text-slate-400 mt-1">প্রশ্নের ছবি যোগ করুন (ঐচ্ছিক)</div>
                </div>
            `}
            
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="text-xs text-slate-300">Option A</label>
                    <input type="text" value="${q.options?.A || ''}" 
                           onchange="updateQuestionOption(${index}, 'A', this.value)" 
                           class="input-box text-sm">
                </div>
                <div>
                    <label class="text-xs text-slate-300">Option B</label>
                    <input type="text" value="${q.options?.B || ''}" 
                           onchange="updateQuestionOption(${index}, 'B', this.value)" 
                           class="input-box text-sm">
                </div>
                <div>
                    <label class="text-xs text-slate-300">Option C</label>
                    <input type="text" value="${q.options?.C || ''}" 
                           onchange="updateQuestionOption(${index}, 'C', this.value)" 
                           class="input-box text-sm">
                </div>
                <div>
                    <label class="text-xs text-slate-300">Option D</label>
                    <input type="text" value="${q.options?.D || ''}" 
                           onchange="updateQuestionOption(${index}, 'D', this.value)" 
                           class="input-box text-sm">
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-xs text-slate-300">সঠিক উত্তর</label>
                    <select onchange="updateQuestionInSet(${index}, 'answer', this.value)" class="input-box text-sm">
                        <option value="A" ${q.answer === 'A' ? 'selected' : ''}>A</option>
                        <option value="B" ${q.answer === 'B' ? 'selected' : ''}>B</option>
                        <option value="C" ${q.answer === 'C' ? 'selected' : ''}>C</option>
                        <option value="D" ${q.answer === 'D' ? 'selected' : ''}>D</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs text-slate-300">ব্যাখ্যা</label>
                    <input type="text" value="${q.explanation || ''}" 
                           onchange="updateQuestionInSet(${index}, 'explanation', this.value)" 
                           class="input-box text-sm">
                </div>
            </div>
        `;
        container.appendChild(questionDiv);
    });
}

// ৮. MCQ সেট প্রশ্ন ম্যানেজমেন্ট
function addNewQuestionToSet() {
    currentMCQSetQuestions.push({
        question: '',
        options: { A: '', B: '', C: '', D: '' },
        answer: 'A',
        explanation: ''
    });
    renderMCQSetQuestions();
}

function removeQuestionFromSet(index) {
    if (confirm(`প্রশ্ন ${index + 1} ডিলিট করতে চান?`)) {
        currentMCQSetQuestions.splice(index, 1);
        renderMCQSetQuestions();
    }
}

function updateQuestionInSet(index, field, value) {
    currentMCQSetQuestions[index][field] = value;
}

function updateQuestionOption(index, option, value) {
    if (!currentMCQSetQuestions[index].options) {
        currentMCQSetQuestions[index].options = {};
    }
    currentMCQSetQuestions[index].options[option] = value;
}

async function updateQuestionImage(index, input) {
    if (input.files && input.files[0]) {
        const url = await uploadToImgBB(input.files[0]);
        if (url) {
            currentMCQSetQuestions[index].imageUrl = url;
            renderMCQSetQuestions();
        }
    }
}

function removeQuestionImage(index) {
    delete currentMCQSetQuestions[index].imageUrl;
    renderMCQSetQuestions();
}

// ৯. ছবি আপলোড ফাংশন
async function uploadEditImage() {
    const fileInput = document.getElementById('edit-image');
    if (fileInput.files && fileInput.files[0]) {
        const url = await uploadToImgBB(fileInput.files[0]);
        if (url) {
            document.getElementById('edit-image-url').value = url;
            document.getElementById('edit-image-preview').innerHTML = `
                <img src="${url}" class="preview-image">
                <div class="text-sm text-green-400 mt-2">ছবি আপলোড সফল!</div>
            `;
        } else {
            alert("ছবি আপলোড ব্যর্থ হয়েছে!");
        }
    }
}

// ১০. ইমেজ আপলোড হেল্পার
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);
    
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });
        const json = await res.json();
        return json.success ? json.data.url : "";
    } catch (error) {
        console.error("ImgBB upload error:", error);
        return "";
    }
}

// ১১. JSON থেকে MCQ সেট ইম্পোর্ট
function importJSONToMCQSet() {
    const jsonText = document.getElementById('import-json').value;
    if (!jsonText) return alert("JSON পেস্ট করুন!");
    
    try {
        const rawData = JSON.parse(jsonText.replace(/```json|```/g, "").trim());
        let questionsArray = [];
        
        if (Array.isArray(rawData)) {
            questionsArray = rawData;
        } else if (rawData.mcq_solutions) {
            questionsArray = rawData.mcq_solutions;
        } else if (rawData.questions) {
            questionsArray = rawData.questions;
        }
        
        if (questionsArray.length === 0) throw new Error("No questions found in JSON");
        
        currentMCQSetQuestions = questionsArray.map(item => ({
            question: item.question || item.q || "",
            options: item.options || {
                A: item.a || item.optA || "",
                B: item.b || item.optB || "",
                C: item.c || item.optC || "",
                D: item.d || item.optD || ""
            },
            answer: item.answer || item.ans || "A",
            explanation: item.explanation || item.hint || "",
            imageUrl: item.imageUrl || ""
        }));
        
        renderMCQSetQuestions();
        document.getElementById('import-json').value = "";
        alert(`${questionsArray.length}টি প্রশ্ন ইম্পোর্ট করা হয়েছে!`);
    } catch (error) {
        alert("ভুল JSON ফরম্যাট! দয়া করে চেক করুন।");
        console.error("JSON parse error:", error);
    }
}

function clearMCQSet() {
    if (confirm("সব প্রশ্ন ডিলিট করতে চান?")) {
        currentMCQSetQuestions = [];
        renderMCQSetQuestions();
    }
}

// ১২. এডিটেড কন্টেন্ট সেভ
async function saveEditedContent() {
    if (!currentEditId || !currentEditPath) {
        alert("কোনো কন্টেন্ট সিলেক্ট করা হয়নি!");
        return;
    }
    
    const type = document.getElementById('edit-type').value;
    const path = document.getElementById('edit-path').value;
    const title = document.getElementById('edit-title').value.trim();
    
    if (!title) {
        alert("টাইটেল দিন!");
        return;
    }
    
    // Prepare data object
    let data = {
        title: title,
        type: type,
        timestamp: Date.now()
    };
    
    // Add image if exists
    const imageUrl = document.getElementById('edit-image-url').value;
    if (imageUrl) {
        data.imageUrl = imageUrl;
    }
    
    // Type-specific fields
    if (type === 'post') {
        data.body = document.getElementById('edit-body').value;
        const jsonCode = document.getElementById('edit-json').value;
        if (jsonCode) data.jsonCode = jsonCode;
    } else if (type === 'video' || type === 'pdf') {
        const url = document.getElementById('edit-url').value.trim();
        if (!url) {
            alert("লিঙ্ক দিন!");
            return;
        }
        data.url = url;
    } else if (type === 'mcq') {
        data.question = document.getElementById('edit-mcq-question').value;
        data.options = {
            A: document.getElementById('edit-opt-a').value,
            B: document.getElementById('edit-opt-b').value,
            C: document.getElementById('edit-opt-c').value,
            D: document.getElementById('edit-opt-d').value
        };
        data.answer = document.getElementById('edit-correct-ans').value;
        data.explanation = document.getElementById('edit-explanation').value;
    } else if (type === 'mcq_set') {
        if (currentMCQSetQuestions.length === 0) {
            alert("অন্তত একটি প্রশ্ন যোগ করুন!");
            return;
        }
        data.questions = currentMCQSetQuestions;
    } else if (type === 'image') {
        // Image type already handled by imageUrl
    }
    
    try {
        // Update in Firebase
        await db.ref(currentEditPath).update(data);
        
        alert("কন্টেন্ট সফলভাবে আপডেট হয়েছে! ✅");
        
        // Reload content list
        loadAllContent();
        
        // Hide edit form
        cancelEdit();
        
    } catch (error) {
        console.error("Save error:", error);
        alert("আপডেট ব্যর্থ: " + error.message);
    }
}

// ১৩. কন্টেন্ট ডিলিট
async function deleteCurrentContent() {
    if (!currentEditId || !currentEditPath) return;
    
    if (confirm(`"${document.getElementById('edit-title').value}" ডিলিট করতে চান?\n\nএই কাজটি রিভার্স করা যাবে না!`)) {
        try {
            await db.ref(currentEditPath).remove();
            alert("কন্টেন্ট ডিলিট করা হয়েছে! ✅");
            
            // Reload content list
            loadAllContent();
            
            // Hide edit form
            cancelEdit();
            
        } catch (error) {
            console.error("Delete error:", error);
            alert("ডিলিট ব্যর্থ: " + error.message);
        }
    }
}

// ১৪. এডিট বাতিল
function cancelEdit() {
    document.getElementById('edit-form-container').classList.add('hidden');
    currentEditId = '';
    currentEditPath = '';
    currentEditType = '';
    currentMCQSetQuestions = [];
    
    // Clear form fields
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-body').value = '';
    document.getElementById('edit-json').value = '';
    document.getElementById('edit-url').value = '';
    document.getElementById('edit-mcq-question').value = '';
    document.getElementById('edit-opt-a').value = '';
    document.getElementById('edit-opt-b').value = '';
    document.getElementById('edit-opt-c').value = '';
    document.getElementById('edit-opt-d').value = '';
    document.getElementById('edit-correct-ans').value = 'A';
    document.getElementById('edit-explanation').value = '';
    document.getElementById('edit-image-url').value = '';
    document.getElementById('edit-image-preview').innerHTML = '';
    document.getElementById('mcqset-questions-container').innerHTML = '';
    document.getElementById('import-json').value = '';
}

// ১৫. পেজ লোড হওয়ার সাথে সাথে সব কন্টেন্ট লোড
document.addEventListener('DOMContentLoaded', () => {
    loadAllContent();
});