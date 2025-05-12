// Initialize the page when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadInvoiceHistory();
  setupEventListeners();
});

function setupEventListeners() {
  // Search functionality
  document.getElementById('history-search').addEventListener('input', filterInvoices);

  // Filter dropdown changes
  document.getElementById('filter-status').addEventListener('change', filterInvoices);
  document.getElementById('filter-date').addEventListener('change', filterInvoices);

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

  // Delete invoice
  document.getElementById('delete-invoice').addEventListener('click', deleteInvoice);
}

function loadInvoiceHistory() {
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const tableBody = document.getElementById('invoice-history');
  const noInvoicesMessage = document.getElementById('no-invoices-message');
  const historyTable = document.getElementById('invoice-history-table');

  // Clear existing rows
  tableBody.innerHTML = '';

  if (invoices.length === 0) {
    // Show no invoices message
    noInvoicesMessage.style.display = 'flex';
    historyTable.style.display = 'none';
    return;
  }

  // Hide no invoices message, show table
  noInvoicesMessage.style.display = 'none';
  historyTable.style.display = 'table';

  // Sort invoices by date (newest first)
  invoices.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Add rows to table
  invoices.forEach(invoice => {
    const row = document.createElement('tr');
    row.setAttribute('data-invoice-id', invoice.invoiceNumber);

    // Format date
    const invoiceDate = new Date(invoice.date);
    const formattedDate = invoiceDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    // Create status badge class based on status
    const statusClass = getStatusClass(invoice.status);

    row.innerHTML = `
      <td>${invoice.invoiceNumber}</td>
      <td>${formattedDate}</td>
      <td>${invoice.customer.name || 'N/A'}</td>
      <td>₹${parseFloat(invoice.payment.total.replace(/[^\d.-]/g, '')).toFixed(2)}</td>
      <td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(invoice.status)}</span></td>
      <td class="actions">
        <button class="btn btn-icon btn-light view-invoice" data-invoice="${invoice.invoiceNumber}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-icon btn-light print-invoice" data-invoice="${invoice.invoiceNumber}">
          <i class="fas fa-print"></i>
        </button>
        <button class="btn btn-icon btn-light share-invoice" data-invoice="${invoice.invoiceNumber}">
          <i class="fab fa-whatsapp"></i>
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.view-invoice').forEach(button => {
    button.addEventListener('click', function() {
      const invoiceId = this.getAttribute('data-invoice');
      viewInvoice(invoiceId);
    });
  });

  document.querySelectorAll('.print-invoice').forEach(button => {
    button.addEventListener('click', function() {
      const invoiceId = this.getAttribute('data-invoice');
      viewInvoice(invoiceId, 'print');
    });
  });

  document.querySelectorAll('.share-invoice').forEach(button => {
    button.addEventListener('click', function() {
      const invoiceId = this.getAttribute('data-invoice');
      viewInvoice(invoiceId, 'share');
    });
  });
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

// Add function to check if an invoice is a draft
function isDraft(invoice) {
  return invoice.status === 'draft' || invoice.isDraft === true;
}

function filterInvoices() {
  const searchTerm = document.getElementById('history-search').value.toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  const dateFilter = document.getElementById('filter-date').value;

  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  let filteredInvoices = [...invoices];

  // Apply search filter
  if (searchTerm) {
    filteredInvoices = filteredInvoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
      (invoice.customer.name && invoice.customer.name.toLowerCase().includes(searchTerm)) ||
      (invoice.customer.phone && invoice.customer.phone.includes(searchTerm))
    );
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter(invoice => 
      invoice.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }

  // Apply date filter
  if (dateFilter !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filterDate = new Date();
    filterDate.setHours(0, 0, 0, 0);

    switch(dateFilter) {
      case 'today':
        // Already set up
        break;

      case 'week':
        // Start of current week (Sunday)
        filterDate.setDate(today.getDate() - today.getDay());
        break;

      case 'month':
        // Start of current month
        filterDate.setDate(1);
        break;

      case 'year':
        // Start of current year
        filterDate.setMonth(0, 1);
        break;
    }

    filteredInvoices = filteredInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= filterDate;
    });
  }

  // Re-render table with filtered invoices
  renderFilteredInvoices(filteredInvoices);
}

function renderFilteredInvoices(filteredInvoices) {
  // Save original invoices temporarily
  const originalInvoices = JSON.parse(localStorage.getItem('invoices')) || [];

  // Replace invoices with filtered list for rendering
  localStorage.setItem('invoices', JSON.stringify(filteredInvoices));

  // Load the filtered view
  loadInvoiceHistory();

  // Restore original invoices
  localStorage.setItem('invoices', JSON.stringify(originalInvoices));
}

function viewInvoice(invoiceId, action = null) {
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const invoice = invoices.find(inv => inv.invoiceNumber === invoiceId);

  if (!invoice) {
    alert('Invoice not found!');
    return;
  }

  // Set the invoice number in the modal
  document.getElementById('invoice-number').textContent = invoice.invoiceNumber;

  // Format date for display
  const invoiceDate = new Date(invoice.date);
  const formattedDate = invoiceDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Generate invoice HTML - to match exactly with the new bill format
  const invoiceHTML = `
    <div class="invoice">
      <div class="invoice-header">
        <div class="invoice-brand">
          <h2><i class="fas fa-scissors"></i> Om Sai Tailors</h2>
          <p>Premium Tailoring Services</p>
        </div>
        <div class="invoice-info">
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
        </div>
      </div>

      <div class="invoice-addresses">
        <div class="company-address">
          <h4>From</h4>
          <p>Om Sai Tailors</p>
          <p>Behind Dnyanganga Jr. College,</p>
          <p>Baburao Nagar, Shirur</p>
          <p></p>
        </div>

        <div class="customer-address">
          <h4>Bill To</h4>
          <p>${invoice.customer.name || 'N/A'}</p>
          <p>Phone: ${invoice.customer.phone || 'N/A'}</p>
          <p>Email: ${invoice.customer.email || 'N/A'}</p>
          <p>${invoice.customer.address || 'N/A'}</p>
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
          ${invoice.services.map(service => `
            <tr>
              <td>${capitalizeFirstLetter(service.service)}</td>
              <td>${capitalizeFirstLetter(service.garment)}</td>
              <td>${service.measurement || 'N/A'}</td>
              <td>₹${parseFloat(service.price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-summary">
        <div class="payment-info">
          <h4>Payment Method</h4>
          <p>${capitalizeFirstLetter(invoice.payment.method)}</p>

          <div class="delivery-info">
            <h4>Expected Delivery</h4>
            <p>${invoice.deliveryDate}</p>
          </div>
        </div>

        <div class="invoice-totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${invoice.payment.subtotal}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>${invoice.payment.tax}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>${invoice.payment.total}</span>
          </div>
        </div>
      </div>

      <div class="invoice-footer">
        <p>Thank you for your business!</p>
        <p class="terms">Terms & Conditions: Payment is due upon completion of service. Alterations must be claimed within 30 days.</p>
      </div>
    </div>
  `;

  // Add invoice HTML to modal
  document.getElementById('invoice-preview').innerHTML = invoiceHTML;

  // Show modal
  document.getElementById('invoice-modal').style.display = 'flex';

  // If an action was specified (print or share), perform it
  if (action === 'print') {
    setTimeout(() => {
      printInvoice();
    }, 500);
  } else if (action === 'share') {
    setTimeout(() => {
      shareViaWhatsApp();
    }, 500);
  }

  // Mark the currently viewed invoice
  currentInvoiceId = invoiceId;
}

// Variable to track the currently viewed invoice
let currentInvoiceId = null;

function deleteInvoice() {
  if (!currentInvoiceId) return;

  if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const updatedInvoices = invoices.filter(inv => inv.invoiceNumber !== currentInvoiceId);

    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    // Close modal
    document.getElementById('invoice-modal').style.display = 'none';

    // Reload invoice list
    loadInvoiceHistory();

    // Reset current invoice
    currentInvoiceId = null;
  }
}

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

function shareViaWhatsApp() {
  if (!currentInvoiceId) return;

  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const invoice = invoices.find(inv => inv.invoiceNumber === currentInvoiceId);

  if (!invoice || !invoice.customer.phone) {
    alert('Customer phone number is required to share via WhatsApp.');
    return;
  }

  // Show loading indicator
  const shareBtn = document.getElementById('share-whatsapp');
  const originalBtnText = shareBtn.innerHTML;
  shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  shareBtn.disabled = true;

  // Format phone number (remove any non-numeric characters)
  let phone = invoice.customer.phone.replace(/\D/g, '');
  // If it doesn't start with +, add country code (assuming India +91)
  if (!phone.startsWith('+')) {
    // Check if it already has country code
    if (!phone.startsWith('91')) {
      phone = '91' + phone;
    }
  }

  // Get invoice element
  const invoiceElement = document.querySelector('.invoice');

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
      const customerName = invoice.customer.name || 'Customer';

      const message = `*Invoice #${invoice.invoiceNumber}*\nDear ${customerName}, please find your tailoring bill attached. Thank you for choosing Stitch & Bill Tailoring!`;

      // Create image URL
      const imageUrl = URL.createObjectURL(blob);

      // Create a temporary link to download the image
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `Invoice-${invoice.invoiceNumber}.png`;
      document.body.appendChild(a);

      // Trigger download
      a.click();

      // Clean up
      document.body.removeChild(a);

// Data Management Functions
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

function restoreFromBackup(backupIndex = -1) {
  try {
    const backups = JSON.parse(localStorage.getItem('backups')) || [];

    if (backups.length === 0) {
      alert('No backups available to restore from.');
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

    alert(`Data restored successfully from backup created on ${new Date(backupToRestore.timestamp).toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    alert('Failed to restore data from backup.');
    return false;
  }
}

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
    alert('Failed to export data to file.');
  }
}

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

        alert('Data imported successfully. The page will now reload.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. The file might be corrupted or in incorrect format.');
    }
  };
  reader.readAsText(file);
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

// Setup data management when document loads
document.addEventListener('DOMContentLoaded', function() {
  // Create backup when page loads
  backupData();

  // Add data management option to user profile menu
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    userProfile.addEventListener('click', function() {
      document.getElementById('data-modal').style.display = 'flex';
      loadBackupsList();
    });
  }

  // Export data
  document.getElementById('export-data')?.addEventListener('click', exportDataToFile);

  // Import data button
  document.getElementById('import-data-btn')?.addEventListener('click', function() {
    document.getElementById('import-data-file').click();
  });

  // Import data file change
  document.getElementById('import-data-file')?.addEventListener('change', function() {
    importDataFromFile(this);
  });

  // Create backup button
  document.getElementById('create-backup')?.addEventListener('click', function() {
    backupData();
    loadBackupsList();
    alert('Backup created successfully!');
  });
});

      URL.revokeObjectURL(imageUrl);

      // Inform the user to share the downloaded image
      alert('The invoice image has been downloaded. Please share it manually via WhatsApp with your customer.');

      // Alternatively, try to open WhatsApp with a message prompting to attach the image
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Please find the attached tailoring invoice image.')}`;
      window.open(whatsappUrl, '_blank');

      // Reset button
      shareBtn.innerHTML = originalBtnText;
      shareBtn.disabled = false;

    }, 'image/png', 0.9);
  }).catch(error => {
    console.error('Error generating invoice image:', error);
    alert('There was an error generating the invoice image. Please try again.');

    // Reset button
    shareBtn.innerHTML = originalBtnText;
    shareBtn.disabled = false;
  });
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add styles for the history page
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .filter-options {
      display: flex;
      gap: 1rem;
    }

    .history-container {
      overflow-x: auto;
    }

    .invoice-history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .invoice-history-table th,
    .invoice-history-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .invoice-history-table th {
      font-weight: 600;
      color: var(--text-light);
    }

    .actions {
      display: flex;
      gap: 0.5rem;
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

    .no-invoices {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-light);
    }

    .no-invoices i {
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-invoices h3 {
      margin-bottom: 0.5rem;
    }

    .no-invoices p {
      margin-bottom: 1.5rem;
    }

    /* Invoice styles to match exactly with new bill */
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

function viewInvoiceDetails(invoiceId) {
  // Get invoice data
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const invoice = invoices.find(inv => inv.invoiceNumber === invoiceId);

  if (!invoice) {
    alert('Invoice not found.');
    return;
  }

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

  // Display invoice number
  document.getElementById('invoice-number').textContent = invoice.invoiceNumber;
}