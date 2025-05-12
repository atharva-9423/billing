
// Settings page functionality
document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  setupEventListeners();
});

// Default settings
const defaultSettings = {
  business: {
    name: 'Om Sai Tailors',
    address: 'Behind Dnyanganga Jr. College,\nBaburao Nagar, Shirur',
    phone: '',
    email: '',
    tagline: 'Premium Tailoring Services'
  },
  invoice: {
    prefix: '',
    taxRate: 10,
    deliveryDays: 5,
    notes: 'Thank you for your business!',
    terms: 'Payment is due upon completion of service. Alterations must be claimed within 30 days.'
  },
  services: [
    { serviceType: 'Stitching', garment: 'Shirt', price: 350 },
    { serviceType: 'Stitching', garment: 'Pants', price: 450 },
    { serviceType: 'Alteration', garment: 'Any', price: 150 }
  ]
};

function loadSettings() {
  // Load settings from localStorage or use defaults
  const settings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;
  
  // Populate business information
  document.getElementById('business-name').value = settings.business.name || '';
  document.getElementById('business-address').value = settings.business.address || '';
  document.getElementById('business-phone').value = settings.business.phone || '';
  document.getElementById('business-email').value = settings.business.email || '';
  document.getElementById('business-tagline').value = settings.business.tagline || '';
  
  // Populate invoice preferences
  document.getElementById('invoice-prefix').value = settings.invoice.prefix || '';
  document.getElementById('tax-rate').value = settings.invoice.taxRate || 10;
  document.getElementById('delivery-days').value = settings.invoice.deliveryDays || 5;
  document.getElementById('invoice-notes').value = settings.invoice.notes || '';
  document.getElementById('invoice-terms').value = settings.invoice.terms || '';
  
  // Populate services
  const servicesList = document.getElementById('services-list');
  servicesList.innerHTML = ''; // Clear existing services
  
  if (settings.services && settings.services.length > 0) {
    settings.services.forEach(service => {
      addServiceRow(service.serviceType, service.garment, service.price);
    });
  } else {
    // Add default service if none exist
    addServiceRow('', '', '');
  }
}

function addServiceRow(serviceType = '', garment = '', price = '') {
  const servicesList = document.getElementById('services-list');
  const newRow = document.createElement('tr');
  
  newRow.innerHTML = `
    <td>
      <input type="text" class="form-control service-type" value="${serviceType}">
    </td>
    <td>
      <input type="text" class="form-control garment-type" value="${garment}">
    </td>
    <td>
      <input type="number" class="form-control price" value="${price}">
    </td>
    <td>
      <button class="btn btn-icon btn-delete"><i class="fas fa-trash"></i></button>
    </td>
  `;
  
  servicesList.appendChild(newRow);
}

function deleteServiceRow(event) {
  const row = event.target.closest('tr');
  const servicesList = document.getElementById('services-list');
  
  // Ensure we don't delete the last row
  if (servicesList.children.length > 1) {
    row.remove();
  } else {
    // Clear inputs instead of removing the last row
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
  }
}

function saveSettings() {
  // Collect business information
  const business = {
    name: document.getElementById('business-name').value,
    address: document.getElementById('business-address').value,
    phone: document.getElementById('business-phone').value,
    email: document.getElementById('business-email').value,
    tagline: document.getElementById('business-tagline').value
  };
  
  // Collect invoice preferences
  const invoice = {
    prefix: document.getElementById('invoice-prefix').value,
    taxRate: parseFloat(document.getElementById('tax-rate').value) || 10,
    deliveryDays: parseInt(document.getElementById('delivery-days').value) || 5,
    notes: document.getElementById('invoice-notes').value,
    terms: document.getElementById('invoice-terms').value
  };
  
  // Collect services
  const services = [];
  const serviceRows = document.querySelectorAll('#services-list tr');
  
  serviceRows.forEach(row => {
    const serviceType = row.querySelector('.service-type').value;
    const garment = row.querySelector('.garment-type').value;
    const price = parseFloat(row.querySelector('.price').value) || 0;
    
    if (serviceType && garment) {
      services.push({
        serviceType: serviceType,
        garment: garment,
        price: price
      });
    }
  });
  
  // Save to localStorage
  const settings = {
    business: business,
    invoice: invoice,
    services: services
  };
  
  localStorage.setItem('appSettings', JSON.stringify(settings));
  
  // Create backup of all data
  backupData();
  
  // Show success message
  alert('Settings saved successfully!');
}

