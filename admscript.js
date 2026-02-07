// ============ FIREBASE CONFIG ============
const firebaseConfig = {
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw",
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com",
    projectId: "dhumketu2-fa6f0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============ GLOBAL VARIABLES ============
let classesList = [];
let currentJsonData = null;
let mcqQuestions = [];
let currentCategories = [];
let scannedSet = null;
let questionCounter = 0;
let isMobile = window.innerWidth < 768;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    // Check if mobile
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Load initial data
    loadClasses();
    loadDashboardStats();
    loadCategories();
    loadRecentSets();
    loadFolders();
    setupDropZone();
    
    // Auto-generate set ID
    generateSetId();
    
    // Set current time
    updateTime();
    setInterval(updateTime, 60000);
    
    // Initialize all sections
    initAllSections();
    
    // Load settings
    loadSettings();
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (isMobile && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuBtn.contains(e.target)) {
            toggleSidebar();
        }
    });
});

function checkMobile() {
    isMobile = window.innerWidth < 768;
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('last-update-time');
    if (timeElement) {
        timeElement.textContent = 
            now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    }
}

function initAllSections() {
    // Initialize form validation
    document.querySelectorAll('input[required], select[required]').forEach(el => {
        el.addEventListener('invalid', function(e) {
            e.preventDefault();
            showError(`দয়া করে ${e.target.placeholder || e.target.name} পূরণ করুন`, e.target.id);
        });
    });
    
    // Initialize tooltips
    document.querySelectorAll('[title]').forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
    });
}

// ============ MOBILE FUNCTIONS ============
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
    
    // Add overlay when sidebar is open
    if (sidebar.classList.contains('active')) {
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '1000';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    } else {
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.remove();
    }
}
// অ্যাডমিন ডিটেইলস সেভ করার ফাংশন
function updateAdminDetails() {
    const adminData = {
        name: document.getElementById('admin-name').value,
        email: document.getElementById('admin-email').value,
        qualification: document.getElementById('admin-qual').value,
        hours: document.getElementById('admin-hours').value,
        whatsapp: document.getElementById('admin-wa').value,
        facebook: document.getElementById('admin-fb').value,
        blog: document.getElementById('admin-blog').value
    };

    // সব ফিল্ড খালি কি না চেক করা (অপশনাল)
    if(!adminData.name || !adminData.whatsapp) {
        alert("Please at least provide Name and WhatsApp!");
        return;
    }

    db.ref('teacher').set(adminData)
    .then(() => {
        alert("Admin details updated successfully! ✅");
    })
    .catch((error) => {
        alert("Error: " + error.message);
    });
}

// পেজ লোড হওয়ার সময় বর্তমান ডেটা ইনপুট বক্সে দেখানো
function loadCurrentAdminData() {
    db.ref('teacher').once('value', (snap) => {
        const t = snap.val();
        if(t) {
            document.getElementById('admin-name').value = t.name || '';
            document.getElementById('admin-email').value = t.email || '';
            document.getElementById('admin-qual').value = t.qualification || '';
            document.getElementById('admin-hours').value = t.hours || '';
            document.getElementById('admin-wa').value = t.whatsapp || '';
            document.getElementById('admin-fb').value = t.facebook || '';
            document.getElementById('admin-blog').value = t.blog || '';
        }
    });
}

// পেজ লোড হলে কল হবে
document.addEventListener('DOMContentLoaded', loadCurrentAdminData);

// ============ NAVIGATION ============
function showSection(id, btn, mobileBtnId = null) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-btn-active'));
    
    // Update mobile nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
    if (mobileBtnId) {
        const mobileBtn = document.getElementById(mobileBtnId);
        if (mobileBtn) mobileBtn.classList.add('active');
    }
    
    // Show selected section
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    if(btn) btn.classList.add('nav-btn-active');
    
    // Close sidebar on mobile
    if (isMobile) {
        toggleSidebar();
    }
    
    // Load data for specific sections
    if(id === 'dashboard-sec') {
        loadDashboardStats();
        loadRecentSets();
    } else if(id === 'class-sec') {
        loadClasses();
        loadClassStats();
    } else if(id === 'subject-sec') {
        loadCategories();
    } else if(id === 'mcqset-sec') {
        loadFolders();
        generateSetId();
    } else if(id === 'single-sec') {
        loadFolders();
    } else if(id === 'json-sec') {
        loadClasses();
        loadFolders();
    } else if(id === 'magic-sec') {
        loadFolders();
    }
}

// ============ ERROR HANDLING ============
function showError(message, elementId = null) {
    console.error(message);
    
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-in';
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
    
    // Highlight problematic element
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('border-red-500', 'ring-2', 'ring-red-500');
            setTimeout(() => {
                element.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
            }, 3000);
        }
    }
}

function showSuccess(message) {
    // Create success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-in';
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed bg-slate-800 text-white px-3 py-2 rounded-lg text-xs z-50';
    tooltip.textContent = this.title;
    tooltip.id = 'tooltip';
    
    document.body.appendChild(tooltip);
    
    const rect = this.getBoundingClientRect();
    tooltip.style.top = (rect.top - 35) + 'px';
    tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.remove();
}

// ============ DASHBOARD FUNCTIONS ============
function loadDashboardStats() {
    // Update class count from classesList
    const statClassCount = document.getElementById('stat-class-count');
    const classCount = document.getElementById('class-count');
    if (statClassCount) statClassCount.textContent = classesList.length;
    if (classCount) classCount.textContent = classesList.length;
    
    // Load other stats from Firebase
    db.ref('qbank').once('value', snapshot => {
        const data = snapshot.val();
        let totalSets = 0;
        let totalQuestions = 0;
        let chapters = new Set();
        
        function analyzeData(obj) {
            if(!obj) return;
            
            for(let key in obj) {
                if(obj[key] && typeof obj[key] === 'object') {
                    if(obj[key].type === 'mcq_set') {
                        totalSets++;
                        totalQuestions += obj[key].questionCount || 0;
                        if(obj[key].chapter) chapters.add(obj[key].chapter);
                    } else if(obj[key].type === 'mcq') {
                        totalQuestions++;
                    }
                    analyzeData(obj[key]);
                }
            }
        }
        
        analyzeData(data);
        
        // Update stats
        const statSets = document.getElementById('stat-sets');
        const statQuestions = document.getElementById('stat-questions');
        const statChapters = document.getElementById('stat-chapters');
        const totalSetsAdmin = document.getElementById('total-sets-admin');
        const totalQuestionsAdmin = document.getElementById('total-questions-admin');
        
        if (statSets) statSets.textContent = totalSets;
        if (statQuestions) statQuestions.textContent = totalQuestions;
        if (statChapters) statChapters.textContent = chapters.size;
        if (totalSetsAdmin) totalSetsAdmin.textContent = totalSets;
        if (totalQuestionsAdmin) totalQuestionsAdmin.textContent = totalQuestions;
    });
}

