import { db } from './firebase.js';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

const content = document.getElementById('content');
const auth = getAuth();
// Get current user UID from localStorage
const currentUserUID = localStorage.getItem("uid");
if(!currentUserUID){
    alert("User not logged in!");
    window.location.href = "index.html";
}

async function getCurrentUserName(uid, role) {
    const docRef = doc(db, role + 's', uid);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
        return docSnap.data().name;
    }
    return "Unknown";
}

// Create toast container
let toastContainer = document.getElementById('toastContainer');
if(!toastContainer){
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
}

// Toast message
function showToast(msg, type='success') {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.minWidth = '200px';
    toast.style.marginTop = '10px';
    toast.style.padding = '10px';
    toast.style.borderRadius = '5px';
    toast.style.color = '#1c0547ff';
    toast.style.fontWeight = 'bold';
    toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    toast.style.opacity = '0.9';
    toast.style.transition = '0.5s';
    toast.style.backgroundColor = type === 'success' ? 'green' : 'red';
    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ============ Catering ===================
window.showCatering = async function() {
    content.innerHTML = `
<div style="
            width:90vw; 
            height:70vh; 
            margin:0 auto; 
            display:flex; 
            border:1px solid #ffffffff;
            border-radius:10px;
            overflow:hidden;
        ">
            <!-- Left: Place Order -->
            <div style="
                flex:1; 
                padding:20px; 
                background:#fff;
                display:flex;
                flex-direction:column;
                justify-content:flex-start;
            ">
                <h2 style="text-align:left;">Catering Items</h2>
                <select id="cateringItem" style="margin-bottom:10px; width:100%;"></select>
                <input type="text" id="cateringCustomItem" placeholder="Or type a custom item" style="margin-bottom:10px; width:100%;">
                <input type="number" id="cateringQty" placeholder="Quantity" style="margin-bottom:10px; width:100%;">
                <button id="placeCateringOrder" style="width:100%;">Place Order</button>
            </div>

            <!-- Vertical line -->
            <div style="width:2px; background:#002147;"></div>

            <!-- Right: Previous Orders -->
            <div style="
                flex:1; 
                padding:20px; 
                background:#fff;
                display:flex;
                flex-direction:column;
                overflow-y:auto;
            ">
                <h3 style="text-align:left;">Previous Catering Orders</h3>
                <div id="cateringOrdersList" style="flex:1; overflow-y:auto;">Loading...</div>
            </div>
        </div>
    `;

    const select = document.getElementById('cateringItem');

// Add default option
const defaultOption = document.createElement('option');
defaultOption.value = '';
defaultOption.textContent = 'Select an item';
defaultOption.selected = true;
defaultOption.disabled = true;
select.appendChild(defaultOption);

    const customInput = document.getElementById('cateringCustomItem');

    // Load catering items from DB
    try {
        const snapshot = await getDocs(collection(db,'items'));
        snapshot.docs
            .map(docSnap => docSnap.data())
            .filter(i => i.type === 'catering')
            .forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
    } catch(err){
        console.error(err);
        showToast("Failed to load admin-added catering items", 'error');
    }

    // Mutual exclusivity
    select.addEventListener('change', () => { if(select.value) customInput.value = ''; });
    customInput.addEventListener('input', () => { if(customInput.value.trim()) select.value = ''; });

    // Place order
    document.getElementById('placeCateringOrder').addEventListener('click', async () => {
        let item = customInput.value.trim() || select.value;
        const qty = parseInt(document.getElementById('cateringQty').value);

        if(!item || isNaN(qty) || qty <= 0){
            showToast("Item & valid Quantity required", 'error');
            return;
        }

        const user = auth.currentUser;
        if(!user){ showToast("User not logged in!", 'error'); return; }

        const name = await getCurrentUserName(currentUserUID, localStorage.getItem("userRole"));

        try {
            await addDoc(collection(db, 'orders'), { 
                type: 'catering', item, quantity: qty, date: new Date().toLocaleString(),
                uid: currentUserUID, email: user.email || "Unknown", name
            });

            showToast(`Ordered ${qty} x ${item}`, 'success');

            // Clear inputs
            select.value = '';
            customInput.value = '';
            document.getElementById('cateringQty').value = '';

            // Add new custom item to dropdown if not exists
            if (![...select.options].some(opt => opt.value === item)) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                select.appendChild(option);
            }

            loadOrders('catering', 'cateringOrdersList');

        } catch (error) {
            console.error(error); 
            showToast("Failed to place order", 'error'); 
        }
    });

    loadOrders('catering', 'cateringOrdersList');
};



