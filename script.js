
// Handle mobile view
document.addEventListener('DOMContentLoaded', function() {
  // Check if it's a mobile device
  const isMobile = window.innerWidth <= 576;
  
  // Add event listener for window resize
  window.addEventListener('resize', function() {
    const isMobileNow = window.innerWidth <= 576;
    if (isMobileNow !== isMobile) {
      // Refresh the page if switching between mobile and desktop
      // This ensures proper layout
      location.reload();
    }
  });
});


// Set current date
document.addEventListener('DOMContentLoaded', function() {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);

  setupEventListeners();
  updateTotals();

  // Check if there's a selected customer from the customers page
  const selectedCustomerId = localStorage.getItem('selectedCustomerId');
  if (selectedCustomerId) {
    loadCustomerDetails(selectedCustomerId);
    // Clear the selection after loading
    localStorage.removeItem('selectedCustomerId');
  }
});

// Function to load customer details from the customer database
function loadCustomerDetails(customerId) {
  const customers = JSON.parse(localStorage.getItem('customers')) || [];
  const customer = customers.find(c => c.id === customerId);

  if (customer) {
    // Populate the customer form
    document.getElementById('customer-name').value = customer.name || '';
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-address').value = customer.address || '';

    // Add a data attribute to store the customer ID
    document.getElementById('customer-name').dataset.customerId = customer.id;
  }
}

function setupEventListeners() {
  // Add service row
  document.getElementById('add-service').addEventListener('click', addServiceRow);

  // Delete service row
  document.addEventListener('click', function(event) {
    if (event.target.closest('.btn-delete')) {
      deleteServiceRow(event);
    }
  });

  // Update totals when prices change
  document.addEventListener('input', function(event) {
    if (event.target.classList.contains('price')) {
      updateTotals();
    }
  });

  // Generate Bill
  const generateBillBtn = document.getElementById('generate-bill');
  if (generateBillBtn) {
    generateBillBtn.addEventListener('click', generateBill);
  }

  // Load default service types from settings when creating a new service row
  document.addEventListener('click', function(event) {
    if (event.target.closest('#add-service')) {
      const settings = JSON.parse(localStorage.getItem('appSettings'));
      if (settings && settings.services && settings.services.length > 0) {
        const serviceRows = document.querySelectorAll('#service-items tr');
        const lastRow = serviceRows[serviceRows.length - 1];

        // If it's a new blank row, suggest values from settings
        const serviceType = lastRow.querySelector('.service-type');
        const garmentType = lastRow.querySelector('.garment-type');
        const price = lastRow.querySelector('.price');

        if (!serviceType.value && !garmentType.value && !price.value) {
          // Suggest the first service from settings
          const firstService = settings.services[0];
          serviceType.value = firstService.serviceType;
          garmentType.value = firstService.garment;
          price.value = firstService.price;
          updateTotals();
        }
      }
    }
  });

  // Save as Draft - ensure this is properly hooked up
  const saveDraftBtn = document.getElementById('save-draft');
  if (saveDraftBtn) {
    // Remove any existing event listeners to prevent duplicates
    saveDraftBtn.removeEventListener('click', saveAsDraft);
    // Add fresh event listener
    saveDraftBtn.addEventListener('click', saveAsDraft);
    
    // Add visual feedback on hover
    saveDraftBtn.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#f3f4f6';
    });
    saveDraftBtn.addEventListener('mouseout', function() {
      this.style.backgroundColor = '';
    });
  }

  // Close modals
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal') || 'invoice-modal';
      document.getElementById(modalId).style.display = 'none';
    });
  });

  // Click outside modal to close
  window.addEventListener('click', function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Print invoice
  document.getElementById('print-invoice').addEventListener('click', printInvoice);

  // Share via WhatsApp
  document.getElementById('share-whatsapp').addEventListener('click', shareViaWhatsApp);

  // Data management
  setupDataManagementEvents();
}

// Force re-initialize event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing event listeners for the Save as Draft button');
  setupEventListeners();
});