function loadRecentSets() {
    const recentSetsDiv = document.getElementById('recent-sets');
    if (!recentSetsDiv) return;
    
    recentSetsDiv.innerHTML = '<div class="text-center py-4 text-slate-500">লোড হচ্ছে...</div>';
    
    db.ref('qbank').once('value', snapshot => {
        const data = snapshot.val();
        const sets = [];
        
        function collectSets(obj, path) {
            if(!obj) return;
            
            for(let key in obj) {
                if(obj[key] && obj[key].type === 'mcq_set') {
                    sets.push({
                        ...obj[key],
                        id: key,
                        path: path
                    });
                } else if(obj[key] && typeof obj[key] === 'object') {
                    collectSets(obj[key], path ? `${path}/${key}` : key);
                }
            }
        }
        
        collectSets(data);
        
        // Sort by time (newest first) and take 5
        sets.sort((a, b) => b.time - a.time);
        const recent = sets.slice(0, 5);
        
        if(recent.length === 0) {
            recentSetsDiv.innerHTML = '<div class="text-center py-8 text-slate-500">কোন MCQ সেট নেই</div>';
            return;
        }
        
        recentSetsDiv.innerHTML = '';
        recent.forEach((set, index) => {
            const div = document.createElement('div');
            div.className = "p-4 bg-slate-900/50 rounded-xl border border-slate-700";
            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold bg-purple-900/50 text-purple-300 px-2 py-1 rounded">Set ${index + 1}</span>
                    <span class="text-xs text-slate-500">${set.questionCount || 0} Qs</span>
                </div>
                <h4 class="font-medium text-sm mb-2 line-clamp-2">${set.title || 'No Title'}</h4>
                <div class="flex flex-wrap gap-1">
                    ${set.class ? `<span class="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded">${set.class}</span>` : ''}
                    ${set.subject ? `<span class="text-[10px] bg-green-900/50 text-green-300 px-2 py-1 rounded">${set.subject}</span>` : ''}
                </div>
            `;
            recentSetsDiv.appendChild(div);
        });
    });
}

// ============ CLASS MANAGEMENT ============
function loadClasses() {
    const classesDiv = document.getElementById('classes-list');
    if (!classesDiv) return;
    
    classesDiv.innerHTML = '<div class="text-center py-8 text-slate-500">লোড হচ্ছে...</div>';
    
    db.ref('classes').once('value', snapshot => {
        const data = snapshot.val();
        classesList = [];
        
        if(data) {
            Object.keys(data).forEach(key => {
                classesList.push({
                    id: key,
                    ...data[key]
                });
            });
            
            // Sort by creation time
            classesList.sort((a, b) => b.createdAt - a.createdAt);
        }
        
        displayClasses();
        updateClassDropdowns();
        loadClassStats();
    });
}

function displayClasses() {
    const classesDiv = document.getElementById('classes-list');
    const totalClasses = document.getElementById('total-classes');
    
    if(!classesDiv) return;
    
    if(classesList.length === 0) {
        classesDiv.innerHTML = `
            <div class="text-center py-12 text-slate-500">
                <div class="text-4xl mb-4"><i class="fas fa-school"></i></div>
                <p>কোন শ্রেণী নেই</p>
                <p class="text-sm text-slate-600 mt-2">প্রথম শ্রেণী তৈরি করুন</p>
            </div>
        `;
        if (totalClasses) totalClasses.textContent = "0 Classes";
        return;
    }
    
    classesDiv.innerHTML = '';
    if (totalClasses) totalClasses.textContent = `${classesList.length} Classes`;
    
    classesList.forEach(cls => {
        const classDiv = document.createElement('div');
        classDiv.className = `p-4 bg-slate-900/50 rounded-xl border ${cls.active ? 'border-green-500/30' : 'border-slate-700'} mb-3`;
        
        const classColor = getClassColor(cls.code);
        
        classDiv.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-bold text-slate-200 text-sm md:text-base">${cls.name_bn || 'No Name'}</h4>
                    <p class="text-xs md:text-sm text-slate-400">${cls.name_en || cls.code || ''}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${cls.active ? '<span class="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">Active</span>' : ''}
                    ${cls.featured ? '<span class="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">Featured</span>' : ''}
                    <button onclick="editClass('${cls.id}')" class="text-blue-400 hover:text-blue-300"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteClass('${cls.id}')" class="text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            
            <div class="flex items-center gap-2 mb-3 flex-wrap">
                <span class="class-badge ${classColor}">${cls.code || ''}</span>
                ${cls.main_subject ? `<span class="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">${cls.main_subject}</span>` : ''}
                <span class="text-xs text-slate-500">${cls.student_count || 0} Students</span>
            </div>
            
            ${cls.description ? `<p class="text-xs md:text-sm text-slate-400 mb-2">${cls.description}</p>` : ''}
            
            <div class="text-xs text-slate-500">
                Created: ${new Date(cls.createdAt || Date.now()).toLocaleDateString('bn-BD')}
            </div>
        `;
        
        classesDiv.appendChild(classDiv);
    });
}

function getClassColor(classCode) {
    const colors = {
        'nine': 'bg-blue-100 text-blue-800',
        'ten': 'bg-green-100 text-green-800',
        'eleven': 'bg-purple-100 text-purple-800',
        'twelve': 'bg-red-100 text-red-800',
        'hsc': 'bg-indigo-100 text-indigo-800',
        'ssc': 'bg-amber-100 text-amber-800',
        'admission': 'bg-pink-100 text-pink-800'
    };
    return colors[classCode] || 'bg-gray-100 text-gray-800';
}

function addNewClass() {
    const code = document.getElementById('class_code').value.trim().toLowerCase();
    const nameBn = document.getElementById('class_name_bn').value.trim();
    const nameEn = document.getElementById('class_name_en').value.trim();
    const description = document.getElementById('class_description').value.trim();
    const mainSubject = document.getElementById('class_main_subject').value.trim();
    const studentCount = parseInt(document.getElementById('class_student_count').value) || 0;
    const active = document.getElementById('class_active').checked;
    const featured = document.getElementById('class_featured').checked;
    
    // Validation
    if(!code || !nameBn) {
        showError("শ্রেণীর কোড এবং বাংলা নাম পূরণ করুন!");
        return;
    }
    
    // Check if class already exists
    if(classesList.some(cls => cls.code === code)) {
        showError("এই শ্রেণীর কোড ইতিমধ্যে আছে!");
        return;
    }
    
    const classData = {
        code: code,
        name_bn: nameBn,
        name_en: nameEn || code,
        description: description || null,
        main_subject: mainSubject || null,
        student_count: studentCount,
        active: active,
        featured: featured,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    // Save to Firebase
    const newRef = db.ref('classes').push();
    classData.id = newRef.key;
    
    newRef.set(classData).then(() => {
        showSuccess("শ্রেণী সফলভাবে তৈরি হয়েছে!");
        
        // Clear form
        document.getElementById('class_code').value = '';
        document.getElementById('class_name_bn').value = '';
        document.getElementById('class_name_en').value = '';
        document.getElementById('class_description').value = '';
        document.getElementById('class_main_subject').value = '';
        document.getElementById('class_student_count').value = '0';
        
        // Reload classes
        loadClasses();
        
    }).catch(error => {
        showError("ত্রুটি: " + error.message);
    });
}

function editClass(classId) {
    const cls = classesList.find(c => c.id === classId);
    if(!cls) return;
    
    // Fill form with class data
    document.getElementById('class_code').value = cls.code || '';
    document.getElementById('class_name_bn').value = cls.name_bn || '';
    document.getElementById('class_name_en').value = cls.name_en || '';
    document.getElementById('class_description').value = cls.description || '';
    document.getElementById('class_main_subject').value = cls.main_subject || '';
    document.getElementById('class_student_count').value = cls.student_count || 0;
    document.getElementById('class_active').checked = cls.active || false;
    document.getElementById('class_featured').checked = cls.featured || false;
    
    // Change button text
    const submitBtn = document.querySelector('#class-sec button[onclick="addNewClass()"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "<i class='fas fa-sync mr-2'></i> শ্রেণী আপডেট করুন";
        submitBtn.onclick = function() { updateClass(classId); };
        
        // Store original function
        submitBtn.dataset.original = originalText;
    }
}

function updateClass(classId) {
    const code = document.getElementById('class_code').value.trim().toLowerCase();
    const nameBn = document.getElementById('class_name_bn').value.trim();
    const nameEn = document.getElementById('class_name_en').value.trim();
    const description = document.getElementById('class_description').value.trim();
    const mainSubject = document.getElementById('class_main_subject').value.trim();
    const studentCount = parseInt(document.getElementById('class_student_count').value) || 0;
    const active = document.getElementById('class_active').checked;
    const featured = document.getElementById('class_featured').checked;
    
    // Validation
    if(!code || !nameBn) {
        showError("শ্রেণীর কোড এবং বাংলা নাম পূরণ করুন!");
        return;
    }
    
    const classData = {
        code: code,
        name_bn: nameBn,
        name_en: nameEn || code,
        description: description || null,
        main_subject: mainSubject || null,
        student_count: studentCount,
        active: active,
        featured: featured,
        updatedAt: Date.now()
    };
    
    // Update in Firebase
    db.ref(`classes/${classId}`).update(classData).then(() => {
        showSuccess("শ্রেণী সফলভাবে আপডেট হয়েছে!");
        
        // Reset form and button
        const submitBtn = document.querySelector('#class-sec button[onclick="updateClass(\'' + classId + '\')"]');
        if (submitBtn) {
            submitBtn.innerHTML = submitBtn.dataset.original;
            submitBtn.onclick = function() { addNewClass(); };
        }
        
        // Clear form
        document.getElementById('class_code').value = '';
        document.getElementById('class_name_bn').value = '';
        document.getElementById('class_name_en').value = '';
        document.getElementById('class_description').value = '';
        document.getElementById('class_main_subject').value = '';
        document.getElementById('class_student_count').value = '0';
        document.getElementById('class_active').checked = true;
        document.getElementById('class_featured').checked = false;
        
        // Reload classes
        loadClasses();
        
    }).catch(error => {
        showError("ত্রুটি: " + error.message);
    });
}

function deleteClass(classId) {
    if(confirm("এই শ্রেণী ডিলিট করতে চান? সব বিষয় এবং MCQ প্রশ্নও ডিলিট হবে!")) {
        db.ref(`classes/${classId}`).remove().then(() => {
            showSuccess("শ্রেণী ডিলিট হয়েছে!");
            loadClasses();
        }).catch(error => {
            showError("ত্রুটি: " + error.message);
        });
    }
}

function updateClassDropdowns() {
    const classDropdown = document.getElementById('json_class');
    if (!classDropdown) return;
    
    classDropdown.innerHTML = '<option value="">শ্রেণী নির্বাচন করুন</option>';
    
    classesList.forEach(cls => {
        if(cls.active) {
            classDropdown.innerHTML += `<option value="${cls.code}">${cls.name_bn} (${cls.code})</option>`;
        }
    });
}

function updateJsonSubjectList() {
    const classCode = document.getElementById('json_class').value;
    const subjectDropdown = document.getElementById('json_subject');
    
    if(!subjectDropdown) return;
    
    if(!classCode) {
        subjectDropdown.innerHTML = '<option value="">প্রথম শ্রেণী নির্বাচন করুন</option>';
        return;
    }
    
    // Common subjects
    const subjects = {
        'physics': 'পদার্থবিজ্ঞান',
        'chemistry': 'রসায়ন',
        'math': 'গণিত',
        'biology': 'জীববিজ্ঞান',
        'bangla': 'বাংলা',
        'english': 'ইংরেজি',
        'ict': 'তথ্য ও যোগাযোগ প্রযুক্তি'
    };
    
    subjectDropdown.innerHTML = '<option value="">বিষয় নির্বাচন করুন</option>';
    Object.keys(subjects).forEach(code => {
        subjectDropdown.innerHTML += `<option value="${code}">${subjects[code]}</option>`;
    });
}

function loadClassStats() {
    // Update class count
    const classCount = document.getElementById('class-count');
    const statClassCountDisplay = document.getElementById('stat-class-count-display');
    const statClassCount = document.getElementById('stat-class-count');
    
    if (classCount) classCount.textContent = classesList.length;
    if (statClassCountDisplay) statClassCountDisplay.textContent = classesList.length;
    if (statClassCount) statClassCount.textContent = classesList.length;
    
    // Count active classes
    const activeClasses = classesList.filter(cls => cls.active);
    const statActiveClasses = document.getElementById('stat-active-classes');
    if (statActiveClasses) statActiveClasses.textContent = activeClasses.length;
    
    // Load other stats from Firebase
    db.ref('qbank').once('value', snapshot => {
        const data = snapshot.val();
        let subjectCount = 0;
        let mcqCount = 0;
        let subjects = new Set();
        
        function countStats(obj) {
            if(!obj) return;
            
            for(let key in obj) {
                if(obj[key] && typeof obj[key] === 'object') {
                    if(obj[key].type === 'mcq' || obj[key].type === 'mcq_set') {
                        mcqCount++;
                        if(obj[key].subject) subjects.add(obj[key].subject);
                    }
                    countStats(obj[key]);
                }
            }
        }
        
        countStats(data);
        
        const statSubjectCount = document.getElementById('stat-subject-count');
        const statMcqCount = document.getElementById('stat-mcq-count');
        
        if (statSubjectCount) statSubjectCount.textContent = subjects.size;
        if (statMcqCount) statMcqCount.textContent = mcqCount;
    });
}

// ============ SUBJECT MANAGEMENT ============
function loadCategories() {
    const categoriesDiv = document.getElementById('categories-list');
    if (!categoriesDiv) {
        console.error("categories-list element not found!");
        return;
    }
    
    categoriesDiv.innerHTML = '<div class="text-center py-8 text-slate-500">লোড হচ্ছে...</div>';
    
    // Firebase থেকে ডাটা লোড করুন
    db.ref('subjects').once('value', snapshot => {
        const data = snapshot.val();
        currentCategories = [];
        
        if (data) {
            Object.keys(data).forEach(key => {
                currentCategories.push({
                    id: key,
                    ...data[key]
                });
            });
            
            // Sort by creation time
            currentCategories.sort((a, b) => b.createdAt - a.createdAt);
        }
        
        displayCategories(currentCategories);
    }).catch(error => {
        console.error("Error loading categories:", error);
        // Fallback to demo data
        loadDemoCategories();
    });
}

function loadDemoCategories() {
    currentCategories = [
        { class: 'nine', subject: 'physics', chapter: 'বল', description: 'নিউটনের গতিসূত্র' },
        { class: 'nine', subject: 'math', chapter: 'বীজগণিত', description: 'বীজগাণিতিক রাশি' },
        { class: 'ten', subject: 'physics', chapter: 'তাপ', description: 'তাপ ও তাপমাত্রা' },
        { class: 'ten', subject: 'chemistry', chapter: 'রাসায়নিক বন্ধন', description: 'আয়নিক ও সমযোজী বন্ধন' },
        { class: 'eleven', subject: 'physics', chapter: 'ভেক্টর', description: 'ভেক্টরের ধারণা' },
        { class: 'twelve', subject: 'biology', chapter: 'জীনতত্ত্ব', description: 'মেন্ডেলের সূত্র' }
    ];
    
    displayCategories(currentCategories);
}

function displayCategories(categories) {
    const categoriesDiv = document.getElementById('categories-list');
    if (!categoriesDiv) return;
    
    categoriesDiv.innerHTML = '';
    
    if (categories.length === 0) {
        categoriesDiv.innerHTML = '<div class="text-center py-8 text-slate-500">কোন বিষয় পাওয়া যায়নি</div>';
        return;
    }
    
    const classNames = {
        'nine': 'নবম শ্রেণি',
        'ten': 'দশম শ্রেণি',
        'eleven': 'একাদশ শ্রেণি',
        'twelve': 'দ্বাদশ শ্রেণি',
        'hsc': 'এইচএসসি',
        'ssc': 'এসএসসি',
        'admission': 'ভর্তি প্রস্তুতি'
    };
    
    const subjectNames = {
        'physics': 'পদার্থবিজ্ঞান',
        'chemistry': 'রসায়ন',
        'math': 'গণিত',
        'biology': 'জীববিজ্ঞান',
        'bangla': 'বাংলা',
        'english': 'ইংরেজি',
        'ict': 'তথ্য ও যোগাযোগ প্রযুক্তি'
    };
    
    categories.forEach((cat, index) => {
        const div = document.createElement('div');
        div.className = "p-4 bg-slate-900/50 rounded-xl border border-slate-700 mb-3";
        div.style.borderLeft = "4px solid #10b981";
        
        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-bold text-slate-200 text-sm md:text-base">${subjectNames[cat.subject] || cat.subject}</h4>
                    <p class="text-xs md:text-sm text-slate-400">${classNames[cat.class] || cat.class}</p>
                </div>
                <button onclick="deleteCategory('${cat.id || index}')" class="text-red-400 hover:text-red-300">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="text-xs md:text-sm text-slate-300 mb-2">অধ্যায়: ${cat.chapter}</div>
            ${cat.description ? `<div class="text-xs text-slate-500">${cat.description}</div>` : ''}
            <div class="mt-2 text-xs text-slate-500">
                ${cat.createdAt ? `Created: ${new Date(cat.createdAt).toLocaleDateString('bn-BD')}` : ''}
            </div>
        `;
        
        categoriesDiv.appendChild(div);
    });
}

function addNewCategory() {
    const classVal = document.getElementById('new_class').value;
    const subject = document.getElementById('new_subject').value.trim();
    const chapter = document.getElementById('new_chapter').value.trim();
    const description = document.getElementById('new_description').value.trim();
    
    if (!classVal || !subject || !chapter) {
        showError("শ্রেণি, বিষয় এবং অধ্যায়ের নাম পূরণ করুন!");
        return;
    }
    
    const newCategory = {
        class: classVal,
        subject: subject.toLowerCase(),
        chapter: chapter,
        description: description,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    // Firebase-এ সংরক্ষণ করুন
    db.ref('subjects').push(newCategory)
        .then(() => {
            showSuccess("বিষয় সফলভাবে যোগ করা হয়েছে!");
            
            // Clear form
            document.getElementById('new_subject').value = '';
            document.getElementById('new_chapter').value = '';
            document.getElementById('new_description').value = '';
            
            // Reload categories
            loadCategories();
            
            // Update stats
            loadDashboardStats();
        })
        .catch(error => {
            console.error("Error saving category:", error);
            showError("ত্রুটি: " + error.message);
        });
}

function deleteCategory(categoryId) {
    if (!confirm("এই বিষয় ডিলিট করতে চান?")) return;
    
    // Check if it's a demo category (numeric ID) or Firebase ID
    if (isNaN(categoryId)) {
        // Firebase category
        db.ref(`subjects/${categoryId}`).remove()
            .then(() => {
                showSuccess("বিষয় ডিলিট করা হয়েছে!");
                loadCategories();
            })
            .catch(error => {
                showError("ত্রুটি: " + error.message);
            });
    } else {
        // Demo category
        currentCategories.splice(categoryId, 1);
        displayCategories(currentCategories);
        showSuccess("বিষয় ডিলিট করা হয়েছে!");
    }
}

function filterCategories(className) {
    const buttons = document.querySelectorAll('.filter-cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active', 'bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
        btn.classList.add('bg-slate-700', 'text-slate-300');
    });
    
    // Activate clicked button
    const activeBtn = document.querySelector(`.filter-cat-btn[onclick*="${className}"]`);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
        activeBtn.classList.remove('bg-slate-700', 'text-slate-300');
    }
    
    // Show all categories or filter by class
    let filteredCategories;
    if(className === 'all') {
        filteredCategories = currentCategories;
    } else {
        filteredCategories = currentCategories.filter(cat => cat.class === className);
    }
    
    // Display filtered categories
    displayCategories(filteredCategories);
}

// ============ MCQ SET CREATION ============
function generateSetId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const setId = `MCQSET_${timestamp}_${random}`;
    
    const setInput = document.getElementById('set_id');
    if (setInput) {
        setInput.value = setId;
    }
    
    return setId;
}

function addNewQuestion() {
    if (questionCounter >= 30) {
        showError("সর্বোচ্চ ৩০টি প্রশ্ন যোগ করা যাবে!");
        return;
    }
    
    questionCounter++;
    const questionIndex = questionCounter - 1;
    
    const questionsContainer = document.getElementById('questions-container');
    if (!questionsContainer) {
        console.error("questions-container not found!");
        return;
    }
    
    // Remove placeholder if exists
    if (questionCounter === 1) {
        questionsContainer.innerHTML = '';
    }
    
    const questionDiv = document.createElement('div');
    questionDiv.className = "q-block bg-slate-900/70 p-4 md:p-6 rounded-2xl border-l-4 border-purple-500 relative mb-4";
    questionDiv.id = `question-${questionIndex}`;
    
    questionDiv.innerHTML = `
        <div class="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${questionCounter}</div>
        
        <div class="flex justify-between items-start mb-3">
            <span class="text-sm font-bold text-purple-300">প্রশ্ন ${questionCounter}</span>
            <button onclick="removeQuestion(${questionIndex})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <textarea class="q-title input-custom mb-3 font-bold text-sm bg-slate-800" rows="2" 
                  placeholder="প্রশ্ন লিখুন..." 
                  oninput="updateQuestion(${questionIndex}, 'title', this.value)"></textarea>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <input type="text" class="q-a input-custom text-xs md:text-sm" placeholder="ক) প্রথম অপশন" 
                   oninput="updateQuestion(${questionIndex}, 'options.A', this.value)">
            <input type="text" class="q-b input-custom text-xs md:text-sm" placeholder="খ) দ্বিতীয় অপশন" 
                   oninput="updateQuestion(${questionIndex}, 'options.B', this.value)">
            <input type="text" class="q-c input-custom text-xs md:text-sm" placeholder="গ) তৃতীয় অপশন" 
                   oninput="updateQuestion(${questionIndex}, 'options.C', this.value)">
            <input type="text" class="q-d input-custom text-xs md:text-sm" placeholder="ঘ) চতুর্থ অপশন" 
                   oninput="updateQuestion(${questionIndex}, 'options.D', this.value)">
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <select class="q-ans select-custom text-xs md:text-sm" onchange="updateQuestion(${questionIndex}, 'answer', this.value)">
                <option value="A">সঠিক উত্তর: ক</option>
                <option value="B">সঠিক উত্তর: খ</option>
                <option value="C">সঠিক উত্তর: গ</option>
                <option value="D">সঠিক উত্তর: ঘ</option>
            </select>
            
            <select class="q-diff select-custom text-xs md:text-sm" onchange="updateQuestion(${questionIndex}, 'difficulty', this.value)">
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
            </select>
        </div>
        
        <textarea class="input-custom text-xs md:text-sm" rows="2" placeholder="ব্যাখ্যা (ঐচ্ছিক)" 
                  oninput="updateQuestion(${questionIndex}, 'explanation', this.value)"></textarea>
    `;
    
    questionsContainer.appendChild(questionDiv);
    
    // Initialize question object
    mcqQuestions[questionIndex] = {
        title: '',
        type: 'mcq',
        difficulty: 'medium',
        answer: 'A',
        options: { A: '', B: '', C: '', D: '' },
        explanation: ''
    };
    
    // Update counter
    updateQuestionCounter();
    
    // Scroll to the new question on mobile
    if (window.innerWidth < 768) {
        setTimeout(() => {
            questionDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

function updateQuestionCounter() {
    const counterElement = document.getElementById('question-counter');
    if (counterElement) {
        counterElement.textContent = questionCounter;
        counterElement.style.color = questionCounter >= 25 ? '#10b981' : 
                                    questionCounter >= 15 ? '#f59e0b' : '#ef4444';
    }
}

function updateQuestion(index, field, value) {
    if(!mcqQuestions[index]) mcqQuestions[index] = {};
    
    // Handle nested fields
    if(field.includes('.')) {
        const parts = field.split('.');
        let obj = mcqQuestions[index];
        for(let i = 0; i < parts.length - 1; i++) {
            if(!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
    } else {
        mcqQuestions[index][field] = value;
    }
}

function removeQuestion(index) {
    if(confirm("প্রশ্নটি রিমুভ করতে চান?")) {
        // Remove from array
        mcqQuestions.splice(index, 1);
        
        // Re-render all questions
        questionCounter = 0;
        const questionsContainer = document.getElementById('questions-container');
        if (!questionsContainer) return;
        
        questionsContainer.innerHTML = '';
        
        mcqQuestions.forEach((q, idx) => {
            questionCounter++;
            const questionDiv = document.createElement('div');
            questionDiv.className = "q-block bg-slate-900/70 p-4 md:p-6 rounded-2xl border-l-4 border-purple-500 relative mb-4";
            questionDiv.innerHTML = `
                <div class="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${idx + 1}</div>
                
                <div class="flex justify-between items-start mb-3">
                    <span class="text-sm font-bold text-purple-300">প্রশ্ন ${idx + 1}</span>
                    <button onclick="removeQuestion(${idx})" class="text-red-400 hover:text-red-300"><i class="fas fa-times"></i></button>
                </div>
                
                <textarea class="q-title input-custom mb-3 font-bold text-sm bg-slate-800" rows="2" 
                          placeholder="প্রশ্ন লিখুন..." onchange="updateQuestion(${idx}, 'title', this.value)">${q.title || ''}</textarea>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <input type="text" class="q-a input-custom text-xs md:text-sm" placeholder="ক) প্রথম অপশন" 
                           value="${q.options?.A || ''}" onchange="updateQuestion(${idx}, 'options.A', this.value)">
                    <input type="text" class="q-b input-custom text-xs md:text-sm" placeholder="খ) দ্বিতীয় অপশন" 
                           value="${q.options?.B || ''}" onchange="updateQuestion(${idx}, 'options.B', this.value)">
                    <input type="text" class="q-c input-custom text-xs md:text-sm" placeholder="গ) তৃতীয় অপশন" 
                           value="${q.options?.C || ''}" onchange="updateQuestion(${idx}, 'options.C', this.value)">
                    <input type="text" class="q-d input-custom text-xs md:text-sm" placeholder="ঘ) চতুর্থ অপশন" 
                           value="${q.options?.D || ''}" onchange="updateQuestion(${idx}, 'options.D', this.value)">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <select class="q-ans select-custom text-xs md:text-sm" onchange="updateQuestion(${idx}, 'answer', this.value)">
                        <option value="A" ${q.answer==='A'?'selected':''}>সঠিক উত্তর: ক</option>
                        <option value="B" ${q.answer==='B'?'selected':''}>সঠিক উত্তর: খ</option>
                        <option value="C" ${q.answer==='C'?'selected':''}>সঠিক উত্তর: গ</option>
                        <option value="D" ${q.answer==='D'?'selected':''}>সঠিক উত্তর: ঘ</option>
                    </select>
                    
                    <select class="q-diff select-custom text-xs md:text-sm" onchange="updateQuestion(${idx}, 'difficulty', this.value)">
                        <option value="easy" ${q.difficulty==='easy'?'selected':''}>Easy</option>
                        <option value="medium" ${q.difficulty==='medium'?'selected':''}>Medium</option>
                        <option value="hard" ${q.difficulty==='hard'?'selected':''}>Hard</option>
                    </select>
                </div>
                
                <textarea class="input-custom text-xs md:text-sm" rows="2" placeholder="ব্যাখ্যা (ঐচ্ছিক)" 
                          onchange="updateQuestion(${idx}, 'explanation', this.value)">${q.explanation || ''}</textarea>
            `;
            
            questionsContainer.appendChild(questionDiv);
        });
        
        // Update counter
        updateQuestionCounter();
        
        if(questionCounter === 0) {
            questionsContainer.innerHTML = `
                <div class="text-center py-12 text-slate-500">
                    <div class="text-4xl mb-4"><i class="fas fa-edit"></i></div>
                    <p>প্রথম প্রশ্ন যোগ করুন</p>
                    <p class="text-sm text-slate-600 mt-2">প্রতিটি সেটে ২৫-৩০ টি প্রশ্ন থাকা উচিত</p>
                </div>
            `;
        }
    }
}

async function saveMCQSet() {
    // Validate set info
    const title = document.getElementById('set_title').value.trim();
    const classVal = document.getElementById('set_class').value;
    const subject = document.getElementById('set_subject').value;
    const chapter = document.getElementById('set_chapter').value.trim();
    const folder = document.getElementById('set_folder').value;
    const publish = document.getElementById('set_publish').checked;
    const featured = document.getElementById('set_featured').checked;
    
    if(!title || !classVal || !subject || !chapter || !folder) {
        showError("সব প্রয়োজনীয় তথ্য পূরণ করুন!");
        return;
    }
    
    if(mcqQuestions.length < 25) {
        if(!confirm(`মাত্র ${mcqQuestions.length}টি প্রশ্ন আছে। কমপক্ষে ২৫টি প্রশ্ন হওয়া উচিত। তবুও সংরক্ষণ করতে চান?`)) {
            return;
        }
    }
    
    // Validate all questions
    for(let i = 0; i < mcqQuestions.length; i++) {
        const q = mcqQuestions[i];
        if(!q.title || !q.options?.A || !q.options?.B || !q.options?.C || !q.options?.D) {
            showError(`প্রশ্ন ${i + 1} পূর্ণ করুন (শিরোনাম এবং সব অপশন প্রয়োজন)!`);
            return;
        }
    }
    
    // Prepare set data
    const setId = document.getElementById('set_id').value;
    const setData = {
        title: title,
        type: 'mcq_set',
        description: document.getElementById('set_description').value.trim(),
        class: classVal,
        subject: subject,
        chapter: chapter,
        difficulty: document.getElementById('set_difficulty').value,
        questionCount: mcqQuestions.length,
        time: Date.now(),
        published: publish,
        featured: featured,
        createdBy: 'Admin'
    };
    
    try {
        // Save set metadata
        const setRef = db.ref(`${folder}/${setId}`);
        await setRef.set(setData);
        
        // Save each question
        for(let i = 0; i < mcqQuestions.length; i++) {
            const q = mcqQuestions[i];
            await setRef.child(`q${i + 1}`).set({
                ...q,
                time: Date.now()
            });
        }
        
        showSuccess(`MCQ সেট সফলভাবে সংরক্ষণ হয়েছে! ${mcqQuestions.length} টি প্রশ্ন যুক্ত হয়েছে।`);
        
        // Reset form
        resetMCQSetForm();
        
        // Update dashboard
        loadDashboardStats();
        loadRecentSets();
        
    } catch(error) {
        showError("ত্রুটি: " + error.message);
    }
}

function resetMCQSetForm() {
    document.getElementById('set_title').value = '';
    document.getElementById('set_description').value = '';
    document.getElementById('set_chapter').value = '';
    
    const questionsContainer = document.getElementById('questions-container');
    if (questionsContainer) {
        questionsContainer.innerHTML = `
            <div class="text-center py-12 text-slate-500">
                <div class="text-4xl mb-4"><i class="fas fa-edit"></i></div>
                <p>প্রথম প্রশ্ন যোগ করুন</p>
                <p class="text-sm text-slate-600 mt-2">প্রতিটি সেটে ২৫-৩০ টি প্রশ্ন থাকা উচিত</p>
            </div>
        `;
    }
    
    mcqQuestions = [];
    questionCounter = 0;
    const questionCounterElement = document.getElementById('question-counter');
    if (questionCounterElement) questionCounterElement.textContent = '0';
    generateSetId();
}

// ============ SINGLE MCQ FUNCTIONS ============
function saveSingleMCQ() {
    const title = document.getElementById('single_title').value.trim();
    const description = document.getElementById('single_description').value.trim();
    const classVal = document.getElementById('single_class').value;
    const subject = document.getElementById('single_subject').value;
    const chapter = document.getElementById('single_chapter').value.trim();
    const optionA = document.getElementById('single_a').value.trim();
    const optionB = document.getElementById('single_b').value.trim();
    const optionC = document.getElementById('single_c').value.trim();
    const optionD = document.getElementById('single_d').value.trim();
    const answer = document.getElementById('single_answer').value;
    const difficulty = document.getElementById('single_difficulty').value;
    const explanation = document.getElementById('single_explanation').value.trim();
    const folder = document.getElementById('single_folder').value;
    
    // Validation
    if(!title || !optionA || !optionB || !optionC || !optionD || !folder) {
        showError("সব প্রয়োজনীয় তথ্য পূরণ করুন!");
        return;
    }
    
    const mcqData = {
        title: title,
        type: 'mcq',
        description: description || null,
        class: classVal || null,
        subject: subject || null,
        chapter: chapter || null,
        difficulty: difficulty,
        options: {
            A: optionA,
            B: optionB,
            C: optionC,
            D: optionD
        },
        answer: answer,
        explanation: explanation || null,
        time: Date.now(),
        uploadedBy: 'Admin'
    };
    
    // Save to Firebase
    db.ref(folder).push(mcqData).then(() => {
        showSuccess("MCQ প্রশ্ন সফলভাবে সংরক্ষণ হয়েছে!");
        
        // Clear form
        document.getElementById('single_title').value = '';
        document.getElementById('single_description').value = '';
        document.getElementById('single_a').value = '';
        document.getElementById('single_b').value = '';
        document.getElementById('single_c').value = '';
        document.getElementById('single_d').value = '';
        document.getElementById('single_explanation').value = '';
        document.getElementById('single_chapter').value = '';
        
        // Update stats
        loadDashboardStats();
        
    }).catch(error => {
        showError("ত্রুটি: " + error.message);
    });
}

// ============ JSON UPLOAD FUNCTIONS ============
function setupDropZone() {
    const dropZone = document.getElementById('json-drop-zone');
    const fileInput = document.getElementById('json-drop-input');
    
    if (!dropZone || !fileInput) return;
    
    // Click to select file
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('dragover');
    }
    
    function unhighlight() {
        dropZone.classList.remove('dragover');
    }
    
    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if(files.length > 0) {
            handleJsonFile(files[0]);
        }
    }
    
    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        if(this.files.length > 0) {
            handleJsonFile(this.files[0]);
        }
    });
}

function handleJsonFile(file) {
    if(!file.name.endsWith('.json')) {
        showError("শুধুমাত্র JSON ফাইল আপলোড করুন!");
        return;
    }
    
    const dropZone = document.getElementById('json-drop-zone');
    if (!dropZone) return;
    
    dropZone.classList.add('active');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            currentJsonData = jsonData;
            
            // Update drop zone with file info
            dropZone.innerHTML = `
                <div class="text-3xl md:text-4xl mb-3"><i class="fas fa-check-circle text-green-400"></i></div>
                <h4 class="text-lg font-bold mb-1 text-green-300">${file.name}</h4>
                <p class="text-sm text-slate-400 mb-2">${(file.size / 1024).toFixed(2)} KB</p>
                <p class="text-sm text-green-400">ফাইল সফলভাবে লোড হয়েছে!</p>
                <button onclick="resetDropZone()" class="mt-4 text-sm text-slate-400 hover:text-white">
                    অন্য ফাইল সিলেক্ট করুন
                </button>
            `;
            
            // Auto-fill form if data has class/subject info
            if(jsonData.setInfo) {
                if(jsonData.setInfo.class) {
                    const jsonClass = document.getElementById('json_class');
                    if (jsonClass) jsonClass.value = jsonData.setInfo.class;
                    updateJsonSubjectList();
                }
                if(jsonData.setInfo.subject) {
                    const jsonSubject = document.getElementById('json_subject');
                    if (jsonSubject) jsonSubject.value = jsonData.setInfo.subject;
                }
                if(jsonData.setInfo.chapter) {
                    const jsonChapter = document.getElementById('json_chapter');
                    if (jsonChapter) jsonChapter.value = jsonData.setInfo.chapter;
                }
                if(jsonData.setInfo.difficulty) {
                    const jsonDifficulty = document.getElementById('json_difficulty');
                    if (jsonDifficulty) jsonDifficulty.value = jsonData.setInfo.difficulty;
                }
            }
            
        } catch(error) {
            showError("JSON ফাইল পার্স করতে সমস্যা: " + error.message);
            resetDropZone();
        }
    };
    
    reader.onerror = function() {
        showError("ফাইল পড়তে সমস্যা!");
        resetDropZone();
    };
    
    reader.readAsText(file);
}

function resetDropZone() {
    const dropZone = document.getElementById('json-drop-zone');
    if (!dropZone) return;
    
    dropZone.classList.remove('active');
    dropZone.innerHTML = `
        <div class="text-3xl md:text-5xl mb-4"><i class="fas fa-file-upload"></i></div>
        <h4 class="text-lg md:text-xl font-bold mb-2 text-slate-300">JSON ফাইল ড্রপ করুন</h4>
        <p class="text-slate-400 text-sm mb-3 md:mb-4">বা ক্লিক করে সিলেক্ট করুন</p>
        <button onclick="document.getElementById('json-drop-input').click()" class="button-responsive bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold">
            ফাইল সিলেক্ট করুন
        </button>
        <p class="text-xs text-slate-500 mt-4">সমর্থিত ফরম্যাট: JSON</p>
    `;
    currentJsonData = null;
}

function showJsonTemplate() {
    const modal = document.getElementById('json-template-modal');
    if (modal) modal.classList.add('active');
}

function hideJsonTemplate() {
    const modal = document.getElementById('json-template-modal');
    if (modal) modal.classList.remove('active');
}

function showJsonPaste() {
    const modal = document.getElementById('json-paste-modal');
    if (modal) modal.classList.add('active');
}

function hideJsonPaste() {
    const modal = document.getElementById('json-paste-modal');
    if (modal) modal.classList.remove('active');
}

function processPastedJson() {
    const jsonText = document.getElementById('json-paste-area').value.trim();
    
    if(!jsonText) {
        showError("JSON টেক্সট পেস্ট করুন!");
        return;
    }
    
    try {
        const jsonData = JSON.parse(jsonText);
        currentJsonData = jsonData;
        
        // Auto-fill form if data has class/subject info
        if(jsonData.setInfo) {
            if(jsonData.setInfo.class) {
                const jsonClass = document.getElementById('json_class');
                if (jsonClass) jsonClass.value = jsonData.setInfo.class;
                updateJsonSubjectList();
            }
            if(jsonData.setInfo.subject) {
                const jsonSubject = document.getElementById('json_subject');
                if (jsonSubject) jsonSubject.value = jsonData.setInfo.subject;
            }
            if(jsonData.setInfo.chapter) {
                const jsonChapter = document.getElementById('json_chapter');
                if (jsonChapter) jsonChapter.value = jsonData.setInfo.chapter;
            }
            if(jsonData.setInfo.difficulty) {
                const jsonDifficulty = document.getElementById('json_difficulty');
                if (jsonDifficulty) jsonDifficulty.value = jsonData.setInfo.difficulty;
            }
        }
        
        showSuccess("JSON সফলভাবে পার্স হয়েছে!");
        hideJsonPaste();
        
    } catch(error) {
        showError("JSON পার্স করতে সমস্যা: " + error.message);
    }
}

function downloadJsonTemplate() {
    const template = {
        setInfo: {
            title: "পদার্থবিজ্ঞান ১ম অধ্যায় MCQ সেট",
            description: "বল সম্পর্কিত প্রশ্ন",
            class: "nine",
            subject: "physics",
            chapter: "বল",
            difficulty: "medium"
        },
        questions: [
            {
                id: 1,
                title: "নিউটনের প্রথম গতিসূত্র কোনটি?",
                description: "জড়তার সূত্র সম্পর্কিত প্রশ্ন",
                options: {
                    A: "বলের সমানুপাতিক",
                    B: "ভরবেগের সংরক্ষণ",
                    C: "জড়তা",
                    D: "ক্রিয়া-প্রতিক্রিয়া"
                },
                answer: "C",
                explanation: "নিউটনের প্রথম গতিসূত্র জড়তার সূত্র নামে পরিচিত",
                difficulty: "easy",
                marks: 1
            },
            {
                id: 2,
                title: "ভরবেগের সংরক্ষণ সূত্র কার?",
                description: "ভরবেগ সম্পর্কিত প্রশ্ন",
                options: {
                    A: "নিউটন",
                    B: "আইনস্টাইন",
                    C: "গ্যালিলিও",
                    D: "কেপলার"
                },
                answer: "A",
                explanation: "ভরবেগের সংরক্ষণ সূত্র নিউটনের",
                difficulty: "medium",
                marks: 1
            }
        ]
    };
    
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mcq_template.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

async function processJsonUpload() {
    if(!currentJsonData) {
        showError("প্রথমে JSON ফাইল লোড করুন!");
        return;
    }
    
    const classCode = document.getElementById('json_class').value;
    const subject = document.getElementById('json_subject').value;
    const chapter = document.getElementById('json_chapter').value;
    const difficulty = document.getElementById('json_difficulty').value;
    const folder = document.getElementById('json_folder').value;
    const createSet = document.getElementById('json_create_set').checked;
    
    if(!classCode || !subject || !folder) {
        showError("শ্রেণী, বিষয় এবং ফোল্ডার নির্বাচন করুন!");
        return;
    }
    
    // Show progress
    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressDetails = document.getElementById('progress-details');
    
    if (!progressDiv || !progressBar || !progressPercent || !progressDetails) return;
    
    progressDiv.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressDetails.textContent = 'প্রসেসিং শুরু...';
    
    let questions = [];
    
    // Extract questions from JSON data
    if(currentJsonData.questions && Array.isArray(currentJsonData.questions)) {
        questions = currentJsonData.questions;
    } else if(currentJsonData.singleMCQs && Array.isArray(currentJsonData.singleMCQs)) {
        questions = currentJsonData.singleMCQs;
    } else {
        showError("JSON-এ প্রশ্ন পাওয়া যায়নি!");
        progressDiv.classList.add('hidden');
        return;
    }
    
    if(questions.length === 0) {
        showError("JSON-এ কোন প্রশ্ন নেই!");
        progressDiv.classList.add('hidden');
        return;
    }
    
    if(createSet) {
        // Create as MCQ Set
        const setTitle = currentJsonData.setInfo?.title || `${subject} MCQ সেট`;
        const setDescription = currentJsonData.setInfo?.description || `${chapter} সম্পর্কিত প্রশ্ন`;
        
        const setData = {
            title: setTitle,
            type: 'mcq_set',
            description: setDescription,
            class: classCode,
            subject: subject,
            chapter: chapter || currentJsonData.setInfo?.chapter || 'সাধারণ',
            difficulty: difficulty,
            questionCount: questions.length,
            time: Date.now(),
            published: true,
            createdBy: 'JSON Upload'
        };
        
        const setId = `JSON_${Date.now()}`;
        const setPath = `${folder}/${setId}`;
        
        try {
            // Save set metadata
            await db.ref(setPath).set(setData);
            
            // Save each question
            let successCount = 0;
            for(let i = 0; i < questions.length; i++) {
                const q = questions[i];
                
                const questionData = {
                    title: q.title,
                    type: 'mcq',
                    description: q.description || null,
                    class: q.class || classCode,
                    subject: q.subject || subject,
                    chapter: q.chapter || chapter || 'সাধারণ',
                    difficulty: q.difficulty || difficulty,
                    options: q.options,
                    answer: q.answer || 'A',
                    explanation: q.explanation || null,
                    time: Date.now()
                };
                
                await db.ref(setPath).child(`q${i + 1}`).set(questionData);
                successCount++;
                
                // Update progress
                const progress = ((i + 1) / questions.length) * 100;
                progressBar.style.width = `${progress}%`;
                progressPercent.textContent = `${Math.round(progress)}%`;
                progressDetails.textContent = `প্রশ্ন ${i + 1}/${questions.length} সংরক্ষণ করা হচ্ছে...`;
            }
            
            // Complete
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
            progressDetails.innerHTML = `<span class="text-green-400">✅ ${successCount} টি প্রশ্ন সফলভাবে সংরক্ষণ হয়েছে!</span>`;
            
            setTimeout(() => {
                showSuccess(`MCQ সেট সফলভাবে তৈরি হয়েছে! ${successCount} টি প্রশ্ন যুক্ত হয়েছে।`);
                progressDiv.classList.add('hidden');
                resetDropZone();
                loadDashboardStats();
            }, 1000);
            
        } catch(error) {
            showError("ত্রুটি: " + error.message);
            progressDiv.classList.add('hidden');
        }
        
    } else {
        // Save as individual MCQs
        let successCount = 0;
        const totalQuestions = questions.length;
        
        for(let i = 0; i < totalQuestions; i++) {
            const q = questions[i];
            
            const questionData = {
                title: q.title,
                type: 'mcq',
                description: q.description || null,
                class: q.class || classCode,
                subject: q.subject || subject,
                chapter: q.chapter || chapter || 'সাধারণ',
                difficulty: q.difficulty || difficulty,
                options: q.options,
                answer: q.answer || 'A',
                explanation: q.explanation || null,
                time: Date.now(),
                uploadedBy: 'JSON Upload'
            };
            
            try {
                await db.ref(folder).push(questionData);
                successCount++;
            } catch(error) {
                console.error("Error saving question:", error);
            }
            
            // Update progress
            const progress = ((i + 1) / totalQuestions) * 100;
            progressBar.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;
            progressDetails.textContent = `প্রশ্ন ${i + 1}/${totalQuestions} সংরক্ষণ করা হচ্ছে...`;
        }
        
        // Complete
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        progressDetails.innerHTML = `<span class="text-green-400">✅ ${successCount} টি MCQ সফলভাবে সংরক্ষণ হয়েছে!</span>`;
        
        setTimeout(() => {
            showSuccess(`${successCount} টি MCQ প্রশ্ন সফলভাবে আপলোড হয়েছে!`);
            progressDiv.classList.add('hidden');
            resetDropZone();
            loadDashboardStats();
        }, 1000);
    }
}

// ============ MAGIC SCANNER FUNCTIONS ============
async function startScanning() {
    const scannerStatus = document.getElementById('scanner-status');
    const scannerText = document.getElementById('scanner_text').value.trim();
    const scannerImage = document.getElementById('scanner_image').files[0];
    
    if (!scannerStatus) return;
    
    if (!scannerText && !scannerImage) {
        showError("টেক্সট পেস্ট করুন অথবা ছবি আপলোড করুন!");
        return;
    }
    
    scannerStatus.textContent = "স্ক্যান শুরু হচ্ছে...";
    scannerStatus.style.color = "#fbbf24";
    
    // Disable scan button during processing
    const scanBtn = document.querySelector('#magic-sec button[onclick="startScanning()"]');
    if (scanBtn) scanBtn.disabled = true;
    
    try {
        if (scannerImage) {
            // Image scanning logic
            await processImageScan(scannerImage);
        } else {
            // Text scanning logic
            await processTextScan(scannerText);
        }
        
        scannerStatus.textContent = "✅ স্ক্যান সম্পূর্ণ হয়েছে!";
        scannerStatus.style.color = "#10b981";
        
    } catch (error) {
        console.error("Scanning error:", error);
        scannerStatus.textContent = "❌ স্ক্যান ব্যর্থ হয়েছে: " + error.message;
        scannerStatus.style.color = "#ef4444";
        
        // Fallback to mock data
        loadMockScannedData();
    } finally {
        // Re-enable scan button
        if (scanBtn) scanBtn.disabled = false;
    }
}

async function processImageScan(imageFile) {
    // This is a mock implementation - in real app, use OCR API
    const scannerStatus = document.getElementById('scanner-status');
    if (scannerStatus) scannerStatus.textContent = "ছবি প্রসেসিং করা হচ্ছে...";
    
    // Simulate image processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo purposes, create mock questions
    scannedSet = {
        title: "ছবি থেকে স্ক্যান করা MCQ সেট",
        chapter: document.getElementById('scanner_chapter')?.value || "ছবি থেকে স্ক্যান",
        questions: createMockQuestions()
    };
    
    showScannedResults();
}

async function processTextScan(text) {
    console.log("Processing text scan:", text.substring(0, 100) + "...");
    
    // Mock AI processing (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Parse questions from text
    const questions = parseQuestionsFromText(text);
    
    if (questions.length === 0) {
        throw new Error("কোন MCQ প্রশ্ন পাওয়া যায়নি!");
    }
    
    scannedSet = {
        title: "স্ক্যান করা MCQ সেট",
        chapter: document.getElementById('scanner_chapter')?.value || "স্ক্যান করা অধ্যায়",
        questions: questions
    };
    
    showScannedResults();
}

function parseQuestionsFromText(text) {
    const questions = [];
    const lines = text.split('\n');
    let currentQuestion = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect question
        if (line.match(/^\d+[\.\)]\s*/) || line.includes('?')) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            
            currentQuestion = {
                title: line.replace(/^\d+[\.\)]\s*/, ''),
                options: { A: '', B: '', C: '', D: '' },
                answer: 'A',
                explanation: ''
            };
        }
        // Detect options
        else if (line.match(/^[ক-ঘabcd]\)/i) && currentQuestion) {
            const optionMatch = line.match(/^([ক-ঘabcd])\)\s*(.+)/i);
            if (optionMatch) {
                const optionKey = optionMatch[1].toUpperCase();
                const optionValue = optionMatch[2];
                
                // Convert Bengali options to English
                const optionMap = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' };
                const engKey = optionMap[optionKey] || optionKey;
                
                if (['A', 'B', 'C', 'D'].includes(engKey)) {
                    currentQuestion.options[engKey] = optionValue;
                }
            }
        }
        // Detect answer
        else if (line.toLowerCase().includes('answer:') || line.includes('উত্তর:')) {
            if (currentQuestion) {
                const answerMatch = line.match(/(?:answer|উত্তর)[:\s]*([ক-ঘabcd])/i);
                if (answerMatch) {
                    const answer = answerMatch[1].toUpperCase();
                    const answerMap = { 'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D' };
                    currentQuestion.answer = answerMap[answer] || answer;
                }
            }
        }
        // Explanation
        else if (currentQuestion && line && !currentQuestion.explanation) {
            currentQuestion.explanation = line;
        }
    }
    
    // Add last question
    if (currentQuestion) {
        questions.push(currentQuestion);
    }
    
    // If no questions parsed, create mock questions
    if (questions.length === 0) {
        return createMockQuestions();
    }
    
    return questions;
}

function createMockQuestions() {
    const questions = [];
    for (let i = 1; i <= 10; i++) {
        questions.push({
            title: `স্ক্যান করা প্রশ্ন ${i}`,
            options: {
                A: `প্রথম অপশন ${i}`,
                B: `দ্বিতীয় অপশন ${i}`,
                C: `তৃতীয় অপশন ${i}`,
                D: `চতুর্থ অপশন ${i}`
            },
            answer: i % 4 === 0 ? 'D' : i % 3 === 0 ? 'C' : i % 2 === 0 ? 'B' : 'A',
            explanation: `প্রশ্ন ${i} এর ব্যাখ্যা`
        });
    }
    return questions;
}

function loadMockScannedData() {
    scannedSet = {
        title: "স্ক্যান করা MCQ সেট",
        questions: createMockQuestions()
    };
    
    showScannedResults();
}

function showScannedResults() {
    const resultsDiv = document.getElementById('scanner-results');
    const questionsDiv = document.getElementById('scanned-questions');
    
    if (!resultsDiv || !questionsDiv) {
        console.error("Scanner results elements not found!");
        return;
    }
    
    resultsDiv.classList.remove('hidden');
    questionsDiv.innerHTML = '';
    
    // Auto-fill form fields
    const scanTitle = document.getElementById('scan_title');
    const scanChapter = document.getElementById('scan_chapter');
    
    if (scanTitle) scanTitle.value = scannedSet.title || '';
    if (scanChapter) scanChapter.value = scannedSet.chapter || '';
    
    // Display questions
    scannedSet.questions.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = "p-3 md:p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-3";
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded">প্রশ্ন ${index + 1}</span>
                <span class="text-xs text-slate-500">উত্তর: ${q.answer}</span>
            </div>
            <p class="text-xs md:text-sm mb-2">${q.title}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 text-xs">
                <div class="text-slate-400"><span class="text-blue-400">ক)</span> ${q.options.A || ''}</div>
                <div class="text-slate-400"><span class="text-blue-400">খ)</span> ${q.options.B || ''}</div>
                <div class="text-slate-400"><span class="text-blue-400">গ)</span> ${q.options.C || ''}</div>
                <div class="text-slate-400"><span class="text-blue-400">ঘ)</span> ${q.options.D || ''}</div>
            </div>
            ${q.explanation ? `<div class="mt-2 text-xs text-slate-500">ব্যাখ্যা: ${q.explanation}</div>` : ''}
        `;
        questionsDiv.appendChild(div);
    });
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

async function saveScannedSet() {
    if (!scannedSet || !scannedSet.questions || scannedSet.questions.length === 0) {
        showError("প্রথমে স্ক্যান করুন!");
        return;
    }

    const title = document.getElementById('scan_title').value.trim() || scannedSet.title;
    const chapter = document.getElementById('scan_chapter').value.trim() || scannedSet.chapter;
    const difficulty = document.getElementById('scan_difficulty').value;
    const folder = document.getElementById('scan_folder').value;
    const classVal = document.getElementById('scanner_class').value;
    const subject = document.getElementById('scanner_subject').value;

    if (!title || !folder) {
        showError("সেটের নাম এবং ফোল্ডার নির্বাচন করুন!");
        return;
    }

    const setData = {
        title: title,
        type: 'mcq_set',
        description: `স্ক্যান করা সেট - ${new Date().toLocaleDateString('bn-BD')}`,
        class: classVal || 'general',
        subject: subject || 'general',
        chapter: chapter || 'সাধারণ',
        difficulty: difficulty,
        questionCount: scannedSet.questions.length,
        time: Date.now(),
        published: true,
        createdBy: 'Magic Scanner',
        source: 'scanned'
    };

    const setId = `SCAN_${Date.now()}`;
    const setPath = `${folder}/${setId}`;

    try {
        // Save set metadata
        await db.ref(setPath).set(setData);

        // Save each question
        for (let i = 0; i < scannedSet.questions.length; i++) {
            const q = scannedSet.questions[i];
            
            const questionData = {
                title: q.title,
                type: 'mcq',
                description: q.description || null,
                class: classVal || 'general',
                subject: subject || 'general',
                chapter: chapter || 'সাধারণ',
                difficulty: q.difficulty || difficulty,
                options: q.options,
                answer: q.answer || 'A',
                explanation: q.explanation || null,
                time: Date.now(),
                isScanned: true
            };

            await db.ref(setPath).child(`q${i + 1}`).set(questionData);
        }

        showSuccess(`স্ক্যান করা সেট সফলভাবে সংরক্ষণ হয়েছে! ${scannedSet.questions.length} টি প্রশ্ন যুক্ত হয়েছে।`);
        
        // Reset scanner
        const scannerText = document.getElementById('scanner_text');
        const scannerImage = document.getElementById('scanner_image');
        if (scannerText) scannerText.value = '';
        if (scannerImage) scannerImage.value = '';
        
        const scannerResults = document.getElementById('scanner-results');
        if (scannerResults) scannerResults.classList.add('hidden');
        
        scannedSet = null;
        
        // Update dashboard
        loadDashboardStats();
        loadRecentSets();

    } catch (error) {
        showError("ত্রুটি: " + error.message);
    }
}

// ============ SETTINGS FUNCTIONS ============
function loadSettings() {
    console.log("Loading settings...");
    
    // Load settings from Firebase or localStorage
    const savedSettings = localStorage.getItem('adminSettings');
    
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            applySettings(settings);
        } catch (error) {
            console.error("Error parsing settings:", error);
        }
    }
    
    // Load Firebase configuration status
    checkFirebaseStatus();
}

function applySettings(settings) {
    // Apply theme if exists
    if (settings.theme) {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(settings.theme + '-mode');
    }
    
    // Apply language if exists
    if (settings.language) {
        // You can implement language switching here
    }
    
    // Apply other settings
    const systemVersion = document.querySelector('#settings-sec input[value]');
    if (systemVersion && settings.version) {
        systemVersion.value = settings.version;
    }
}

function saveSettings() {
    const settings = {
        theme: 'dark', // default
        language: 'bn',
        version: '5.0',
        developerMode: document.querySelector('#settings-sec select')?.value || 'on',
        appName: document.querySelector('#settings-sec input[placeholder="অ্যাপের নাম"]')?.value || 'Dhumketu AI',
        description: document.querySelector('#settings-sec textarea')?.value || 'Complete MCQ Management System',
        saveTime: Date.now()
    };
    
    // Save to localStorage
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    
    // Also save to Firebase if needed
    db.ref('settings/admin').set(settings)
        .then(() => {
            showSuccess("সেটিংস সফলভাবে সংরক্ষণ হয়েছে!");
        })
        .catch(error => {
            console.error("Error saving settings:", error);
            showError("সেটিংস সংরক্ষণে ত্রুটি (লোকাল স্টোরেজে সংরক্ষিত)");
        });
}

function resetSystem() {
    if (!confirm("সিস্টেম রিসেট করতে চান? এটি শুধুমাত্র লোকাল ডাটা মুছে ফেলবে।")) {
        return;
    }
    
    // Clear local storage
    localStorage.removeItem('adminSettings');
    
    // Reset forms
    resetAllForms();
    
    // Reset global variables
    mcqQuestions = [];
    questionCounter = 0;
    currentJsonData = null;
    scannedSet = null;
    
    // Reload default settings
    loadSettings();
    
    showSuccess("সিস্টেম রিসেট করা হয়েছে!");
}

function resetAllForms() {
    // Reset all form fields
    const forms = document.querySelectorAll('input, textarea, select');
    forms.forEach(form => {
        if (form.type !== 'checkbox' && form.type !== 'radio') {
            form.value = '';
        } else if (form.type === 'checkbox') {
            form.checked = false;
        }
    });
    
    // Reset MCQ set form
    const questionsContainer = document.getElementById('questions-container');
    if (questionsContainer) {
        questionsContainer.innerHTML = `
            <div class="text-center py-12 text-slate-500">
                <div class="text-4xl mb-4"><i class="fas fa-edit"></i></div>
                <p>প্রথম প্রশ্ন যোগ করুন</p>
                <p class="text-sm text-slate-600 mt-2">প্রতিটি সেটে ২৫-৩০ টি প্রশ্ন থাকা উচিত</p>
            </div>
        `;
    }
    
    document.getElementById('question-counter').textContent = '0';
    generateSetId();
}

function checkFirebaseStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'firebase-status';
    statusDiv.className = 'mt-4 p-3 rounded-xl';
    
    db.ref('.info/connected').on('value', snapshot => {
        if (snapshot.val() === true) {
            statusDiv.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span class="text-green-400">Firebase Connected</span>
                </div>
            `;
            statusDiv.className = 'mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-xl';
        } else {
            statusDiv.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span class="text-red-400">Firebase Disconnected</span>
                </div>
            `;
            statusDiv.className = 'mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl';
        }
    });
    
    // Add to settings section
    const settingsSection = document.getElementById('settings-sec');
    if (settingsSection) {
        const existingStatus = settingsSection.querySelector('#firebase-status');
        if (existingStatus) existingStatus.remove();
        settingsSection.querySelector('.bg-gradient-to-br').appendChild(statusDiv);
    }
}

// ============ UTILITY FUNCTIONS ============
function loadFolders() {
    const folderSelects = [
        document.getElementById('set_folder'),
        document.getElementById('single_folder'),
        document.getElementById('json_folder'),
        document.getElementById('scan_folder')
    ];
    
    folderSelects.forEach(sel => {
        if(sel) sel.innerHTML = '<option value="">-- ফোল্ডার নির্বাচন করুন --</option>';
    });
    
    db.ref('qbank').once('value', snapshot => {
        const data = snapshot.val();
        
        if(data) {
            Object.keys(data).forEach(folder => {
                if(folder !== '_init') {
                    const path = `qbank/${folder}`;
                    folderSelects.forEach(sel => {
                        if(sel) {
                            sel.innerHTML += `<option value="${path}">📂 ${folder}</option>`;
                        }
                    });
                }
            });
        }
        
        // Add option to create new folder
        folderSelects.forEach(sel => {
            if(sel) {
                sel.innerHTML += `<option value="new">➕ নতুন ফোল্ডার তৈরি করুন</option>`;
            }
        });
    });
}

