// ১. ফায়ারবেস ও কনফিগ
const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};
const IMGBB_API_KEY = "D77b90eef305e2ea4b7817bc5b1e527c";

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let quill;
let currentPath = '';
let allPosts = {};

// ২. এডিটর ইনিশিয়ালাইজেশন
document.addEventListener('DOMContentLoaded', () => {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['table'], // টেবিল বাটন (Quill এর ডিফল্ট টেবিল মডিউল)
                ['clean']
            ]
        }
    });
    fetchList();
});

// ৩. ডাটা লোড করা
function fetchList() {
    db.ref('contents').on('value', snapshot => {
        const data = snapshot.val();
        const container = document.getElementById('list-container');
        container.innerHTML = '';
        
        const scan = (obj, path) => {
            for(let key in obj) {
                if(obj[key] && obj[key].title) {
                    const id = key;
                    const fullPath = `${path}/${key}`;
                    allPosts[id] = { ...obj[key], path: fullPath };

                    const card = document.createElement('div');
                    card.className = "bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center active:scale-95 transition cursor-pointer";
                    card.innerHTML = `
                        <div class="truncate">
                            <h4 class="text-white text-sm font-bold truncate">${obj[key].title}</h4>
                            <span class="text-[9px] text-slate-500 uppercase font-black">${path.split('/').pop()}</span>
                        </div>
                        <button onclick="showEditor('${id}')" class="bg-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold text-white">EDIT</button>
                    `;
                    container.appendChild(card);
                } else if(typeof obj[key] === 'object') {
                    scan(obj[key], `${path}/${key}`);
                }
            }
        }
        scan(data, 'contents');
    });
}

// ৪. এডিটর দেখানো
function showEditor(id) {
    const post = allPosts[id];
    currentPath = post.path;

    document.getElementById('title-in').value = post.title || '';
    quill.root.innerHTML = post.body || '';
    document.getElementById('img-url').value = post.imageUrl || '';
    
    const prev = document.getElementById('preview');
    if(post.imageUrl) prev.innerHTML = `<img src="${post.imageUrl}" class="w-full h-full object-cover">`;
    else prev.innerHTML = 'No Image';

    document.getElementById('editor-page').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideEditor() {
    document.getElementById('editor-page').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ৫. ইমেজ আপলোড
async function uploadImg(input) {
    if(!input.files[0]) return;
    const prev = document.getElementById('preview');
    prev.innerHTML = '<span class="text-indigo-500 text-xs animate-pulse font-bold">UPLOADING...</span>';

    const fd = new FormData();
    fd.append("image", input.files[0]);

    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
        const json = await res.json();
        const url = json.data.url;
        document.getElementById('img-url').value = url;
        prev.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
    } catch(e) { prev.innerHTML = 'Error'; }
}

// ৬. সেভ এবং ডিলিট
async function saveData() {
    const title = document.getElementById('title-in').value;
    const body = quill.root.innerHTML;
    const img = document.getElementById('img-url').value;

    if(!title) return alert("শিরোনাম দিন!");

    try {
        await db.ref(currentPath).update({
            title: title,
            body: body,
            imageUrl: img,
            lastUpdated: Date.now()
        });
        alert("সংরক্ষিত হয়েছে! ✅");
        hideEditor();
    } catch(e) { alert(e.message); }
}

async function deletePost() {
    if(!confirm("আপনি কি নিশ্চিতভাবে এই পোস্টটি ডিলিট করতে চান?")) return;
    try {
        await db.ref(currentPath).remove();
        hideEditor();
    } catch(e) { alert(e.message); }
}

function search() {
    let q = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('#list-container > div').forEach(card => {
        let t = card.querySelector('h4').innerText.toLowerCase();
        card.style.display = t.includes(q) ? 'flex' : 'none';
    });
}
