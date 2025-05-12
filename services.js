
// Initialize the page when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadServices();
  loadCategories();
  setupEventListeners();
});

function setupEventListeners() {
  // Search functionality
  document.getElementById('service-search').addEventListener('input', filterServices);

  // Add service buttons
  document.getElementById('add-service-btn').addEventListener('click', openAddServiceModal);
  document.getElementById('add-first-service-btn')?.addEventListener('click', openAddServiceModal);

  // Close modals
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal') || 'service-modal';
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

  // Save service
  document.getElementById('save-service').addEventListener('click', saveService);

  // Delete service
  document.getElementById('delete-service').addEventListener('click', deleteService);

  // Add category
  document.getElementById('add-category-btn').addEventListener('click', addNewCategory);

  // Data management
  setupDataManagement();
}

function setupDataManagement() {
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
    alert('Backup created successfully!');
  });
}

function loadServices() {
  const services = getServicesFromStorage();
  const tableBody = document.getElementById('services-list');
  const noServicesMessage = document.getElementById('no-services-message');
  const servicesTable = document.getElementById('services-table');

  // Clear existing rows
  tableBody.innerHTML = '';

  if (services.length === 0) {
    // Show no services message
    noServicesMessage.style.display = 'flex';
    servicesTable.style.display = 'none';
    return;
  }

  // Hide no services message, show table
  noServicesMessage.style.display = 'none';
  servicesTable.style.display = 'table';

  // Sort services alphabetically by service type
  services.sort((a, b) => {
    if (a.serviceType !== b.serviceType) {
      return a.serviceType.localeCompare(b.serviceType);
    }
    return a.garment.localeCompare(b.garment);
  });

  // Add rows to table
  services.forEach(service => {
    const row = document.createElement('tr');
    row.setAttribute('data-service-id', service.id);

    // Create status badge class based on status
    const statusClass = service.status === 'active' ? 'status-paid' : 'status-draft';

    row.innerHTML = `
      <td>${capitalizeFirstLetter(service.serviceType)}</td>
      <td>${capitalizeFirstLetter(service.garment)}</td>
      <td>₹${service.price.toFixed(2)}</td>
      <td>${service.deliveryDays || 5}</td>
      <td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(service.status)}</span></td>
      <td class="actions">
        <button class="btn btn-icon btn-light edit-service" data-service="${service.id}" title="Edit Service">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-icon btn-delete delete-service" data-service="${service.id}" title="Delete Service">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.edit-service').forEach(button => {
    button.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service');
      editService(serviceId);
    });
  });

  document.querySelectorAll('.delete-service').forEach(button => {
    button.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service');
      if (confirm('Are you sure you want to delete this service?')) {
        deleteServiceFromList(serviceId);
      }
    });
  });
}

function loadCategories() {
  const categories = getCategoriesFromStorage();
  const categoriesList = document.getElementById('category-list');
  
  // Clear existing categories
  categoriesList.innerHTML = '';
  
  // Add default categories if no categories exist
  if (categories.length === 0) {
    const defaultCategories = ['Stitching', 'Alteration', 'Repair'];
    defaultCategories.forEach(category => {
      addCategory(category);
    });
    return;
  }
  
  // Add categories to the list
  categories.forEach(category => {
    const categoryElement = createCategoryElement(category);
    categoriesList.appendChild(categoryElement);
  });
  
  // Update service type dropdown
  updateServiceTypeDropdown();
}

function createCategoryElement(category) {
  const categoryElement = document.createElement('div');
  categoryElement.className = 'category-item';
  
  categoryElement.innerHTML = `
    <span>${category}</span>
    <button class="btn btn-icon btn-light delete-category" data-category="${category}" title="Delete Category">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add event listener to delete button
  categoryElement.querySelector('.delete-category').addEventListener('click', function() {
    const category = this.getAttribute('data-category');
    if (confirm(`Are you sure you want to delete the ${category} category?`)) {
      deleteCategory(category);
    }
  });
  
  return categoryElement;
}

function updateServiceTypeDropdown() {
  const categories = getCategoriesFromStorage();
  const dropdown = document.getElementById('service-type');
  
  // Keep only the first option (placeholder)
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }
  
  // Add categories as options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.toLowerCase();
    option.textContent = category;
    dropdown.appendChild(option);
  });
}