function setupDataManagementEvents() {
  // Add data management option to user profile menu
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', function() {
      document.getElementById('data-modal').style.display = 'flex';
      loadBackupsList();
    });
  }

  // Export data
  document.getElementById('export-data').addEventListener('click', exportDataToFile);

  // Import data button
  document.getElementById('import-data-btn').addEventListener('click', function() {
    document.getElementById('import-data-file').click();
  });

  // Import data file change
  document.getElementById('import-data-file').addEventListener('change', function() {
    importDataFromFile(this);
  });

  // Create backup button
  document.getElementById('create-backup').addEventListener('click', function() {
    backupData();
    loadBackupsList();
    customAlert('Backup created successfully!');
  });
}

function loadBackupsList() {
  const backupsList = document.getElementById('backup-list');
  const backups = JSON.parse(localStorage.getItem('backups')) || [];

  if (backups.length === 0) {
    backupsList.innerHTML = `
      <div class="no-backups" style="padding: 1rem; text-align: center;">
        <p>No automatic backups available yet</p>
      </div>
    `;
    return;
  }

  backupsList.innerHTML = '';

  // Sort backups by date (newest first)
  backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  backups.forEach((backup, index) => {
    const backupDate = new Date(backup.timestamp);
    const formattedDate = backupDate.toLocaleString();

    const backupItem = document.createElement('div');
    backupItem.className = 'backup-item';
    backupItem.innerHTML = `
      <div>
        <strong>Backup ${index + 1}</strong>
        <div>${formattedDate}</div>
      </div>
      <button class="btn btn-light restore-backup" data-index="${index}">Restore</button>
    `;

    backupsList.appendChild(backupItem);
  });

  // Add event listeners for restore buttons
  document.querySelectorAll('.restore-backup').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      if (confirm('This will restore your data to this backup point. Continue?')) {
        if (restoreFromBackup(index)) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    });
  });
}

function addServiceRow() {
  const tbody = document.getElementById('service-items');
  const newRow = document.createElement('tr');

  // Get services from storage
  const services = JSON.parse(localStorage.getItem('services')) || [];
  const serviceCategories = JSON.parse(localStorage.getItem('serviceCategories')) || ['Stitching', 'Alteration', 'Repair'];

  // Get unique garment types
  const garmentTypes = new Set();
  services.forEach(service => {
    garmentTypes.add(capitalizeFirstLetter(service.garment));
  });

  // If no garment types found in services, add default ones
  if (garmentTypes.size === 0) {
    ['Shirt', 'Pants', 'Suit', 'Dress'].forEach(garment => garmentTypes.add(garment));
  }

  // Create service type options
  const serviceOptions = serviceCategories.map(category => 
    `<option value="${category.toLowerCase()}">${category}</option>`
  ).join('');

  // Create garment type options
  const garmentOptions = Array.from(garmentTypes).map(garment => 
    `<option value="${garment.toLowerCase()}">${garment}</option>`
  ).join('');

  newRow.innerHTML = `
    <td>
      <select class="form-control service-type">
        <option value="">Select Service</option>
        ${serviceOptions}
      </select>
    </td>
    <td>
      <select class="form-control garment-type">
        <option value="">Select Garment</option>
        ${garmentOptions}
      </select>
    </td>
    <td>
      <input type="text" class="form-control measurement" placeholder="Notes">
    </td>
    <td>
      <input type="number" class="form-control price" placeholder="0.00">
    </td>
    <td>
      <button class="btn btn-icon btn-delete"><i class="fas fa-trash"></i></button>
    </td>
  `;

  tbody.appendChild(newRow);

  // Add event listeners for service and garment selection
  const serviceTypeSelect = newRow.querySelector('.service-type');
  const garmentTypeSelect = newRow.querySelector('.garment-type');
  const priceInput = newRow.querySelector('.price');

  // When both service type and garment type are selected, autofill price if available
  serviceTypeSelect.addEventListener('change', () => autoFillPrice(serviceTypeSelect, garmentTypeSelect, priceInput));
  garmentTypeSelect.addEventListener('change', () => autoFillPrice(serviceTypeSelect, garmentTypeSelect, priceInput));
}

function autoFillPrice(serviceTypeSelect, garmentTypeSelect, priceInput) {
  const serviceType = serviceTypeSelect.value;
  const garmentType = garmentTypeSelect.value;

  if (serviceType && garmentType) {
    // Get services from storage
    const services = JSON.parse(localStorage.getItem('services')) || [];

    // Find matching service
    const matchingService = services.find(service => 
      service.serviceType.toLowerCase() === serviceType.toLowerCase() && 
      service.garment.toLowerCase() === garmentType.toLowerCase()
    );

    // If matching service found, set the price
    if (matchingService) {
      priceInput.value = matchingService.price;
      updateTotals();
    }
  }
}

