// Initialize the page when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadCustomers();
  setupEventListeners();
});

function setupEventListeners() {
  // Search functionality
  document.getElementById('customer-search').addEventListener('input', filterCustomers);

  // Add customer buttons
  document.getElementById('add-customer-btn').addEventListener('click', openAddCustomerModal);
  document.getElementById('add-first-customer-btn')?.addEventListener('click', openAddCustomerModal);

  // Close modals
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      document.getElementById('customer-modal').style.display = 'none';
      document.getElementById('orders-modal').style.display = 'none';
    });
  });

  // Click outside modal to close
  window.addEventListener('click', function(event) {
    const customerModal = document.getElementById('customer-modal');
    const ordersModal = document.getElementById('orders-modal');
    if (event.target === customerModal) {
      customerModal.style.display = 'none';
    }
    if (event.target === ordersModal) {
      ordersModal.style.display = 'none';
    }
  });

  // Save customer
  document.getElementById('save-customer').addEventListener('click', saveCustomer);

  // Delete customer
  document.getElementById('delete-customer').addEventListener('click', deleteCustomer);

  // Remove everything (currently only placeholder)
  document.getElementById('remove-everything').addEventListener('click', removeEverything);
}

function loadCustomers() {
  const customers = getCustomersFromStorage();
  const tableBody = document.getElementById('customer-list');
  const noCustomersMessage = document.getElementById('no-customers-message');
  const customerTable = document.getElementById('customer-table');

  // Clear existing rows
  tableBody.innerHTML = '';

  if (customers.length === 0) {
    // Show no customers message
    noCustomersMessage.style.display = 'flex';
    customerTable.style.display = 'none';
    return;
  }

  // Hide no customers message, show table
  noCustomersMessage.style.display = 'none';
  customerTable.style.display = 'table';

  // Sort customers alphabetically by name
  customers.sort((a, b) => a.name.localeCompare(b.name));

  // Add rows to table
  customers.forEach(customer => {
    const row = document.createElement('tr');
    row.setAttribute('data-customer-id', customer.id);

    // Count customer orders
    const orders = getCustomerOrders(customer.id);
    const orderCount = orders.length;

    row.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.phone || 'N/A'}</td>
      <td>${customer.email || 'N/A'}</td>
      <td>${truncateText(customer.address, 30) || 'N/A'}</td>
      <td>${orderCount}</td>
      <td class="actions">
        <button class="btn btn-icon btn-light view-orders" data-customer="${customer.id}" title="View Orders">
          <i class="fas fa-file-invoice"></i>
        </button>
        <button class="btn btn-icon btn-light edit-customer" data-customer="${customer.id}" title="Edit Customer">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-icon btn-light new-invoice" data-customer="${customer.id}" title="Create New Invoice">
          <i class="fas fa-plus"></i>
        </button>
        <button class="btn btn-icon btn-delete delete-customer" data-customer="${customer.id}" title="Delete Customer">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.view-orders').forEach(button => {
    button.addEventListener('click', function() {
      const customerId = this.getAttribute('data-customer');
      viewCustomerOrders(customerId);
    });
  });

  document.querySelectorAll('.edit-customer').forEach(button => {
    button.addEventListener('click', function() {
      const customerId = this.getAttribute('data-customer');
      editCustomer(customerId);
    });
  });

  document.querySelectorAll('.new-invoice').forEach(button => {
    button.addEventListener('click', function() {
      const customerId = this.getAttribute('data-customer');
      createNewInvoice(customerId);
    });
  });
  
  document.querySelectorAll('.delete-customer').forEach(button => {
    button.addEventListener('click', function() {
      const customerId = this.getAttribute('data-customer');
      if (confirm('Are you sure you want to delete this customer? This will not delete their invoices.')) {
        deleteCustomerFromList(customerId);
      }
    });
  });
}

