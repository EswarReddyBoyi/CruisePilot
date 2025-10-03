import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// Tabs
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Toast container
let toastContainer = document.getElementById('toastContainer');
if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
}

// Toast function
function showToast(msg, type='success', duration=3000) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = msg;

    toast.style.backgroundColor = type === 'success' ? 'green' :
                                 type === 'loading' ? 'white' : 'red';

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    if (type !== 'loading') {
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
        }, duration);

        setTimeout(() => toast.remove(), duration + 500);
    }

    return toast;
}

// Switch tabs
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
});

// Login
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailLogin').value;
    const password = document.getElementById('passwordLogin').value;
    const selectedRole = document.getElementById('roleLogin').value; // role user selected

    const loadingToast = showToast("Logging in...", 'loading', 0);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Check only in the selected role collection
        const userDoc = await getDoc(doc(db, selectedRole + 's', uid));

        loadingToast.remove();

        if (userDoc.exists()) {
            // ✅ Role matches
            showToast(`Logged in as ${selectedRole}`, 'success');
            localStorage.setItem("userRole", selectedRole);
            localStorage.setItem("uid", uid);
            window.location.href = `${selectedRole}-dashboard.html`;
        } else {
            // ❌ Role mismatch or user doesn't exist in that collection
            showToast(`User not found in ${selectedRole} role. Check your role selection.`, 'error');
        }

    } catch (error) {
        loadingToast.remove();
        showToast(error.message, 'error');
    }
});


// Signup
document.getElementById('signupBtn').addEventListener('click', async () => {
    const name=document.getElementById('nameSignup').value;
    const email = document.getElementById('emailSignup').value;
    const password = document.getElementById('passwordSignup').value;
    const role = document.getElementById('roleSignup').value; // selected role

    const loadingToast = showToast("Signing up...", 'loading', 0);

    try {
        // Create the user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ Save in the role-specific collection
        await setDoc(doc(db, role + 's', userCredential.user.uid), {
            name,
            email,
            role
        });

        loadingToast.remove();
        showToast("Signup Successful! You can now login.", 'success');
    } catch (error) {
        loadingToast.remove();
        showToast(error.message, 'error');
    }
});

// Forgot Password
document.getElementById('forgotPassword').addEventListener('click', async () => {
    const email = document.getElementById('emailLogin').value;
    if (!email) return showToast("Enter your email first", 'error');

    const loadingToast = showToast("Sending reset email...", 'loading', 0);
    try {
        await sendPasswordResetEmail(auth, email);
        loadingToast.remove();
        showToast("Password reset email sent!", 'success');
    } catch (error) {
        loadingToast.remove();
        showToast(error.message, 'error');
    }
});
