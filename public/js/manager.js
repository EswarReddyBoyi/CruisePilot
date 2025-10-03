import { db } from './firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const managerContent = document.getElementById('managerContent');

// Function to view bookings by service
window.viewBookings = async (serviceType) => {
    // Show loading message
    managerContent.innerHTML = `<h3>${serviceType} Bookings:</h3><p>Loading bookings...</p>`;

    try {
        const q = query(collection(db, 'bookings'), where('service', '==', serviceType));
        const snapshot = await getDocs(q);

        // Clear previous content except heading
        managerContent.innerHTML = `<h3>${serviceType} Bookings:</h3>`;

        if (snapshot.empty) {
            const noBookings = document.createElement('p');
            noBookings.textContent = "No bookings found.";
            managerContent.appendChild(noBookings);
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();

            const div = document.createElement('div');
            div.style.border = '1px solid #ccc';
            div.style.padding = '10px';
            div.style.margin = '8px 0';
            div.style.borderRadius = '8px';
            div.style.backgroundColor = '#f7f9fc';
            div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

            // Display booking info including user
            div.innerHTML = `
                <p><strong>Service:</strong> ${data.service}</p>
                <p><strong>Date:</strong> ${data.date}</p>
                <p><strong>User:</strong> ${data.name || 'Unknown'} (${data.email || 'Unknown'})</p>
            `;

            managerContent.appendChild(div);
        });
    } catch (error) {
        managerContent.innerHTML = `<h3>${serviceType} Bookings:</h3><p>Failed to load bookings. Check connection.</p>`;
        console.error(error);
    }
};
