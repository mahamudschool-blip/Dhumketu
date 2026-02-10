// ১. কনফিগারেশন (আপনার adm.js থেকে সংগৃহীত)
const firebaseConfig = { 
    apiKey: "AIzaSyBrmy4wHPsvObbdl6ZEVOOJ1JvLK1xs-hw", 
    databaseURL: "https://dhumketu2-fa6f0-default-rtdb.firebaseio.com", 
    projectId: "dhumketu2-fa6f0" 
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ২. Quill Editor ইনিশিয়ালাইজেশন (Formatting Options সহ)
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],        // Bold, Italic, Underline
            [{ 'color': [] }, { 'background': [] }],          // Text Color & Background
            [{ 'script': 'sub'}, { 'script': 'super' }],      // Subscript / Superscript
            [{ 'align': [] }],                                // Text Align
            ['link', 'image', 'blockquote', 'code-block'],
            ['clean']                                         // Remove formatting
        ]
    }
});

// ৩. পোস্ট সেভ করার ফাংশন
async function savePost() {
    const title = document.getElementById('postTitle').value;
    const path = document.getElementById('postPath').value || 'contents';
    const imageUrl = document.getElementById('postImgUrl').value;
    const bodyHTML = quill.root.innerHTML; // এডিটরের HTML কন্টেন্ট

    if(!title || bodyHTML === '<p><br></p>') {
        return alert("শিরোনাম এবং কন্টেন্ট অবশ্যই দিতে হবে!");
    }

    const postData = {
        title: title,
        body: bodyHTML, // এখানে ফরম্যাট করা টেক্সট HTML হিসেবে যাবে
        imageUrl: imageUrl,
        type: 'post',
        timestamp: Date.now(),
        author: "Admin"
    };

    try {
        await db.ref(path).push(postData);
        alert("পোস্ট সফলভাবে পাবলিশ হয়েছে! 🚀");
        window.location.href = 'admin.html';
    } catch (error) {
        alert("Error: " + error.message);
    }
}


