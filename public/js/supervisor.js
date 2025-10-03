import { db } from './firebase.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const supervisorContent = document.getElementById('supervisorContent');

window.viewStationeryOrders = async () => {
    supervisorContent.innerHTML = `<h3>Stationery Orders</h3><p>Loading orders...</p>`;

    try {
        const q = query(collection(db, 'orders'), where('type', '==', 'stationery'));
        const snapshot = await getDocs(q);

        supervisorContent.innerHTML = `<h3>Stationery Orders</h3>`;

        if (snapshot.empty) {
            const noOrders = document.createElement('p');
            noOrders.textContent = "No stationery orders found.";
            supervisorContent.appendChild(noOrders);
            return;
        }

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            // Default user info
            let userName = data.name || "Unknown";
            let userEmail = data.email || "Unknown";

            // Fetch name/email from user role collection if uid and role exist
            try {
                if (data.uid && data.role) {
                    const userDoc = await getDoc(doc(db, data.role + 's', data.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        userName = userData.name || userName;
                        userEmail = userData.email || userEmail;
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch user info:", err);
            }

            const div = document.createElement('div');
            div.style.border = '1px solid #ccc';
            div.style.borderRadius = '5px';
            div.style.padding = '8px';
            div.style.margin = '5px 0';
            div.innerHTML = `
                <strong>Item:</strong> ${data.item} <br>
                <strong>Quantity:</strong> ${data.quantity} <br>
                <strong>Date:</strong> ${data.date} <br>
                <strong>Name:</strong> ${userName} <br>
                <strong>Email:</strong> ${userEmail}
            `;
            supervisorContent.appendChild(div);
        }
    } catch (error) {
        supervisorContent.innerHTML = `<h3>Stationery Orders:</h3><p>Failed to load orders. Check connection.</p>`;
        console.error(error);
    }
};