window.orderCatering = async function() {
    const item = document.getElementById('cateringItem').value.trim();
    const qty = document.getElementById('cateringQty').value.trim();
    const name = await getCurrentUserName(currentUserUID, localStorage.getItem("userRole"));
    if(!item || !qty){ showToast("Item & Quantity required", 'error'); return; }
    const user = auth.currentUser;
    if(!user){ showToast("User not logged in!", 'error'); return; }
    try {
        await addDoc(collection(db, 'orders'), { 
            type: 'catering', 
            item, 
            quantity: qty, 
            date: new Date().toLocaleString(),
            uid: currentUserUID,
            email: user.email || "Unknown",
            name
        });
        showToast(`Ordered ${qty} ${item}`, 'success');
        document.getElementById('cateringItem').value = '';
        document.getElementById('cateringQty').value = '';
        loadOrders('catering', 'cateringOrdersList');
    } catch (error) { console.error(error); showToast("Failed to place order", 'error'); }
};

// ============ Stationery ===================
window.showStationery = async function() {
    content.innerHTML = `
        <div style="
            width:90vw; 
            height:70vh; 
            margin:0 auto; 
            display:flex; 
            background:#fff;
            border:1px solid #fefefeff;
            border-radius:10px;
            overflow:hidden;
        ">
            <!-- Left: Place Order -->
            <div style="
                flex:1; 
                padding:20px; 
                display:flex;
                flex-direction:column;
                justify-content:flex-start;
                background:#fff;
            ">
                <h2 style="text-align:left;">Stationery Items</h2>
                <select id="stationeryItem" style="margin-bottom:10px; width:100%;"></select>
                <input type="text" id="stationeryCustomItem" placeholder="Or type a custom item" style="margin-bottom:10px; width:100%;">
                <input type="number" id="stationeryQty" placeholder="Quantity" style="margin-bottom:10px; width:100%;">
                <button id="placeStationeryOrder" style="width:100%;">Place Order</button>
            </div>

            <!-- Vertical line -->
            <div style="width:2px; background:#002147;"></div>

            <!-- Right: Previous Orders -->
            <div style="
                flex:1; 
                padding:20px; 
                display:flex;
                flex-direction:column;
                overflow-y:auto;
                background:#fff;
            ">
                <h3 style="text-align:left;">Previous Stationery Orders</h3>
                <div id="stationeryOrdersList" style="flex:1; overflow-y:auto;">Loading...</div>
            </div>
        </div>
    `;

    const select = document.getElementById('stationeryItem');

// Add default option
const defaultOption = document.createElement('option');
defaultOption.value = '';
defaultOption.textContent = 'Select an item';
defaultOption.selected = true;
defaultOption.disabled = true;
select.appendChild(defaultOption);

    const customInput = document.getElementById('stationeryCustomItem');

    // Load stationery items from DB
    try {
        const snapshot = await getDocs(collection(db,'items'));
        snapshot.docs
            .map(docSnap => docSnap.data())
            .filter(i => i.type === 'stationery')
            .forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
    } catch(err){
        console.error(err);
        showToast("Failed to load admin-added stationery items", 'error');
    }

    // Mutual exclusivity
    select.addEventListener('change', () => { if(select.value) customInput.value = ''; });
    customInput.addEventListener('input', () => { if(customInput.value.trim()) select.value = ''; });
    

    // Place order
    document.getElementById('placeStationeryOrder').addEventListener('click', async () => {
        let item = customInput.value.trim() || select.value;
        const qty = parseInt(document.getElementById('stationeryQty').value);

        if(!item || isNaN(qty) || qty <= 0){
            showToast("Item & valid Quantity required", 'error');
            return;
        }

        const user = auth.currentUser;
        if(!user){ showToast("User not logged in!", 'error'); return; }

        const name = await getCurrentUserName(currentUserUID, localStorage.getItem("userRole"));

        try {
            await addDoc(collection(db, 'orders'), { 
                type: 'stationery', item, quantity: qty, date: new Date().toLocaleString(),
                uid: currentUserUID, email: user.email || "Unknown", name
            });

            showToast(`Ordered ${qty} x ${item}`, 'success');

            // Clear inputs
            select.value = '';
            customInput.value = '';
            document.getElementById('stationeryQty').value = '';

            // Add new custom item to dropdown if not exists
            if (![...select.options].some(opt => opt.value === item)) {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                select.appendChild(option);
            }

            loadOrders('stationery', 'stationeryOrdersList');

        } catch (error) {
            console.error(error); 
            showToast("Failed to place order", 'error'); 
        }
    });

    loadOrders('stationery', 'stationeryOrdersList');
};