function openAddServiceModal() {
  // Reset form
  document.getElementById('service-form').reset();
  document.getElementById('service-id').value = '';

  // Update modal title
  document.getElementById('modal-title').textContent = 'Add New Service';

  // Hide delete button for new services
  document.getElementById('delete-service').style.display = 'none';

  // Show modal
  document.getElementById('service-modal').style.display = 'flex';
}

function editService(serviceId) {
  const services = getServicesFromStorage();
  const service = services.find(s => s.id === serviceId);

  if (!service) {
    alert('Service not found!');
    return;
  }

  // Fill form with service data
  document.getElementById('service-id').value = service.id;
  document.getElementById('service-type').value = service.serviceType.toLowerCase();
  document.getElementById('garment-type').value = service.garment.toLowerCase();
  document.getElementById('default-price').value = service.price;
  document.getElementById('delivery-days').value = service.deliveryDays || 5;
  document.getElementById('description').value = service.description || '';
  document.getElementById('service-status').value = service.status || 'active';

  // Update modal title
  document.getElementById('modal-title').textContent = 'Edit Service';

  // Show delete button for existing services
  document.getElementById('delete-service').style.display = 'inline-block';

  // Show modal
  document.getElementById('service-modal').style.display = 'flex';
}

function saveService() {
  // Get form values
  const serviceId = document.getElementById('service-id').value;
  const serviceType = document.getElementById('service-type').value;
  const garmentType = document.getElementById('garment-type').value;
  const price = parseFloat(document.getElementById('default-price').value);
  const deliveryDays = parseInt(document.getElementById('delivery-days').value);
  const description = document.getElementById('description').value;
  const status = document.getElementById('service-status').value;

  if (!serviceType || !garmentType || isNaN(price)) {
    alert('Please fill all required fields.');
    return;
  }

  // Get existing services
  const services = getServicesFromStorage();

  // Check if this is an edit or new service
  if (serviceId) {
    // Edit existing service
    const serviceIndex = services.findIndex(s => s.id === serviceId);
    if (serviceIndex !== -1) {
      services[serviceIndex] = {
        ...services[serviceIndex],
        serviceType,
        garment: garmentType,
        price,
        deliveryDays,
        description,
        status,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Create new service with unique ID
    const newService = {
      id: generateServiceId(),
      serviceType,
      garment: garmentType,
      price,
      deliveryDays,
      description,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    services.push(newService);
  }

  // Save back to localStorage
  localStorage.setItem('services', JSON.stringify(services));

  // Update app settings with the latest service information
  updateAppSettings();

  // Close modal
  document.getElementById('service-modal').style.display = 'none';

  // Reload service list
  loadServices();
}

function updateAppSettings() {
  // Get all services
  const services = getServicesFromStorage();
  
  // Get current settings
  const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
  
  // Extract active services for settings
  const activeServices = services
    .filter(service => service.status === 'active')
    .map(service => ({
      serviceType: service.serviceType,
      garment: service.garment,
      price: service.price
    }));
  
  // Update settings
  settings.services = activeServices;
  
  // Save back to localStorage
  localStorage.setItem('appSettings', JSON.stringify(settings));
}

function deleteService() {
  const serviceId = document.getElementById('service-id').value;

  if (!serviceId) return;

  if (confirm('Are you sure you want to delete this service?')) {
    deleteServiceFromList(serviceId);
    // Close modal
    document.getElementById('service-modal').style.display = 'none';
  }
}

function deleteServiceFromList(serviceId) {
  if (!serviceId) return;
  
  // Get existing services
  const services = getServicesFromStorage();

  // Filter out the service to delete
  const updatedServices = services.filter(s => s.id !== serviceId);

  // Save back to localStorage
  localStorage.setItem('services', JSON.stringify(updatedServices));

  // Update app settings
  updateAppSettings();

  // Reload service list
  loadServices();
}

function addNewCategory() {
  const newCategoryInput = document.getElementById('new-category');
  const categoryName = newCategoryInput.value.trim();
  
  if (!categoryName) {
    alert('Please enter a category name.');
    return;
  }
  
  // Add the new category
  addCategory(categoryName);
  
  // Clear the input
  newCategoryInput.value = '';
}

function addCategory(categoryName) {
  const categories = getCategoriesFromStorage();
  
  // Check if category already exists
  if (categories.includes(categoryName)) {
    alert(`Category "${categoryName}" already exists.`);
    return;
  }
  
  // Add the new category
  categories.push(categoryName);
  
  // Save back to localStorage
  localStorage.setItem('serviceCategories', JSON.stringify(categories));
  
  // Reload categories
  loadCategories();
}

function deleteCategory(categoryName) {
  // Get existing categories
  const categories = getCategoriesFromStorage();
  
  // Filter out the category to delete
  const updatedCategories = categories.filter(c => c !== categoryName);
  
  // Save back to localStorage
  localStorage.setItem('serviceCategories', JSON.stringify(updatedCategories));
  
  // Reload categories
  loadCategories();
}

function filterServices() {
  const searchTerm = document.getElementById('service-search').value.toLowerCase();

  if (!searchTerm) {
    loadServices();
    return;
  }

  const services = getServicesFromStorage();

  // Filter services based on search term
  const filteredServices = services.filter(service => 
    service.serviceType.toLowerCase().includes(searchTerm) ||
    service.garment.toLowerCase().includes(searchTerm) ||
    (service.description && service.description.toLowerCase().includes(searchTerm))
  );

  // Save filtered services temporarily
  localStorage.setItem('tempFilteredServices', JSON.stringify(filteredServices));

  // Render filtered services
  renderFilteredServices();
}

function renderFilteredServices() {
  // Get filtered services
  const filteredServices = JSON.parse(localStorage.getItem('tempFilteredServices')) || [];

  // Save original services temporarily
  const originalServices = getServicesFromStorage();

  // Replace services with filtered list for rendering
  localStorage.setItem('services', JSON.stringify(filteredServices));

  // Load the filtered view
  loadServices();

  // Restore original services
  localStorage.setItem('services', JSON.stringify(originalServices));

  // Clean up
  localStorage.removeItem('tempFilteredServices');
}

// Helper Functions

function getServicesFromStorage() {
  return JSON.parse(localStorage.getItem('services')) || [];
}

function getCategoriesFromStorage() {
  return JSON.parse(localStorage.getItem('serviceCategories')) || [];
}

function generateServiceId() {
  // Generate a unique service ID
  return 'srv_' + Date.now() + Math.floor(Math.random() * 1000);
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Data management functions
function backupData() {
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  const customers = JSON.parse(localStorage.getItem('customers')) || [];
  const services = JSON.parse(localStorage.getItem('services')) || [];
  
  // Create a backup object with timestamp
  const backup = {
    timestamp: new Date().toISOString(),
    invoices: invoices,
    customers: customers,
    services: services
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

function exportDataToFile() {
  try {
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const customers = JSON.parse(localStorage.getItem('customers')) || [];
    const services = JSON.parse(localStorage.getItem('services')) || [];
    
    const dataToExport = {
      invoices: invoices,
      customers: customers,
      services: services,
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
        
        if (importedData.services) {
          localStorage.setItem('services', JSON.stringify(importedData.services));
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
    
    if (backupToRestore.services) {
      localStorage.setItem('services', JSON.stringify(backupToRestore.services));
    }
    
    alert(`Data restored successfully from backup created on ${new Date(backupToRestore.timestamp).toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    alert('Failed to restore data from backup.');
    return false;
  }
}

// Add custom CSS for the services page
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .services-container {
      overflow-x: auto;
    }

    .services-table {
      width: 100%;
      border-collapse: collapse;
    }

    .services-table th,
    .services-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .services-table th {
      font-weight: 600;
      color: var(--text-light);
    }

    .no-services {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--text-light);
    }

    .no-services i {
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-services h3 {
      margin-bottom: 0.5rem;
    }

    .no-services p {
      margin-bottom: 1.5rem;
    }

    .service-categories {
      margin-top: 1.5rem;
    }

    .category-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .category-item {
      display: flex;
      align-items: center;
      background-color: var(--background-color);
      padding: 0.5rem 0.75rem;
      border-radius: var(--border-radius);
      font-size: 0.875rem;
    }

    .category-item button {
      margin-left: 0.5rem;
      padding: 0.25rem;
      font-size: 0.75rem;
    }

    .category-actions {
      display: flex;
      gap: 0.75rem;
    }

    .category-actions input {
      flex: 1;
    }
  </style>
`);
