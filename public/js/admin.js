import { db } from './firebase.js';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const adminContent = document.getElementById('adminContent');
const messageCard = document.getElementById('messageCard');

// Show message in card
function showMessage(msg, type = "success") {
    messageCard.textContent = msg;
    messageCard.className = "message-card"; // reset
    messageCard.classList.add(type === "success" ? "message-success" : "message-error");
    messageCard.style.display = "block";
    setTimeout(() => {
        messageCard.style.display = "none";
    }, 3000);
}

// Render the Add Item form inside adminContent
function renderAddForm() {
    adminContent.innerHTML = `
        <h3>Add New Item</h3>
        <input type="text" id="itemName" placeholder="Item Name" />
        <select id="itemType">
            <option value="">Select Type</option>
            <option value="catering">Catering</option>
            <option value="stationery">Stationery</option>
        </select>
        <button id="addItemBtn">Add Item</button>
        <hr/>
        <div id="itemsList"></div>
    `;

    document.getElementById('addItemBtn').addEventListener('click', addItem);
    viewItems(); // Load existing items
}

// Add new item
window.addItem = async () => {
    const name = document.getElementById('itemName').value.trim();
    const type = document.getElementById('itemType').value;

    if (name && type) {
        try {
            await addDoc(collection(db,'items'), { name, type });
            showMessage(`Item "${name}" added successfully!`, "success");
            document.getElementById('itemName').value = '';
            document.getElementById('itemType').value = '';
            viewItems(); // Refresh list
        } catch (error) {
            showMessage("Failed to add item. Check connection.", "error");
            console.error(error);
        }
    } else {
        showMessage("Name and Type are required!", "error");
    }
};

// Display all items with inline Edit/Save/Delete
window.viewItems = async () => {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = 'Loading items...';

    try {
        const snapshot = await getDocs(collection(db,'items'));
        itemsList.innerHTML = '';

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            const div = document.createElement('div');
            div.style.border = '1px solid #ccc';
            div.style.borderRadius = '8px';
            div.style.padding = '10px';
            div.style.margin = '10px 0';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';

            const leftSpan = document.createElement('span');
            const nameText = document.createElement('span');
            nameText.textContent = data.name;
            nameText.id = `text-name-${docSnap.id}`;
            const typeText = document.createElement('span');
            typeText.textContent = ` (${data.type})`;
            typeText.id = `text-type-${docSnap.id}`;
            leftSpan.appendChild(nameText);
            leftSpan.appendChild(typeText);

            // Inputs (hidden by default)
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = data.name;
            nameInput.style.display = 'none';
            nameInput.id = `input-name-${docSnap.id}`;

            const typeInput = document.createElement('select');
            typeInput.style.display = 'none';
            typeInput.id = `input-type-${docSnap.id}`;
            typeInput.innerHTML = `
                <option value="catering">Catering</option>
                <option value="stationery">Stationery</option>
            `;
            typeInput.value = data.type;

            leftSpan.appendChild(nameInput);
            leftSpan.appendChild(typeInput);

            const rightSpan = document.createElement('span');
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.style.display = 'none';
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';

            rightSpan.appendChild(editBtn);
            rightSpan.appendChild(saveBtn);
            rightSpan.appendChild(deleteBtn);

            div.appendChild(leftSpan);
            div.appendChild(rightSpan);
            itemsList.appendChild(div);

            // Event listeners
            editBtn.addEventListener('click', () => {
                nameText.style.display = 'none';
                typeText.style.display = 'none';
                nameInput.style.display = 'inline-block';
                typeInput.style.display = 'inline-block';
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
            });

            saveBtn.addEventListener('click', async () => {
                const newName = nameInput.value.trim();
                const newType = typeInput.value;
                if (!newName || !newType) {
                    showMessage("Name and Type cannot be empty!", "error");
                    return;
                }
                try {
                    await updateDoc(doc(db,'items',docSnap.id), { name: newName, type: newType });
                    showMessage(`Item "${newName}" updated successfully!`, "success");
                    nameText.textContent = newName;
                    typeText.textContent = ` (${newType})`;
                    nameText.style.display = 'inline';
                    typeText.style.display = 'inline';
                    nameInput.style.display = 'none';
                    typeInput.style.display = 'none';
                    editBtn.style.display = 'inline-block';
                    saveBtn.style.display = 'none';
                } catch (error) {
                    showMessage("Failed to update item. Check connection.", "error");
                    console.error(error);
                }
            });

            deleteBtn.addEventListener('click', () => deleteItem(docSnap.id));
        });

        if (snapshot.empty) {
            itemsList.textContent = 'No items added yet.';
        }

    } catch (error) {
        itemsList.innerHTML = '';
        showMessage("Failed to load items. Check connection.", "error");
        console.error(error);
    }
};

// Delete item
window.deleteItem = async (id) => {
    try {
        await deleteDoc(doc(db,'items',id));
        showMessage("Item deleted successfully!", "success");
        viewItems(); // refresh list
    } catch (error) {
        showMessage("Failed to delete item. Check connection.", "error");
        console.error(error);
    }
};

// Initial render
renderAddForm();