window.orderStationery = async function() {
    const item = document.getElementById('stationeryItem').value.trim();
    const qty = document.getElementById('stationeryQty').value.trim();
    const name = await getCurrentUserName(currentUserUID, localStorage.getItem("userRole"));
    if(!item || !qty){ showToast("Item & Quantity required", 'error'); return; }
    const user = auth.currentUser;
    if(!user){ showToast("User not logged in!", 'error'); return; }
    try {
        await addDoc(collection(db, 'orders'), { 
            type: 'stationery', 
            item, 
            quantity: qty, 
            date: new Date().toLocaleString(),
            uid: currentUserUID,
            email: user.email || "Unknown",
            name
        });
        showToast(`Ordered ${qty} ${item}`, 'success');
        document.getElementById('stationeryItem').value = '';
        document.getElementById('stationeryQty').value = '';
        loadOrders('stationery', 'stationeryOrdersList');
    } catch (error) { console.error(error); showToast("Failed to place order", 'error'); }
};

// ============ Booking ===================
window.showBooking = function() {
    content.innerHTML = `
         <div style="
            width:90vw; 
            height:70vh; 
            margin:0 auto; 
            display:flex; 
            background:#fff;
            border:1px solid #ffffffff;
            border-radius:10px;
            overflow:hidden;
        ">
            <!-- Left: Book Service -->
            <div style="
                flex:1; 
                padding:20px; 
                display:flex;
                flex-direction:column;
                justify-content:flex-start;
                background:#fff;
            ">
                <h2 style="text-align:left;">Book Services</h2>
                <select id="serviceType" style="margin-bottom:10px; width:100%;">
                    <option value="" selected disabled>Select a service</option>
                    <option value="resort">Resort</option>
                    <option value="movie">Movie</option>
                    <option value="beauty">Beauty Salon</option>
                    <option value="fitness">Fitness Center</option>
                    <option value="party">Party Hall</option>
                </select>
                <button id="bookServiceBtn" style="width:100%;">Book</button>
            </div>

            <!-- Vertical line -->
            <div style="width:2px; background:#002147;"></div>

            <!-- Right: Previous Bookings -->
            <div style="
                flex:1; 
                padding:20px; 
                display:flex;
                flex-direction:column;
                overflow-y:auto;
                background:#fff;
            ">
                <h3 style="text-align:left;">Previous Bookings</h3>
                <div id="bookingList" style="flex:1; overflow-y:auto;">Loading...</div>
            </div>
        </div>
    `;
    document.getElementById('bookServiceBtn').addEventListener('click', bookService);
    loadOrders('booking', 'bookingList');
};

window.bookService = async function() {
    const service = document.getElementById('serviceType').value;
    const user = auth.currentUser;
    const name = await getCurrentUserName(currentUserUID, localStorage.getItem("userRole"));
    if(!user){ showToast("User not logged in!", 'error'); return; }
    try {
        await addDoc(collection(db, 'bookings'), { 
            service, 
            date: new Date().toLocaleString(),
            uid: currentUserUID,
            email: user.email || "Unknown",
            name
        });
        showToast(`${service} booked!`, 'success');
        loadOrders('booking', 'bookingList');
    } catch (error) { console.error(error); showToast("Failed to book service", 'error'); }
};