function deleteServiceRow(event) {
  const row = event.target.closest('tr');
  // Ensure we don't delete the last row
  const tbody = document.getElementById('service-items');
  if (tbody.children.length > 1) {
    row.remove();
  } else {
    // Clear inputs instead of removing
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.value = '';
    });
  }
  updateTotals();
}

function updateTotals() {
  const prices = document.querySelectorAll('.price');
  let subtotal = 0;

  prices.forEach(priceInput => {
    const price = parseFloat(priceInput.value) || 0;
    subtotal += price;
  });

  // Get tax rate from settings if available
  const settings = JSON.parse(localStorage.getItem('appSettings'));
  const taxRate = (settings?.invoice?.taxRate || 10) / 100; // Convert percentage to decimal

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
  document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

function generateBill() {
  // Get customer details
  const customerName = document.getElementById('customer-name').value;
  const customerPhone = document.getElementById('customer-phone').value;
  const customerEmail = document.getElementById('customer-email').value;
  const customerAddress = document.getElementById('customer-address').value;

  // Get service items
  const serviceRows = document.querySelectorAll('#service-items tr');
  const services = [];

  serviceRows.forEach(row => {
    const serviceType = row.querySelector('.service-type').value;
    const garmentType = row.querySelector('.garment-type').value;
    const measurement = row.querySelector('.measurement').value;
    const price = row.querySelector('.price').value;

    if (serviceType && garmentType && price) {
      services.push({
        service: serviceType,
        garment: garmentType,
        measurement: measurement,
        price: parseFloat(price)
      });
    }
  });

  // Get payment method
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  // Get payment status
  const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;

  // Get totals
  const subtotal = document.getElementById('subtotal').textContent;
  const tax = document.getElementById('tax').textContent;
  const total = document.getElementById('total').textContent;

  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber();
  document.getElementById('invoice-number').textContent = invoiceNumber;

  // Get customer ID if available
  const customerId = document.getElementById('customer-name').dataset.customerId || null;

  // Save invoice to local storage
  const invoiceData = {
    invoiceNumber: invoiceNumber,
    date: new Date().toISOString(),
    customer: {
      id: customerId,
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress
    },
    services: services,
    payment: {
      method: paymentMethod,
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: paymentStatus
    },
    status: paymentStatus, //Updated status
    deliveryDate: getExpectedDeliveryDate()
  };

  // Get existing invoices or initialize empty array
  const existingInvoices = JSON.parse(localStorage.getItem('invoices')) || [];
  // Add new invoice
  existingInvoices.push(invoiceData);
  // Save back to localStorage
  localStorage.setItem('invoices', JSON.stringify(existingInvoices));

  // Get business settings
  const settings = JSON.parse(localStorage.getItem('appSettings')) || {
    business: {
      name: 'Om Sai Tailors',
      address: 'Behind Dnyanganga Jr. College,\nBaburao Nagar, Shirur',
      phone: '',
      email: '',
      tagline: 'Premium Tailoring Services'
    },
    invoice: {
      notes: 'Thank you for your business!',
      terms: 'Payment is due upon completion of service. Alterations must be claimed within 30 days.'
    }
  };

  // Format address into lines
  const addressLines = settings.business.address.split('\n');

  // Create invoice HTML
  const invoiceHTML = `
    <div class="invoice">
      <div class="invoice-header">
        <div class="invoice-brand">
          <h2><i class="fas fa-scissors"></i> ${settings.business.name}</h2>
          <p>${settings.business.tagline}</p>
        </div>
        <div class="invoice-info">
          <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div class="invoice-addresses">
        <div class="company-address">
          <h4>From</h4>
          <p>${settings.business.name}</p>
          ${addressLines.map(line => `<p>${line}</p>`).join('')}
          ${settings.business.phone ? `<p>Phone: ${settings.business.phone}</p>` : ''}
          ${settings.business.email ? `<p>Email: ${settings.business.email}</p>` : ''}
        </div>

        <div class="customer-address">
          <h4>Bill To</h4>
          <p>${customerName || 'N/A'}</p>
          <p>Phone: ${customerPhone || 'N/A'}</p>
          <p>Email: ${customerEmail || 'N/A'}</p>
          <p>${customerAddress || 'N/A'}</p>
        </div>
      </div>

      <table class="invoice-items">
        <thead>
          <tr>
            <th>Service</th>
            <th>Garment</th>
            <th>Measurement/Notes</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${services.map(service => `
            <tr>
              <td>${capitalizeFirstLetter(service.service)}</td>
              <td>${capitalizeFirstLetter(service.garment)}</td>
              <td>${service.measurement || 'N/A'}</td>
              <td>₹${service.price.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-summary">
        <div class="payment-info">
          <h4>Payment Method</h4>
          <p>${capitalizeFirstLetter(paymentMethod)}</p>

          <div class="delivery-info">
            <h4>Expected Delivery</h4>
            <p>${getExpectedDeliveryDate()}</p>
          </div>
        </div>

        <div class="invoice-totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${subtotal}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>${tax}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>${total}</span>
          </div>
        </div>
      </div>

      <div class="invoice-footer">
        <p>${settings.invoice.notes}</p>
        <p class="terms">Terms & Conditions: ${settings.invoice.terms}</p>
      </div>
    </div>
  `;

  // Add invoice HTML to modal
  document.getElementById('invoice-preview').innerHTML = invoiceHTML;

  // Show modal
  document.getElementById('invoice-modal').style.display = 'flex';
}

function saveAsDraft() {
    // Get all the necessary data like generateBill()
    //Instead of pushing to existingInvoices, save it to a separate drafts array.
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerAddress = document.getElementById('customer-address').value;

    const serviceRows = document.querySelectorAll('#service-items tr');
    const services = [];
    serviceRows.forEach(row => {
        const serviceType = row.querySelector('.service-type').value;
        const garmentType = row.querySelector('.garment-type').value;
        const measurement = row.querySelector('.measurement').value;
        const price = row.querySelector('.price').value;
        if (serviceType && garmentType && price) {
            services.push({
                service: serviceType,
                garment: garmentType,
                measurement: measurement,
                price: parseFloat(price)
            });
        }
    });

    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;

    const subtotal = document.getElementById('subtotal').textContent;
    const tax = document.getElementById('tax').textContent;
    const total = document.getElementById('total').textContent;
    const invoiceNumber = generateInvoiceNumber();

    const customerId = document.getElementById('customer-name').dataset.customerId || null;

    const invoiceData = {
        invoiceNumber: invoiceNumber,
        date: new Date().toISOString(),
        customer: {
            id: customerId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress
        },
        services: services,
        payment: {
            method: paymentMethod,
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: paymentStatus
        },
        status: 'draft', // Set status as draft explicitly
        deliveryDate: getExpectedDeliveryDate()
    };

    // Get existing invoices to include this as a draft in the same array
    const existingInvoices = JSON.parse(localStorage.getItem('invoices')) || [];
    invoiceData.isDraft = true; // Add a flag to identify it as a draft
    existingInvoices.push(invoiceData);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));
    
    // Also save in drafts array for backward compatibility
    const existingDrafts = JSON.parse(localStorage.getItem('drafts')) || [];
    existingDrafts.push(invoiceData);
    localStorage.setItem('drafts', JSON.stringify(existingDrafts));
    
    // Create a backup after saving
    backupData();
    
    customAlert('Draft saved successfully!');
    
    // Reset form or provide feedback
    setTimeout(() => {
        if (confirm('Draft saved successfully! Would you like to create another invoice?')) {
            resetForm();
        }
    }, 500);
}

function resetForm() {
    // Clear all form fields
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-email').value = '';
    document.getElementById('customer-address').value = '';
    
    // Clear service items except the first row
    const serviceRows = document.querySelectorAll('#service-items tr');
    if (serviceRows.length > 0) {
        // Clear first row
        const firstRow = serviceRows[0];
        firstRow.querySelector('.service-type').value = '';
        firstRow.querySelector('.garment-type').value = '';
        firstRow.querySelector('.measurement').value = '';
        firstRow.querySelector('.price').value = '';
        
        // Remove additional rows
        for (let i = 1; i < serviceRows.length; i++) {
            serviceRows[i].remove();
        }
    }
    
    // Reset totals
    updateTotals();
}


function generateInvoiceNumber() {
  // Get settings if available
  const settings = JSON.parse(localStorage.getItem('appSettings'));
  const prefix = settings?.invoice?.prefix || '';

  // Generate a simple invoice number format: Prefix + Year + Month + Random 4 digits
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}${year}${month}-${random}`;
}

function getExpectedDeliveryDate() {
  // Get settings if available
  const settings = JSON.parse(localStorage.getItem('appSettings'));
  const deliveryDays = settings?.invoice?.deliveryDays || 5;

  // Calculate delivery date based on settings
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + deliveryDays);

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return deliveryDate.toLocaleDateString('en-US', options);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add custom CSS to the modal invoice
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .invoice {
      font-family: 'Poppins', sans-serif;
      color: var(--text-color);
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .invoice-brand h2 {
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }

    .invoice-addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .company-address, .customer-address {
      width: 48%;
    }

    .invoice-addresses h4 {
      font-size: 1rem;
      margin-bottom: 0.5rem;
      color: var(--text-light);
    }

    .invoice-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }

    .invoice-items th {
      background-color: var(--background-color);
      padding: 0.75rem;
      text-align: left;
    }

    .invoice-items td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .invoice-summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .payment-info, .invoice-totals {
      width: 48%;
    }

    .delivery-info {
      margin-top: 1rem;
    }

    .invoice-totals {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .grand-total {
      font-weight: 600;
      font-size: 1.125rem;
      border-top: 1px solid var(--border-color);
      padding-top: 0.5rem;
      margin-top: 0.5rem;
    }

    .invoice-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .terms {
      font-size: 0.75rem;
      color: var(--text-light);
      margin-top: 0.5rem;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #invoice-preview, #invoice-preview * {
        visibility: visible;
      }
      #invoice-preview {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 20px;
        background-color: white !important;
        color: black !important;
      }
      .modal-header, .modal-footer {
        display: none !important;
      }
      .invoice-items th {
        background-color: #f3f4f6 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice {
        overflow: visible !important;
      }
    }
  </style>
`);

// Function to print the invoice
function printInvoice() {
  // Prepare invoice for printing
  const invoiceElement = document.querySelector('.invoice');
  if (invoiceElement) {
    // Add temporary styles to ensure the invoice fits on the page
    invoiceElement.style.overflow = 'visible';

    // Print the invoice
    setTimeout(() => {
      window.print();

      // Reset styles after printing
      setTimeout(() => {
        invoiceElement.style.overflow = '';
      }, 500);
    }, 100);
  } else {
    window.print();
  }
}

// Function to share invoice via WhatsApp as image
function shareViaWhatsApp() {
  const customerPhone = document.getElementById('customer-phone').value;

  if (!customerPhone) {
    customAlert('Please enter a customer phone number to share via WhatsApp.');
    return;
  }

  // Show loading indicator
  const shareBtn = document.getElementById('share-whatsapp');
  const originalBtnText = shareBtn.innerHTML;
  shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  shareBtn.disabled = true;

  // Get invoice element
  const invoiceElement = document.querySelector('.invoice');

  // Format phone number (remove any non-numeric characters)
  let phone = customerPhone.replace(/\D/g, '');
  // If it doesn't start with +, add country code (assuming India +91)
  if (!phone.startsWith('+')) {
    // Check if it already has country code
    if (!phone.startsWith('91')) {
      phone = '91' + phone;
    }
  }

  // Add padding to invoice element temporarily for better capture
  invoiceElement.style.padding = "20px";

  // Use html2canvas to convert the invoice to an image
  html2canvas(invoiceElement, {
    scale: 2, // Higher scale for better quality
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    width: invoiceElement.offsetWidth + 40, // Add extra width
    height: invoiceElement.offsetHeight + 40, // Add extra height
    x: -20, // Negative offset to capture full width
    y: -20, // Negative offset to capture full height
  }).then(canvas => {
    // Reset padding after capture
    invoiceElement.style.padding = "";
    // Convert canvas to blob
    canvas.toBlob(blob => {
      // Create a message for WhatsApp
      const invoiceNumber = document.getElementById('invoice-number').textContent;
      const customerName = document.getElementById('customer-name').value || 'Customer';

      const message = `*Invoice #${invoiceNumber}*\nDear ${customerName}, please find your tailoring bill attached. Thank you for choosing Om Sai Tailors!`;

      // Create FormData and append the blob as a file
      const formData = new FormData();
      formData.append('file', blob, 'tailoring-invoice.png');
      formData.append('caption', message);

      // Use WhatsApp API to share the image
      // Direct link method (works on mobile but may not work on all browsers)
      const imageUrl = URL.createObjectURL(blob);

      // Create a temporary link to download the image
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `Invoice-${invoiceNumber}.png`;
      document.body.appendChild(a);

      // Trigger download
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(imageUrl);

      // Inform the user to share the downloaded image
      customAlert('The invoice image has been downloaded. Please share it manually via WhatsApp with your customer.');

      // Alternatively, try to open WhatsApp with a message prompting to attach the image
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Please find the attached tailoring invoice image.')}`;
      window.open(whatsappUrl, '_blank');

      // Reset button
      shareBtn.innerHTML = originalBtnText;
      shareBtn.disabled = false;

    }, 'image/png', 0.9);
  }).catch(error => {
    console.error('Error generating invoice image:', error);
    customAlert('There was an error generating the invoice image. Please try again.');

    // Reset button
    shareBtn.innerHTML = originalBtnText;
    shareBtn.disabled = false;
  });
}

