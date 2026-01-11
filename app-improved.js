// ============================================
// GROCERY CREDIT MANAGEMENT SYSTEM - CLEAN V1.0
// Balaji Kirana Store - Optimized & Organized
// ============================================

// ============================================
// GLOBAL STATE
// ============================================
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let storeInfo = JSON.parse(localStorage.getItem("storeInfo")) || {
    name: "Balaji Kirana",
    address: "Gandhi nagar akkalkot road solapur",
    phone: "+91-8975284112"
};
let currentTheme = localStorage.getItem("theme") || "light";
let currentCustomerIndex = null;
let currentItemMode = 'list'; // 'list' or 'manual'
let currentSortOrder = 'default'; // For item sorting

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Ensure customers have proper structure
    customers.forEach(customer => {
        if (!customer.credits) customer.credits = [];
        if (!customer.payments) customer.payments = [];
    });

    populatePredefinedItems();
    updateCustomerList();
    renderCustomers();
    updateDashboard();
    setCurrentDate();
    applyTheme(currentTheme);

    // Update date every minute
    setInterval(setCurrentDate, 60000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Date Management
function setCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-IN', options);
    }
}

// Theme Management
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    showToast(currentTheme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Storage Functions
function saveToStorage() {
    localStorage.setItem('customers', JSON.stringify(customers));
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Modal Management
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================
// NAVIGATION
// ============================================
function showSection(sectionName, event) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionName + 'Section');
    if (section) {
        section.classList.add('active');
    }

    // Add active class to clicked nav item
    if (event && event.target) {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    // Update content based on section
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'customers') {
        renderCustomers();
    } else if (sectionName === 'items') {
        renderItems();
    } else if (sectionName === 'transactions') {
        renderTransactions();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================
function updateDashboard() {
    const totalCustomers = customers.length;
    const totalCredit = customers.reduce((sum, c) => 
        sum + (c.credits || []).reduce((s, cr) => s + (cr.total || 0), 0), 0);
    const totalPaid = customers.reduce((sum, c) => 
        sum + (c.payments || []).reduce((s, p) => s + (p.amount || 0), 0), 0);
    const totalPending = totalCredit - totalPaid;

    const el1 = document.getElementById('totalCustomers');
    const el2 = document.getElementById('totalCredit');
    const el3 = document.getElementById('totalPaid');
    const el4 = document.getElementById('totalPending');

    if (el1) el1.textContent = totalCustomers;
    if (el2) el2.textContent = '₹' + totalCredit.toFixed(2);
    if (el3) el3.textContent = '₹' + totalPaid.toFixed(2);
    if (el4) el4.textContent = '₹' + totalPending.toFixed(2);

    renderTopCustomers();
    renderRecentActivity();
}

function renderTopCustomers() {
    const container = document.getElementById('topCustomersChart');
    if (!container) return;

    const customersWithBalance = customers.map((c, index) => {
        const credit = (c.credits || []).reduce((sum, cr) => sum + (cr.total || 0), 0);
        const paid = (c.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        return { name: c.name, balance: credit - paid, index };
    }).filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    if (customersWithBalance.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No customers with pending balance</p>';
        return;
    }

    const maxBalance = Math.max(...customersWithBalance.map(c => c.balance));

    container.innerHTML = customersWithBalance.map(c => `
        <div class="customer-bar" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 600;">${c.name}</span>
                <span style="font-weight: 700; color: var(--danger);">₹${c.balance.toFixed(2)}</span>
            </div>
            <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${(c.balance / maxBalance) * 100}%; background: linear-gradient(90deg, var(--danger), var(--warning)); border-radius: 4px;"></div>
            </div>
        </div>
    `).join('');
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const activities = [];

    customers.forEach((customer) => {
        (customer.credits || []).forEach(credit => {
            activities.push({
                type: 'credit',
                customer: customer.name,
                item: credit.item,
                amount: credit.total,
                date: credit.date || new Date()
            });
        });

        (customer.payments || []).forEach(payment => {
            activities.push({
                type: 'payment',
                customer: customer.name,
                amount: payment.amount,
                date: payment.date || new Date()
            });
        });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = activities.slice(0, 10);

    if (recent.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No recent activity</p>';
        return;
    }

    container.innerHTML = recent.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.type === 'credit' ? 'shopping-cart' : 'wallet'}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.customer}</h4>
                <p>${activity.type === 'credit' ? 'Purchased ' + activity.item : 'Made payment'}</p>
            </div>
            <div class="activity-amount ${activity.type}">
                ${activity.type === 'credit' ? '+' : '-'}₹${activity.amount.toFixed(2)}
            </div>
        </div>
    `).join('');
}

function refreshDashboard() {
    updateDashboard();
    showToast('Dashboard refreshed!');
}

// ============================================
// CUSTOMER MANAGEMENT
// ============================================
function openAddCustomerModal() {
    document.getElementById('addCustomerModal').classList.add('active');
}

function addCustomer() {
    const name = document.getElementById('newCustomerName').value.trim();
    const phone = document.getElementById('newCustomerPhone').value.trim();
    const address = document.getElementById('newCustomerAddress').value.trim();

    if (!name || !phone) {
        showToast('Please enter name and phone number', 'error');
        return;
    }

    customers.push({
        name,
        phone,
        address,
        credits: [],
        payments: [],
        createdAt: new Date().toISOString()
    });

    saveToStorage();
    updateCustomerList();
    renderCustomers();
    updateDashboard();
    closeModal('addCustomerModal');

    document.getElementById('newCustomerName').value = '';
    document.getElementById('newCustomerPhone').value = '';
    document.getElementById('newCustomerAddress').value = '';

    showToast('✅ Customer added successfully!', 'success');
}

function renderCustomers() {
    const container = document.getElementById('customersGrid');
    if (!container) return;

    if (customers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px; grid-column: 1/-1;">No customers yet. Add your first customer to get started!</p>';
        return;
    }

    container.innerHTML = customers.map((customer, index) => {
        const totalCredit = (customer.credits || []).reduce((sum, c) => sum + (c.total || 0), 0);
        const totalPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const balance = totalCredit - totalPaid;

        return `
            <div class="customer-card">
                <div class="customer-header">
                    <h3>${customer.name}</h3>
                    <p><i class="fas fa-phone"></i> ${customer.phone}</p>
                </div>
                <div class="customer-body">
                    <div class="balance-info">
                        <div class="balance-item">
                            <label>Credit</label>
                            <div class="amount credit">₹${totalCredit.toFixed(2)}</div>
                        </div>
                        <div class="balance-item">
                            <label>Paid</label>
                            <div class="amount paid">₹${totalPaid.toFixed(2)}</div>
                        </div>
                        <div class="balance-item">
                            <label>Balance</label>
                            <div class="amount pending">₹${balance.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="customer-actions">
                        <button class="btn-add-item" onclick="openItemModalForCustomer(${index})">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                        <button class="btn-add-payment" onclick="openPaymentModalForCustomer(${index})">
                            <i class="fas fa-wallet"></i> Payment
                        </button>
                        <button class="btn-view-details" onclick="viewCustomerDetails(${index})">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        <button class="btn-delete" onclick="deleteCustomer(${index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = customers.map((c, index) => {
        const totalCredit = (c.credits || []).reduce((sum, cr) => sum + (cr.total || 0), 0);
        const totalPaid = (c.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        return Object.assign({}, c, { index, balance: totalCredit - totalPaid });
    });

    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchTerm) || 
            c.phone.includes(searchTerm)
        );
    }

    if (statusFilter === 'pending') {
        filtered = filtered.filter(c => c.balance > 0);
    } else if (statusFilter === 'clear') {
        filtered = filtered.filter(c => c.balance === 0);
    }

    const container = document.getElementById('customersGrid');
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px; grid-column: 1/-1;">No customers found</p>';
        return;
    }

    container.innerHTML = filtered.map(customer => {
        const totalCredit = customer.balance + (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

        return `
            <div class="customer-card">
                <div class="customer-header">
                    <h3>${customer.name}</h3>
                    <p><i class="fas fa-phone"></i> ${customer.phone}</p>
                </div>
                <div class="customer-body">
                    <div class="balance-info">
                        <div class="balance-item">
                            <label>Credit</label>
                            <div class="amount credit">₹${totalCredit.toFixed(2)}</div>
                        </div>
                        <div class="balance-item">
                            <label>Paid</label>
                            <div class="amount paid">₹${totalPaid.toFixed(2)}</div>
                        </div>
                        <div class="balance-item">
                            <label>Balance</label>
                            <div class="amount pending">₹${customer.balance.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="customer-actions">
                        <button class="btn-add-item" onclick="openItemModalForCustomer(${customer.index})">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                        <button class="btn-add-payment" onclick="openPaymentModalForCustomer(${customer.index})">
                            <i class="fas fa-wallet"></i> Payment
                        </button>
                        <button class="btn-view-details" onclick="viewCustomerDetails(${customer.index})">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        <button class="btn-delete" onclick="deleteCustomer(${customer.index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchCustomers() {
    filterCustomers();
}

function deleteCustomer(index) {
    if (!confirm(`Are you sure you want to delete ${customers[index].name}?`)) return;

    customers.splice(index, 1);
    saveToStorage();
    renderCustomers();
    updateDashboard();
    showToast('Customer deleted', 'success');
}

function updateCustomerList() {
    const select = document.getElementById('itemCustomerSelect');
    if (select) {
        select.innerHTML = customers.map((c, i) => 
            `<option value="${i}">${c.name} (${c.phone})</option>`
        ).join('');
    }
}

// ============================================
// SMART PRICING & UNIT CONVERSION
// ============================================

function convertToBaseUnit(quantity, unit) {
    const conversions = {
        'kg': 1, 'g': 0.001, 'gram': 0.001, 'grams': 0.001,
        '500g': 0.5, '250g': 0.25, '100g': 0.1,
        'litre': 1, 'l': 1, 'liter': 1, 'ml': 0.001,
        '500ml': 0.5, '250ml': 0.25, '100ml': 0.1
    };

    const unitLower = unit.toLowerCase().trim();
    return quantity * (conversions[unitLower] || 1);
}

function calculateSmartPrice(quantity, unit, basePrice, baseUnit) {
    const quantityInBaseUnit = convertToBaseUnit(quantity, unit);
    return quantityInBaseUnit * basePrice;
}

function populateUnitOptions(baseUnit) {
    const unitSelect = document.getElementById('itemUnit');
    if (!unitSelect) return;

    const weightUnits = ['kg', '500g', '250g', '100g', 'g'];
    const volumeUnits = ['litre', '500ml', '250ml', '100ml', 'ml'];
    const baseUnitLower = baseUnit.toLowerCase();

    let options = '';

    if (baseUnitLower === 'kg' || baseUnitLower === 'g') {
        options = weightUnits.map(u => 
            `<option value="${u}" ${u === baseUnit ? 'selected' : ''}>${u}</option>`
        ).join('');
    } else if (baseUnitLower === 'litre' || baseUnitLower === 'l') {
        options = volumeUnits.map(u => 
            `<option value="${u}" ${u === baseUnit ? 'selected' : ''}>${u}</option>`
        ).join('');
    } else {
        options = `<option value="${baseUnit}" selected>${baseUnit}</option>`;
    }

    unitSelect.innerHTML = options;
}

// Continue in next part...

// ============================================
// ITEM MODAL - ADD ITEM TO CUSTOMER
// ============================================

function openItemModalForCustomer(index) {
    currentCustomerIndex = index;
    populateCustomerSelect(index);
    document.getElementById('addItemModal').classList.add('active');
    document.getElementById('itemCustomerSelect').value = index;
    updateCustomerInfo();
    switchItemMode('list');
}

function populateCustomerSelect(selectedIndex) {
    const select = document.getElementById('itemCustomerSelect');
    if (select) {
        select.innerHTML = customers.map((c, i) => 
            `<option value="${i}" ${i === selectedIndex ? 'selected' : ''}>${c.name} (${c.phone})</option>`
        ).join('');
    }
}

function switchItemMode(mode) {
    currentItemMode = mode;

    const listMode = document.getElementById('selectListMode');
    const manualMode = document.getElementById('manualEntryMode');
    const listBtn = document.getElementById('selectFromListBtn');
    const manualBtn = document.getElementById('enterManuallyBtn');

    if (mode === 'list') {
        if (listMode) listMode.style.display = 'block';
        if (manualMode) manualMode.style.display = 'none';
        if (listBtn) {
            listBtn.classList.add('active');
            listBtn.style.background = 'var(--primary)';
            listBtn.style.color = 'white';
            listBtn.style.borderColor = 'var(--primary)';
        }
        if (manualBtn) {
            manualBtn.classList.remove('active');
            manualBtn.style.background = 'var(--bg-secondary)';
            manualBtn.style.color = 'var(--text-primary)';
            manualBtn.style.borderColor = 'var(--border)';
        }

        const manualNameField = document.getElementById('manualItemName');
        if (manualNameField) manualNameField.value = '';
    } else {
        if (listMode) listMode.style.display = 'none';
        if (manualMode) manualMode.style.display = 'block';
        if (listBtn) {
            listBtn.classList.remove('active');
            listBtn.style.background = 'var(--bg-secondary)';
            listBtn.style.color = 'var(--text-primary)';
            listBtn.style.borderColor = 'var(--border)';
        }
        if (manualBtn) {
            manualBtn.classList.add('active');
            manualBtn.style.background = 'var(--primary)';
            manualBtn.style.color = 'white';
            manualBtn.style.borderColor = 'var(--primary)';
        }

        const itemSelect = document.getElementById('itemSelect');
        if (itemSelect) itemSelect.value = '';
        const selectedInfo = document.getElementById('selectedItemInfo');
        if (selectedInfo) selectedInfo.style.display = 'none';
    }

    calculateTotal();
}

function updateCustomerInfo() {
    const customerIndex = parseInt(document.getElementById('itemCustomerSelect').value);
    const infoBox = document.getElementById('customerInfoBox');

    if (!infoBox) return;

    if (isNaN(customerIndex)) {
        infoBox.style.display = 'none';
        return;
    }

    const customer = customers[customerIndex];
    const totalCredit = (customer.credits || []).reduce((sum, c) => sum + (c.total || 0), 0);
    const totalPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalCredit - totalPaid;

    const nameEl = document.getElementById('selectedCustomerName');
    const phoneEl = document.getElementById('selectedCustomerPhone');
    const balanceEl = document.getElementById('selectedCustomerBalance');

    if (nameEl) nameEl.textContent = customer.name;
    if (phoneEl) phoneEl.textContent = '📱 ' + customer.phone;
    if (balanceEl) {
        balanceEl.textContent = '₹' + balance.toFixed(2);
        balanceEl.style.color = balance > 0 ? 'var(--danger)' : 'var(--success)';
    }

    infoBox.style.display = 'block';
}

function onItemSelect() {
    if (typeof predefinedItems === 'undefined') return;

    const selectedName = document.getElementById('itemSelect').value;
    const infoBox = document.getElementById('selectedItemInfo');

    if (!infoBox) return;

    if (!selectedName) {
        infoBox.style.display = 'none';
        return;
    }

    const item = predefinedItems.find(i => i.name === selectedName);

    if (item) {
        document.getElementById('itemUnit').value = item.unit;
        document.getElementById('itemPrice').value = item.price;
        populateUnitOptions(item.unit);

        const nameEl = document.getElementById('selectedItemName');
        const priceEl = document.getElementById('selectedItemPrice');
        const stockEl = document.getElementById('selectedItemStock');

        if (nameEl) nameEl.textContent = item.name;
        if (priceEl) priceEl.textContent = '₹' + item.price + ' per ' + item.unit;

        if (typeof inventory !== 'undefined' && stockEl) {
            const inventoryItem = inventory.find(i => i.name === item.name);
            if (inventoryItem) {
                stockEl.textContent = inventoryItem.stock + ' ' + inventoryItem.unit;
                stockEl.style.color = inventoryItem.stock <= inventoryItem.minStock ? 'var(--danger)' : 'var(--success)';
            } else {
                stockEl.textContent = '∞';
            }
        } else if (stockEl) {
            stockEl.textContent = '∞';
        }

        infoBox.style.display = 'block';
    }

    calculateTotal();
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('itemQuantity').value) || 0;
    const unit = document.getElementById('itemUnit').value;
    let price = parseFloat(document.getElementById('itemPrice').value) || 0;

    let total = 0;

    if (currentItemMode === 'list') {
        const selectedName = document.getElementById('itemSelect').value;

        if (selectedName && typeof predefinedItems !== 'undefined') {
            const item = predefinedItems.find(i => i.name === selectedName);

            if (item) {
                total = calculateSmartPrice(quantity, unit, item.price, item.unit);
                const calculatedRate = total / quantity;
                document.getElementById('itemPrice').value = calculatedRate.toFixed(2);
                price = calculatedRate;
            } else {
                total = quantity * price;
            }
        } else {
            total = quantity * price;
        }
    } else {
        total = quantity * price;
    }

    const totalEl = document.getElementById('itemTotal');
    if (totalEl) {
        totalEl.textContent = '₹' + total.toFixed(2);
        totalEl.style.animation = 'none';
        setTimeout(() => {
            totalEl.style.animation = 'pulse 0.3s ease';
        }, 10);
    }

    const customerIndex = parseInt(document.getElementById('itemCustomerSelect').value);
    const newBalanceEl = document.getElementById('newBalanceDisplay');

    if (!isNaN(customerIndex) && newBalanceEl) {
        const customer = customers[customerIndex];
        const currentCredit = (customer.credits || []).reduce((sum, c) => sum + (c.total || 0), 0);
        const currentPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const currentBalance = currentCredit - currentPaid;
        const newBalance = currentBalance + total;

        newBalanceEl.textContent = '₹' + newBalance.toFixed(2);
        newBalanceEl.style.color = newBalance > currentBalance + 1000 ? 'var(--danger)' : 'var(--primary)';
    }
}

function updateManualTotal() {
    calculateTotal();
}

function saveItem() {
    const customerIndex = parseInt(document.getElementById('itemCustomerSelect').value);

    if (isNaN(customerIndex)) {
        showToast('Please select a customer', 'error');
        return;
    }

    let itemName = '';

    if (currentItemMode === 'list') {
        const selectedItem = document.getElementById('itemSelect').value;
        itemName = selectedItem || '';
    } else {
        const manualNameField = document.getElementById('manualItemName');
        itemName = manualNameField ? manualNameField.value.trim() : '';
    }

    const quantity = parseFloat(document.getElementById('itemQuantity').value);
    const unit = document.getElementById('itemUnit').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const noteField = document.getElementById('itemNote');
    const note = noteField ? noteField.value.trim() : '';

    if (!itemName || !quantity || !price) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (quantity <= 0 || price <= 0) {
        showToast('Quantity and price must be greater than zero', 'error');
        return;
    }

    const total = quantity * price;

    if (typeof inventory !== 'undefined') {
        const inventoryItem = inventory.find(i => i.name === itemName);
        if (inventoryItem && inventoryItem.stock < quantity) {
            if (!confirm(`⚠️ Low Stock Warning!\n\nAvailable: ${inventoryItem.stock} ${unit}\nRequested: ${quantity} ${unit}\n\nContinue anyway?`)) {
                return;
            }
        }
    }

    if (!customers[customerIndex].credits) {
        customers[customerIndex].credits = [];
    }

    customers[customerIndex].credits.push({
        item: itemName,
        quantity,
        unit,
        price,
        total,
        note: note || '',
        date: new Date().toISOString()
    });

    if (typeof inventory !== 'undefined') {
        const inventoryItem = inventory.find(i => i.name === itemName);
        if (inventoryItem) {
            inventoryItem.stock -= quantity;
            if (typeof saveInventory === 'function') saveInventory();
            if (typeof checkLowStock === 'function') checkLowStock(inventoryItem);
            if (typeof renderInventory === 'function') renderInventory();
        }
    }

    saveToStorage();
    renderCustomers();
    updateDashboard();
    closeModal('addItemModal');

    document.getElementById('itemCustomerSelect').value = '';
    document.getElementById('itemSelect').value = '';
    const manualNameField = document.getElementById('manualItemName');
    if (manualNameField) manualNameField.value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
    if (noteField) noteField.value = '';
    const totalEl = document.getElementById('itemTotal');
    if (totalEl) totalEl.textContent = '₹0.00';
    const newBalanceEl = document.getElementById('newBalanceDisplay');
    if (newBalanceEl) newBalanceEl.textContent = '₹0.00';
    const customerInfoBox = document.getElementById('customerInfoBox');
    if (customerInfoBox) customerInfoBox.style.display = 'none';
    const selectedItemInfo = document.getElementById('selectedItemInfo');
    if (selectedItemInfo) selectedItemInfo.style.display = 'none';

    switchItemMode('list');

    showToast(`✅ ${itemName} added to ${customers[customerIndex].name}'s account!`, 'success');
}

// Continue Part 3...

// ============================================
// ITEMS MANAGEMENT (Predefined Items)
// ============================================

function populatePredefinedItems() {
    const select = document.getElementById('itemSelect');
    if (!select || typeof predefinedItems === 'undefined') return;

    select.innerHTML = '<option value="">-- Select Item --</option>' + 
        predefinedItems.map(item => 
            `<option value="${item.name}">${item.name} (₹${item.price}/${item.unit})</option>`
        ).join('');
}

function applySortToItems(items, sortOrder) {
    const sortedItems = [...items];

    switch(sortOrder) {
        case 'name-asc':
            return sortedItems.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sortedItems.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-asc':
            return sortedItems.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sortedItems.sort((a, b) => b.price - a.price);
        case 'unit':
            return sortedItems.sort((a, b) => a.unit.localeCompare(b.unit));
        default:
            return sortedItems;
    }
}

function sortItems(criteria) {
    if (typeof predefinedItems === 'undefined') return;

    if (!criteria || criteria === '') {
        currentSortOrder = 'default';
    } else {
        currentSortOrder = criteria;
    }

    renderItems();

    const sortNames = {
        'name-asc': 'Name (A-Z)',
        'name-desc': 'Name (Z-A)',
        'price-asc': 'Price (Low to High)',
        'price-desc': 'Price (High to Low)',
        'unit': 'Unit Type',
        'default': 'Default Order'
    };

    showToast(`✓ Sorted by ${sortNames[currentSortOrder]}`, 'success');
}

function searchItems() {
    const searchTerm = document.getElementById('itemSearch')?.value.toLowerCase() || '';
    const container = document.getElementById('itemsGrid');

    if (!container || typeof predefinedItems === 'undefined') return;

    if (!searchTerm) {
        renderItems();
        return;
    }

    let filtered = predefinedItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.unit.toLowerCase().includes(searchTerm) ||
        item.price.toString().includes(searchTerm)
    );

    filtered = applySortToItems(filtered, currentSortOrder);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
                <i class="fas fa-search" style="font-size: 48px; color: var(--text-secondary); opacity: 0.3; margin-bottom: 16px;"></i>
                <h3 style="color: var(--text-secondary);">No items found</h3>
                <p style="color: var(--text-secondary);">Try different keywords</p>
            </div>
        `;

        const itemCountEl = document.getElementById('itemCount');
        if (itemCountEl) itemCountEl.textContent = '0 Items';
        return;
    }

    container.innerHTML = filtered.map((item) => {
        const actualIndex = predefinedItems.findIndex(i => 
            i.name === item.name && i.unit === item.unit && i.price === item.price
        );

        return `
        <div class="item-card">
            <div style="position: absolute; top: 10px; right: 10px; background: var(--warning); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                <i class="fas fa-search"></i> Found
            </div>
            <div style="text-align: center; padding: 20px 10px 10px;">
                <h3>${item.name}</h3>
                <div class="item-price">₹${item.price}</div>
                <div class="item-unit">per ${item.unit}</div>
            </div>
            <div class="item-actions">
                <button onclick="editItem(${actualIndex})"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="duplicateItem(${actualIndex})"><i class="fas fa-copy"></i> Copy</button>
                <button onclick="deleteItem(${actualIndex})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    }).join('');

    const itemCountEl = document.getElementById('itemCount');
    if (itemCountEl) {
        itemCountEl.textContent = filtered.length + ' of ' + predefinedItems.length + ' Items';
    }
}

function getItemIcon(itemName) {
    const name = itemName.toLowerCase();

    if (name.includes('rice') || name.includes('wheat') || name.includes('atta')) return 'seedling';
    if (name.includes('dal') || name.includes('lentil')) return 'circle';
    if (name.includes('oil') || name.includes('ghee')) return 'fill-drip';
    if (name.includes('turmeric') || name.includes('chilli') || name.includes('masala') || name.includes('spice')) return 'pepper-hot';
    if (name.includes('sugar') || name.includes('jaggery')) return 'cube';
    if (name.includes('salt')) return 'mortar-pestle';
    if (name.includes('milk') || name.includes('curd')) return 'mug-hot';
    if (name.includes('tea') || name.includes('coffee')) return 'coffee';
    if (name.includes('potato') || name.includes('onion') || name.includes('tomato')) return 'carrot';
    if (name.includes('biscuit') || name.includes('snack')) return 'cookie';

    return 'box';
}

function renderItems() {
    const container = document.getElementById('itemsGrid');
    if (!container) return;

    if (typeof predefinedItems === 'undefined' || predefinedItems.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-box-open" style="font-size: 64px; color: var(--text-secondary); opacity: 0.3; margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 10px;">No Items Yet</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Start by adding your first product item</p>
                <button class="btn-primary" onclick="openAddItemModal()" style="padding: 12px 24px;">
                    <i class="fas fa-plus"></i> Add First Item
                </button>
            </div>
        `;
        return;
    }

    let displayItems = applySortToItems([...predefinedItems], currentSortOrder);

    container.innerHTML = displayItems.map((item, displayIndex) => {
        const actualIndex = predefinedItems.findIndex(i => 
            i.name === item.name && i.unit === item.unit && i.price === item.price
        );

        return `
        <div class="item-card" style="position: relative;">
            <div style="position: absolute; top: 10px; right: 10px; background: var(--primary); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px;">
                #${displayIndex + 1}
            </div>
            <div style="text-align: center; padding: 20px 10px 10px;">
                <div style="width: 60px; height: 60px; margin: 0 auto 12px; background: linear-gradient(135deg, var(--primary), var(--success)); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-${getItemIcon(item.name)} fa-2x" style="color: white;"></i>
                </div>
                <h3 style="margin: 0 0 8px;">${item.name}</h3>
                <div class="item-price" style="font-size: 24px; font-weight: 700; color: var(--success);">₹${item.price}</div>
                <div class="item-unit" style="color: var(--text-secondary);">per ${item.unit}</div>
            </div>
            <div style="border-top: 1px solid var(--border); padding: 12px; background: var(--bg-tertiary); display: flex; gap: 8px;">
                <button onclick="editItem(${actualIndex})" style="flex: 1; background: var(--primary); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="duplicateItem(${actualIndex})" style="flex: 1; background: var(--warning); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button onclick="deleteItem(${actualIndex})" style="background: var(--danger); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    }).join('');

    updateItemCount();
}

function updateItemCount() {
    const itemCountEl = document.getElementById('itemCount');
    if (itemCountEl && typeof predefinedItems !== 'undefined') {
        const count = predefinedItems.length;
        itemCountEl.textContent = count + ' Item' + (count !== 1 ? 's' : '');
    }
}

function openAddItemModal() {
    const modal = document.getElementById('addNewItemModal');
    if (modal) {
        document.getElementById('newItemNameInput').value = '';
        document.getElementById('newItemUnitSelect').value = 'kg';
        document.getElementById('newItemPriceInput').value = '';
        modal.classList.add('active');
        setTimeout(() => document.getElementById('newItemNameInput').focus(), 100);
    }
}

function addNewItem() {
    if (typeof predefinedItems === 'undefined') {
        showToast('Items not loaded', 'error');
        return;
    }

    const name = document.getElementById('newItemNameInput').value.trim();
    const unit = document.getElementById('newItemUnitSelect').value;
    const price = parseFloat(document.getElementById('newItemPriceInput').value);

    if (!name) {
        showToast('Please enter item name', 'error');
        return;
    }

    if (!price || price <= 0) {
        showToast('Please enter valid price', 'error');
        return;
    }

    const duplicate = predefinedItems.find(item => 
        item.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        if (!confirm(`Item "${name}" already exists. Add anyway?`)) return;
    }

    predefinedItems.push({ name, unit, price });
    localStorage.setItem('itemPrices', JSON.stringify(predefinedItems));

    populatePredefinedItems();
    renderItems();
    closeModal('addNewItemModal');

    showToast(`✅ ${name} added!`, 'success');
}

function editItem(index) {
    if (typeof predefinedItems === 'undefined') return;

    const item = predefinedItems[index];
    document.getElementById('editItemNameInput').value = item.name;
    document.getElementById('editItemUnitSelect').value = item.unit;
    document.getElementById('editItemPriceInput').value = item.price;
    document.getElementById('editItemIndex').value = index;
    document.getElementById('editItemModal').classList.add('active');

    setTimeout(() => document.getElementById('editItemNameInput').focus(), 100);
}

function saveEditedItem() {
    if (typeof predefinedItems === 'undefined') return;

    const index = parseInt(document.getElementById('editItemIndex').value);
    const name = document.getElementById('editItemNameInput').value.trim();
    const unit = document.getElementById('editItemUnitSelect').value;
    const price = parseFloat(document.getElementById('editItemPriceInput').value);

    if (!name || !price || price <= 0) {
        showToast('Invalid item details', 'error');
        return;
    }

    predefinedItems[index] = { name, unit, price };
    localStorage.setItem('itemPrices', JSON.stringify(predefinedItems));

    populatePredefinedItems();
    renderItems();
    closeModal('editItemModal');
    showToast(`✅ ${name} updated!`, 'success');
}

function duplicateItem(index) {
    if (typeof predefinedItems === 'undefined') return;

    const item = predefinedItems[index];
    const newItem = {
        name: item.name + ' (Copy)',
        unit: item.unit,
        price: item.price
    };

    predefinedItems.push(newItem);
    localStorage.setItem('itemPrices', JSON.stringify(predefinedItems));

    populatePredefinedItems();
    renderItems();
    showToast(`✅ ${item.name} duplicated!`, 'success');
}

function deleteItem(index) {
    if (!confirm('Delete this item?')) return;
    if (typeof predefinedItems === 'undefined') return;

    const item = predefinedItems[index];
    predefinedItems.splice(index, 1);
    localStorage.setItem('itemPrices', JSON.stringify(predefinedItems));

    populatePredefinedItems();
    renderItems();
    showToast(`🗑️ ${item.name} deleted`, 'success');
}

// Continue Part 4...

// ============================================
// PAYMENT MANAGEMENT
// ============================================

function openPaymentModalForCustomer(index) {
    currentCustomerIndex = index;
    const customer = customers[index];

    if (!customer.payments) customer.payments = [];
    if (!customer.credits) customer.credits = [];

    document.getElementById('paymentCustomerName').textContent = customer.name;
    document.getElementById('paymentCustomerPhone').textContent = customer.phone;

    const totalCredit = customer.credits.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalCredit - totalPaid;

    document.getElementById('paymentBalance').textContent = '₹' + balance.toFixed(2);
    const paymentAmountInput = document.getElementById('paymentAmount');
    if (paymentAmountInput) paymentAmountInput.max = balance;

    renderPaymentHistory(index);
    document.getElementById('paymentModal').classList.add('active');
}

function renderPaymentHistory(index) {
    const customer = customers[index];
    const container = document.getElementById('paymentHistory');

    if (!container) return;

    if (!customer.payments || customer.payments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No payment history</p>';
        return;
    }

    container.innerHTML = customer.payments.map((payment, pIndex) => `
        <div class="payment-item">
            <div class="payment-info">
                <strong>₹${payment.amount.toFixed(2)}</strong>
                <small>${new Date(payment.date).toLocaleDateString('en-IN')}</small>
            </div>
            <button class="btn-icon-small" onclick="deletePayment(${index}, ${pIndex})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function addPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const note = document.getElementById('paymentNote').value.trim();

    if (!amount || amount <= 0) {
        showToast('Please enter valid payment amount', 'error');
        return;
    }

    const customer = customers[currentCustomerIndex];
    if (!customer.payments) customer.payments = [];
    if (!customer.credits) customer.credits = [];

    const totalCredit = customer.credits.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalCredit - totalPaid;

    if (amount > balance) {
        showToast('Payment amount cannot exceed balance', 'error');
        return;
    }

    customer.payments.push({
        amount,
        note,
        date: new Date().toISOString()
    });

    saveToStorage();
    renderCustomers();
    updateDashboard();
    closeModal('paymentModal');

    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentNote').value = '';

    showToast('✅ Payment recorded!', 'success');
}

function deletePayment(customerIndex, paymentIndex) {
    if (!confirm('Delete this payment?')) return;

    customers[customerIndex].payments.splice(paymentIndex, 1);
    saveToStorage();
    renderPaymentHistory(customerIndex);
    renderCustomers();
    updateDashboard();
    showToast('Payment deleted', 'success');
}

// ============================================
// CUSTOMER DETAILS MODAL
// ============================================

function viewCustomerDetails(index) {
    currentCustomerIndex = index;
    const customer = customers[index];

    if (!customer.payments) customer.payments = [];
    if (!customer.credits) customer.credits = [];

    document.getElementById('detailCustomerName').textContent = customer.name;
    document.getElementById('detailCustomerPhone').textContent = customer.phone;
    document.getElementById('detailCustomerAddress').textContent = customer.address || 'Not provided';

    const totalCredit = customer.credits.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalCredit - totalPaid;

    document.getElementById('detailTotalCredit').textContent = '₹' + totalCredit.toFixed(2);
    document.getElementById('detailTotalPaid').textContent = '₹' + totalPaid.toFixed(2);
    document.getElementById('detailBalance').textContent = '₹' + balance.toFixed(2);

    renderCreditItems(index);
    renderDetailPayments(index);

    document.getElementById('customerDetailModal').classList.add('active');
}

function renderCreditItems(index) {
    const customer = customers[index];
    const container = document.getElementById('creditItemsList');

    if (!container) return;

    if (!customer.credits || customer.credits.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No items purchased</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--bg-tertiary);">
                    <th style="padding: 8px; text-align: left;">Item</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Price</th>
                    <th style="padding: 8px; text-align: right;">Total</th>
                    <th style="padding: 8px; text-align: center;">Action</th>
                </tr>
            </thead>
            <tbody>
                ${customer.credits.map((credit, cIndex) => `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 8px;">${credit.item}</td>
                        <td style="padding: 8px; text-align: center;">${credit.quantity} ${credit.unit}</td>
                        <td style="padding: 8px; text-align: right;">₹${credit.price.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: right; font-weight: 600;">₹${credit.total.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: center;">
                            <button class="btn-icon-small" onclick="deleteCreditItem(${index}, ${cIndex})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderDetailPayments(index) {
    const customer = customers[index];
    const container = document.getElementById('detailPaymentsList');

    if (!container) return;

    if (!customer.payments || customer.payments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No payments made</p>';
        return;
    }

    container.innerHTML = customer.payments.map((payment, pIndex) => `
        <div class="payment-item">
            <div class="payment-info">
                <strong>₹${payment.amount.toFixed(2)}</strong>
                <small>${new Date(payment.date).toLocaleDateString('en-IN')}</small>
                ${payment.note ? '<p style="margin-top: 4px; color: var(--text-secondary);">' + payment.note + '</p>' : ''}
            </div>
            <button class="btn-icon-small" onclick="deletePaymentFromDetail(${index}, ${pIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteCreditItem(customerIndex, creditIndex) {
    if (!confirm('Delete this item?')) return;

    customers[customerIndex].credits.splice(creditIndex, 1);
    saveToStorage();
    renderCreditItems(customerIndex);
    renderCustomers();
    updateDashboard();
    viewCustomerDetails(customerIndex);
    showToast('Item deleted', 'success');
}

function deletePaymentFromDetail(customerIndex, paymentIndex) {
    if (!confirm('Delete this payment?')) return;

    customers[customerIndex].payments.splice(paymentIndex, 1);
    saveToStorage();
    renderDetailPayments(customerIndex);
    renderCustomers();
    updateDashboard();
    viewCustomerDetails(customerIndex);
    showToast('Payment deleted', 'success');
}

function switchTab(tab) {
    const creditsTab = document.getElementById('creditsTab');
    const paymentsTab = document.getElementById('paymentsTab');
    const creditsContent = document.getElementById('creditsTabContent');
    const paymentsContent = document.getElementById('paymentsTabContent');

    if (tab === 'credits') {
        if (creditsTab) {
            creditsTab.classList.add('active');
            creditsTab.style.borderBottom = '2px solid var(--primary)';
            creditsTab.style.color = 'var(--primary)';
        }
        if (paymentsTab) {
            paymentsTab.classList.remove('active');
            paymentsTab.style.borderBottom = '2px solid transparent';
            paymentsTab.style.color = 'var(--text-secondary)';
        }
        if (creditsContent) creditsContent.style.display = 'block';
        if (paymentsContent) paymentsContent.style.display = 'none';
    } else {
        if (creditsTab) {
            creditsTab.classList.remove('active');
            creditsTab.style.borderBottom = '2px solid transparent';
            creditsTab.style.color = 'var(--text-secondary)';
        }
        if (paymentsTab) {
            paymentsTab.classList.add('active');
            paymentsTab.style.borderBottom = '2px solid var(--primary)';
            paymentsTab.style.color = 'var(--primary)';
        }
        if (creditsContent) creditsContent.style.display = 'none';
        if (paymentsContent) paymentsContent.style.display = 'block';
    }
}

// ============================================
// WHATSAPP & PRINT
// ============================================

function sendReceiptToWhatsApp(index) {
    const customer = customers[index];
    const totalCredit = (customer.credits || []).reduce((sum, c) => sum + (c.total || 0), 0);
    const totalPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalCredit - totalPaid;

    let message = `*${storeInfo.name}*\n${storeInfo.address}\n${storeInfo.phone}\n\n`;
    message += `*Customer:* ${customer.name}\n*Phone:* ${customer.phone}\n`;
    message += `*Date:* ${new Date().toLocaleDateString('en-IN')}\n\n`;
    message += `*Credit Summary*\nTotal Credit: ₹${totalCredit.toFixed(2)}\n`;
    message += `Total Paid: ₹${totalPaid.toFixed(2)}\n*Balance: ₹${balance.toFixed(2)}*\n\n`;
    message += `Thank you for your business! 🙏`;

    const phone = customer.phone.replace(/\D/g, '');
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    showToast('Opening WhatsApp...', 'success');
}

function sendReceiptFromDetail() {
    sendReceiptToWhatsApp(currentCustomerIndex);
}

function printReceipt(index) {
    showToast('Print feature coming soon!', 'success');
}

function printReceiptFromDetail() {
    printReceipt(currentCustomerIndex);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportToExcel() {
    let csv = 'Customer Name,Phone,Address,Total Credit,Total Paid,Balance\n';

    customers.forEach(customer => {
        const totalCredit = (customer.credits || []).reduce((sum, c) => sum + (c.total || 0), 0);
        const totalPaid = (customer.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const balance = totalCredit - totalPaid;

        csv += `"${customer.name}","${customer.phone}","${customer.address || ''}",${totalCredit.toFixed(2)},${totalPaid.toFixed(2)},${balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Customers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('✅ Report exported!', 'success');
}

function exportCustomerDetails(index) {
    const customer = customers[index];
    let csv = `${storeInfo.name}\n${storeInfo.address}\n\nCustomer: ${customer.name}\n`;
    csv += 'Item,Quantity,Unit,Price,Total\n';

    (customer.credits || []).forEach(credit => {
        csv += `"${credit.item}",${credit.quantity},"${credit.unit}",${credit.price.toFixed(2)},${credit.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name}_Details.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('✅ Details exported!', 'success');
}

// ============================================
// TRANSACTIONS
// ============================================

function renderTransactions() {
    const container = document.getElementById('transactionsTable');
    if (!container) return;

    const transactions = [];

    customers.forEach(customer => {
        (customer.credits || []).forEach(credit => {
            transactions.push({
                type: 'credit',
                customer: customer.name,
                phone: customer.phone,
                description: `${credit.item} ${credit.quantity} ${credit.unit}`,
                amount: credit.total,
                date: new Date(credit.date)
            });
        });

        (customer.payments || []).forEach(payment => {
            transactions.push({
                type: 'payment',
                customer: customer.name,
                phone: customer.phone,
                description: payment.note || 'Payment received',
                amount: payment.amount,
                date: new Date(payment.date)
            });
        });
    });

    transactions.sort((a, b) => b.date - a.date);

    if (transactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">No transactions yet</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--bg-tertiary);">
                    <th style="padding: 12px;">Date</th>
                    <th style="padding: 12px;">Customer</th>
                    <th style="padding: 12px;">Type</th>
                    <th style="padding: 12px;">Description</th>
                    <th style="padding: 12px; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => `
                    <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 12px;">${t.date.toLocaleDateString('en-IN')}</td>
                        <td style="padding: 12px;"><strong>${t.customer}</strong><br><small>${t.phone}</small></td>
                        <td style="padding: 12px;">
                            <span style="padding: 4px 12px; border-radius: 12px; background: ${t.type === 'credit' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${t.type === 'credit' ? 'var(--danger)' : 'var(--success)'};">
                                ${t.type === 'credit' ? 'Credit' : 'Payment'}
                            </span>
                        </td>
                        <td style="padding: 12px;">${t.description}</td>
                        <td style="padding: 12px; text-align: right; font-weight: 600; color: ${t.type === 'credit' ? 'var(--danger)' : 'var(--success)'};">
                            ${t.type === 'credit' ? '+' : '-'}₹${t.amount.toFixed(2)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function exportTransactions() {
    const transactions = [];

    customers.forEach(customer => {
        (customer.credits || []).forEach(credit => {
            transactions.push({
                date: new Date(credit.date).toLocaleDateString('en-IN'),
                customer: customer.name,
                phone: customer.phone,
                type: 'Credit',
                description: `${credit.item} ${credit.quantity} ${credit.unit}`,
                amount: credit.total
            });
        });

        (customer.payments || []).forEach(payment => {
            transactions.push({
                date: new Date(payment.date).toLocaleDateString('en-IN'),
                customer: customer.name,
                phone: customer.phone,
                type: 'Payment',
                description: payment.note || 'Payment received',
                amount: payment.amount
            });
        });
    });

    let csv = 'Date,Customer,Phone,Type,Description,Amount\n';
    transactions.forEach(t => {
        csv += `${t.date},"${t.customer}","${t.phone}",${t.type},"${t.description}",${t.amount.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('✅ Transactions exported!', 'success');
}

// ============================================
// SETTINGS & BACKUP
// ============================================

function saveStoreInfo() {
    storeInfo.name = document.getElementById('storeName').value;
    storeInfo.address = document.getElementById('storeAddress').value;
    storeInfo.phone = document.getElementById('storePhone').value;

    localStorage.setItem('storeInfo', JSON.stringify(storeInfo));
    showToast('✅ Store info updated!', 'success');
}

function backupData() {
    const data = {
        customers,
        itemPrices: typeof predefinedItems !== 'undefined' ? predefinedItems : [],
        storeInfo,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BalajiKirana_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('✅ Backup downloaded!', 'success');
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.customers) {
                customers = data.customers;
                localStorage.setItem('customers', JSON.stringify(customers));
                renderCustomers();
                updateDashboard();
                showToast('✅ Data restored!', 'success');
            }
        } catch (err) {
            showToast('Invalid backup file', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('⚠️ Delete all data permanently?')) return;
    if (!confirm('This cannot be undone. Continue?')) return;

    localStorage.clear();
    customers = [];
    location.reload();
}

function filterActivity(period) {
    showToast('Filter: ' + period, 'info');
}

// ============================================
// APP READY
// ============================================

console.log("✅ Balaji Kirana System v1.0 - Clean Edition Loaded!");