// ============ Load Orders ===================
async function loadOrders(type, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = 'Loading...';

    try {
        let snapshot;
        if(type==='booking'){
            snapshot = await getDocs(collection(db,'bookings'));
        } else {
            snapshot = await getDocs(collection(db,'orders'));
        }

        container.innerHTML = '';
        let hasOrders = false;

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Only show orders/bookings of the current user
            if(data.uid !== currentUserUID) return;

            if(type==='booking' || data.type === type){
                hasOrders = true;
                const div = document.createElement('div');
                div.style.border = '1px solid #ccc';
                div.style.borderRadius = '6px';
                div.style.padding = '8px';
                div.style.margin = '5px 0';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';

                const leftSpan = document.createElement('span');
                const textSpan = document.createElement('span');

                if(type==='booking'){
                    textSpan.textContent = `${data.service} | ${data.date}`;
                } else {
                    textSpan.textContent = `${data.quantity} x ${data.item} | ${data.date}`;
                }

                // Edit inputs for orders (not bookings)
                const inputItem = document.createElement('input');
                const inputQty = document.createElement('input');
                if(type!=='booking'){
                    inputItem.value = data.item;
                    inputQty.value = data.quantity;
                    inputItem.style.display = 'none';
                    inputQty.style.display = 'none';
                    inputItem.style.width = '120px';
                    inputQty.style.width = '60px';
                    leftSpan.appendChild(inputItem);
                    leftSpan.appendChild(inputQty);
                }

                leftSpan.appendChild(textSpan);

                const rightSpan = document.createElement('span');
                const editBtn = document.createElement('button');
                const saveBtn = document.createElement('button');
                const cancelBtn = document.createElement('button');
                const deleteBtn = document.createElement('button');

                editBtn.textContent = 'Edit';
                saveBtn.textContent = 'Save';
                cancelBtn.textContent = 'Cancel';
                deleteBtn.textContent = 'Delete';

                saveBtn.style.display = 'none';
                cancelBtn.style.display = 'none';

                if(type==='booking'){
    rightSpan.appendChild(deleteBtn);
} else {
    rightSpan.appendChild(editBtn);
    rightSpan.appendChild(saveBtn);
    rightSpan.appendChild(cancelBtn);
    rightSpan.appendChild(deleteBtn);
}


                div.appendChild(leftSpan);
                div.appendChild(rightSpan);
                container.appendChild(div);

                // Edit / Save / Cancel for orders
                if(type!=='booking'){
                    editBtn.addEventListener('click', ()=>{
                        textSpan.style.display='none';
                        inputItem.style.display='inline-block';
                        inputQty.style.display='inline-block';
                        editBtn.style.display='none';
                        saveBtn.style.display='inline-block';
                        cancelBtn.style.display='inline-block';
                    });

                    saveBtn.addEventListener('click', async ()=>{
                        const newItem = inputItem.value.trim();
                        const newQty = inputQty.value.trim();
                        if(!newItem || !newQty){ showToast("Item & Quantity required", 'error'); return; }
                        try{
                            await updateDoc(doc(db,'orders',docSnap.id), { item: newItem, quantity: newQty });
                            showToast("Order updated!", 'success');
                            loadOrders(type, containerId);
                        }catch(err){ console.error(err); showToast("Failed to update", 'error'); }
                    });

                    cancelBtn.addEventListener('click', ()=>{
                        inputItem.style.display='none';
                        inputQty.style.display='none';
                        textSpan.style.display='inline';
                        editBtn.style.display='inline';
                        saveBtn.style.display='none';
                        cancelBtn.style.display='none';
                    });
                }

                // Delete
                deleteBtn.addEventListener('click', async ()=>{
                    try{
                        const col = type==='booking' ? 'bookings' : 'orders';
                        await deleteDoc(doc(db, col, docSnap.id));
                        showToast("Order deleted!", 'success');
                        loadOrders(type, containerId);
                    } catch(err){
                        console.error(err);
                        showToast("Failed to delete", 'error');
                    }
                });
            }
        });

        if(!hasOrders){
            const noDiv = document.createElement('div');
            noDiv.style.padding = '10px';
            noDiv.style.color = '#555';
            noDiv.textContent = type==='booking' ? "No bookings yet." : "No orders yet.";
            container.appendChild(noDiv);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '';
        showToast("Failed to load orders", 'error');
    }
}