// Function to automatically backup the data
function backupData() {
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const customers = JSON.parse(localStorage.getItem('customers')) || [];

  // Create a backup object with timestamp
  const backup = {
    timestamp: new Date().toISOString(),
    invoices: invoices,
    customers: customers
  };

  // Store as a versioned backup
  try {
    const existingBackups = JSON.parse(localStorage.getItem('backups')) || [];
    // Keep only the last 5 backups to save space
    if (existingBackups.length >= 5) {
      existingBackups.shift(); // Remove oldest backup
    }
    existingBackups.push(backup);
    localStorage.setItem('backups', JSON.stringify(existingBackups));
    console.log('Data backup created successfully.');
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

// Function to restore data from backup
function restoreFromBackup(backupIndex = -1) {
  try {
    const backups = JSON.parse(localStorage.getItem('backups')) || [];

    if (backups.length === 0) {
      customAlert('No backups available to restore from.');
      return false;
    }

    // If no specific backup index provided, use the most recent one
    const backupToRestore = backupIndex >= 0 && backupIndex < backups.length 
      ? backups[backupIndex] 
      : backups[backups.length - 1];

    // Restore data
    if (backupToRestore.invoices) {
      localStorage.setItem('invoices', JSON.stringify(backupToRestore.invoices));
    }

    if (backupToRestore.customers) {
      localStorage.setItem('customers', JSON.stringify(backupToRestore.customers));
    }

    customAlert(`Data restored successfully from backup created on ${new Date(backupToRestore.timestamp).toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    customAlert('Failed to restore data from backup.');
    return false;
  }
}

// Export data to file for additional backup
function exportDataToFile() {
  try {
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const customers = JSON.parse(localStorage.getItem('customers')) || [];

    const dataToExport = {
      invoices: invoices,
      customers: customers,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `om-sai-tailors-data-${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  } catch (error) {
    console.error('Error exporting data:', error);
    customAlert('Failed to export data to file.');
  }
}

// Import data from file
function importDataFromFile(fileInput) {
  const file = fileInput.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (confirm('This will overwrite your current data. Continue?')) {
        if (importedData.invoices) {
          localStorage.setItem('invoices', JSON.stringify(importedData.invoices));
        }

        if (importedData.customers) {
          localStorage.setItem('customers', JSON.stringify(importedData.customers));
        }

        customAlert('Data imported successfully. The page will now reload.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      customAlert('Failed to import data. The file might be corrupted or in incorrect format.');
    }
  };
  reader.readAsText(file);
}

// Create a backup on page load
document.addEventListener('DOMContentLoaded', function() {
  // Create backup when page loads
  backupData();

  // Set up automatic backups every 5 minutes
  setInterval(backupData, 5 * 60 * 1000);
});

function customAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  alertBox.innerHTML = `<p>${message}</p><button class="close-alert">OK</button>`;
  document.body.appendChild(alertBox);

  const closeButton = alertBox.querySelector('.close-alert');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(alertBox);
  });
}