function setupEventListeners() {
  // Add service
  document.getElementById('add-service').addEventListener('click', () => {
    addServiceRow();
  });
  
  // Delete service
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-delete') && e.target.closest('#services-list')) {
      deleteServiceRow(e);
    }
  });
  
  // Save settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Cancel settings
  document.getElementById('cancel-settings').addEventListener('click', () => {
    if (confirm('Discard changes and reload settings?')) {
      loadSettings();
    }
  });
  
  // Data management
  setupDataManagement();
}

function setupDataManagement() {
  // Export data
  document.getElementById('export-data').addEventListener('click', exportData);
  
  // Import data button
  document.getElementById('import-data-btn').addEventListener('click', () => {
    document.getElementById('import-data-file').click();
  });
  
  // Import data file change
  document.getElementById('import-data-file').addEventListener('change', function() {
    importData(this);
  });
  
  // Clear drafts
  document.getElementById('clear-drafts').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all draft invoices? This cannot be undone.')) {
      localStorage.removeItem('drafts');
      alert('All drafts have been cleared.');
    }
  });
  
  // Clear invoice history
  document.getElementById('clear-history').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire invoice history? This cannot be undone.')) {
      localStorage.removeItem('invoices');
      alert('Invoice history has been cleared.');
    }
  });
  
  // Clear customers
  document.getElementById('clear-customers').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all customer data? This cannot be undone.')) {
      localStorage.removeItem('customers');
      alert('All customer data has been cleared.');
    }
  });
  
  // Reset application
  document.getElementById('reset-app').addEventListener('click', () => {
    if (confirm('WARNING: This will reset the entire application and delete ALL data. This action cannot be undone. Continue?')) {
      // Create a final backup before resetting
      exportDataToFile(true);
      
      // Clear all app data
      localStorage.removeItem('invoices');
      localStorage.removeItem('customers');
      localStorage.removeItem('drafts');
      localStorage.removeItem('appSettings');
      localStorage.removeItem('backups');
      
      alert('Application has been reset to factory defaults. A backup of your data has been downloaded.');
      
      // Reload page
      window.location.reload();
    }
  });
}

function exportData() {
  exportDataToFile();
}

function exportDataToFile(isBackup = false) {
  try {
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const drafts = JSON.parse(localStorage.getItem('drafts')) || [];
    const settings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;
    
    const dataToExport = {
      invoices: invoices,
      customers: customers,
      drafts: drafts,
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = isBackup ? 
      `om-sai-tailors-backup-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json` :
      `om-sai-tailors-data-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    linkElement.remove();
    
    if (!isBackup) {
      alert('Data exported successfully.');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data: ' + error.message);
  }
}

function importData(fileInput) {
  const file = fileInput.files[0];
  if (!file) {
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      if (confirm('This will override your current data. Continue?')) {
        if (importedData.invoices) {
          localStorage.setItem('invoices', JSON.stringify(importedData.invoices));
        }
        
        if (importedData.customers) {
          localStorage.setItem('customers', JSON.stringify(importedData.customers));
        }
        
        if (importedData.drafts) {
          localStorage.setItem('drafts', JSON.stringify(importedData.drafts));
        }
        
        if (importedData.settings) {
          localStorage.setItem('appSettings', JSON.stringify(importedData.settings));
        }
        
        alert('Data imported successfully. The page will now reload.');
        
        // Create a backup of the imported data
        backupData();
        
        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. The file might be corrupted or in an incorrect format.');
    }
  };
  reader.readAsText(file);
}

function backupData() {
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const customers = JSON.parse(localStorage.getItem('customers')) || [];
  const drafts = JSON.parse(localStorage.getItem('drafts')) || [];
  const settings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;
  
  // Create a backup object with timestamp
  const backup = {
    timestamp: new Date().toISOString(),
    invoices: invoices,
    customers: customers,
    drafts: drafts,
    settings: settings
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

// Add styles for the settings page
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .settings-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    
    .business-settings,
    .invoice-settings {
      grid-column: span 1;
    }
    
    .services-settings,
    .data-settings {
      grid-column: 1 / -1;
    }
    
    .settings-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    
    .settings-table th,
    .settings-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .settings-table th {
      font-weight: 600;
      color: var(--text-light);
    }
    
    .danger-zone {
      background-color: #fee2e2;
      border-radius: var(--border-radius);
      padding: 1rem;
      margin-top: 1rem;
    }
    
    .danger-zone p {
      color: #ef4444;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    
    .danger-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .save-settings {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
    
    @media (max-width: 1024px) {
      .settings-container {
        grid-template-columns: 1fr;
      }
      
      .business-settings,
      .invoice-settings {
        grid-column: 1 / -1;
      }
      
      .danger-actions {
        grid-template-columns: 1fr;
      }
    }
  </style>
`);