function openAddCustomerModal() {
  // Reset form
  document.getElementById('customer-form').reset();
  document.getElementById('customer-id').value = '';

  // Update modal title
  document.getElementById('modal-title').textContent = 'Add New Customer';

  // Hide delete button for new customers
  document.getElementById('delete-customer').style.display = 'none';
  document.getElementById('remove-everything').style.display = 'none'; //Hide remove everything button for new customers

  // Show modal
  document.getElementById('customer-modal').style.display = 'flex';
}

function saveCustomer() {
  // Get form values
  const customerId = document.getElementById('customer-id').value;
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const address = document.getElementById('address').value;
  const notes = document.getElementById('notes').value;

  if (!name || !phone) {
    alert('Name and Phone are required fields.');
    return;
  }

  // Get existing customers
  const customers = getCustomersFromStorage();

  // Check if this is an edit or new customer
  if (customerId) {
    // Edit existing customer
    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex !== -1) {
      customers[customerIndex] = {
        ...customers[customerIndex],
        name,
        phone,
        email,
        address,
        notes,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Create new customer with unique ID
    const newCustomer = {
      id: generateCustomerId(),
      name,
      phone,
      email,
      address,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    customers.push(newCustomer);
  }

  // Save back to localStorage
  localStorage.setItem('customers', JSON.stringify(customers));

  // Close modal
  document.getElementById('customer-modal').style.display = 'none';

  // Reload customer list
  loadCustomers();
}

function editCustomer(customerId) {
  const customers = getCustomersFromStorage();
  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    alert('Customer not found!');
    return;
  }

  // Fill form with customer data
  document.getElementById('customer-id').value = customer.id;
  document.getElementById('name').value = customer.name || '';
  document.getElementById('phone').value = customer.phone || '';
  document.getElementById('email').value = customer.email || '';
  document.getElementById('address').value = customer.address || '';
  document.getElementById('notes').value = customer.notes || '';

  // Update modal title
  document.getElementById('modal-title').textContent = 'Edit Customer';

  // Show delete button for existing customers
  document.getElementById('delete-customer').style.display = 'inline-block';
  document.getElementById('remove-everything').style.display = 'inline-block'; //Show remove everything button for existing customers

  // Show modal
  document.getElementById('customer-modal').style.display = 'flex';
}

function deleteCustomer() {
  const customerId = document.getElementById('customer-id').value;

  if (!customerId) return;

  if (confirm('Are you sure you want to delete this customer? This will not delete their invoices.')) {
    deleteCustomerFromList(customerId);
    // Close modal
    document.getElementById('customer-modal').style.display = 'none';
  }
}

function deleteCustomerFromList(customerId) {
  if (!customerId) return;
  
  // Get existing customers
  const customers = getCustomersFromStorage();

  // Filter out the customer to delete
  const updatedCustomers = customers.filter(c => c.id !== customerId);

  // Save back to localStorage
  localStorage.setItem('customers', JSON.stringify(updatedCustomers));

  // Reload customer list
  loadCustomers();
}

function removeEverything() {
  const customerId = document.getElementById('customer-id').value;
  if (!customerId) return;
  if (confirm('Are you sure you want to delete this customer and all associated invoices?')) {
    //Implementation to remove customer and associated invoices would go here.
    alert('Remove Everything functionality not yet implemented.');

    // Close modal
    document.getElementById('customer-modal').style.display = 'none';

    // Reload customer list
    loadCustomers();
  }
}

function viewCustomerOrders(customerId) {
  const customers = getCustomersFromStorage();
  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    alert('Customer not found!');
    return;
  }

  // Set customer name in modal title
  document.getElementById('customer-name-title').textContent = customer.name;

  // Get customer orders
  const orders = getCustomerOrders(customerId);
  const tableBody = document.getElementById('orders-list');
  const noOrdersMessage = document.getElementById('no-orders-message');
  const ordersTable = document.getElementById('orders-table');

  // Clear existing rows
  tableBody.innerHTML = '';

  if (orders.length === 0) {
    // Show no orders message
    noOrdersMessage.style.display = 'flex';
    ordersTable.style.display = 'none';
  } else {
    // Hide no orders message, show table
    noOrdersMessage.style.display = 'none';
    ordersTable.style.display = 'table';

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add rows to table
    orders.forEach(order => {
      const row = document.createElement('tr');

      // Format date
      const orderDate = new Date(order.date);
      const formattedDate = orderDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      // Create status badge class based on status
      const statusClass = getStatusClass(order.status);

      row.innerHTML = `
        <td>${order.invoiceNumber}</td>
        <td>${formattedDate}</td>
        <td>${order.payment.total}</td>
        <td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(order.status)}</span></td>
        <td class="actions">
          <button class="btn btn-icon btn-light view-invoice" data-invoice="${order.invoiceNumber}">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Add event listeners to view invoice buttons
    document.querySelectorAll('.view-invoice').forEach(button => {
      button.addEventListener('click', function() {
        const invoiceId = this.getAttribute('data-invoice');
        // Redirect to history page with invoice id in URL parameter
        window.location.href = `history.html?invoice=${invoiceId}`;
      });
    });
  }

  // Show modal
  document.getElementById('orders-modal').style.display = 'flex';
}

function createNewInvoice(customerId) {
  // Store the selected customer ID in localStorage
  localStorage.setItem('selectedCustomerId', customerId);

  // Redirect to invoice page
  window.location.href = 'index.html';
}

function filterCustomers() {
  const searchTerm = document.getElementById('customer-search').value.toLowerCase();

  if (!searchTerm) {
    loadCustomers();
    return;
  }

  const customers = getCustomersFromStorage();

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
    (customer.address && customer.address.toLowerCase().includes(searchTerm))
  );

  // Save filtered customers temporarily
  localStorage.setItem('tempFilteredCustomers', JSON.stringify(filteredCustomers));

  // Render filtered customers
  renderFilteredCustomers();
}

function renderFilteredCustomers() {
  // Get filtered customers
  const filteredCustomers = JSON.parse(localStorage.getItem('tempFilteredCustomers')) || [];

  // Save original customers temporarily
  const originalCustomers = getCustomersFromStorage();

  // Replace customers with filtered list for rendering
  localStorage.setItem('customers', JSON.stringify(filteredCustomers));

  // Load the filtered view
  loadCustomers();

  // Restore original customers
  localStorage.setItem('customers', JSON.stringify(originalCustomers));

  // Clean up
  localStorage.removeItem('tempFilteredCustomers');
}

// Helper Functions

function getCustomersFromStorage() {
  return JSON.parse(localStorage.getItem('customers')) || [];
}

function getCustomerOrders(customerId) {
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];

  // Filter invoices for the specific customer
  return invoices.filter(invoice => 
    invoice.customer && 
    invoice.customer.id === customerId
  );
}

function generateCustomerId() {
  // Generate a unique customer ID
  return 'cust_' + Date.now() + Math.floor(Math.random() * 1000);
}

function getStatusClass(status) {
  switch(status.toLowerCase()) {
    case 'paid':
      return 'status-paid';
    case 'pending':
      return 'status-pending';
    case 'draft':
      return 'status-draft';
    default:
      return 'status-default';
  }
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Add styles for the customers page
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .customer-list-container {
      overflow-x: auto;
    }

    .customer-table {
      width: 100%;
      border-collapse: collapse;
    }

    .customer-table th,
    .customer-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .customer-table th {
      font-weight: 600;
      color: var(--text-light);
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th,
    .orders-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .orders-table th {
      font-weight: 600;
      color: var(--text-light);
    }

    .no-customers,
    .no-orders {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-light);
    }

    .no-customers i,
    .no-orders i {
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-customers h3,
    .no-orders h3 {
      margin-bottom: 0.5rem;
    }

    .no-customers p,
    .no-orders p {
      margin-bottom: 1.5rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-paid {
      background-color: #dcfce7;
      color: #16a34a;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #d97706;
    }

    .status-draft {
      background-color: #e5e7eb;
      color: #6b7280;
    }
  </style>
`);