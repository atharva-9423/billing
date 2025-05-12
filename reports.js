
// Initialize the page when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  loadReports();
});

function setupEventListeners() {
  // Date filter change
  document.getElementById('filter-date').addEventListener('change', loadReports);
  
  // Export report button
  document.getElementById('export-report').addEventListener('click', exportReportToExcel);
  
  // Data management setup
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

function loadReports() {
  const dateFilter = document.getElementById('filter-date').value;
  
  // Get data from localStorage
  const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
  
  // Filter by date
  const filteredInvoices = filterInvoicesByDate(invoices, dateFilter);
  
  // Load summary data
  loadSummaryData(filteredInvoices);
  
  // Load charts
  loadRevenueChart(filteredInvoices);
  loadServicesChart(filteredInvoices);
  loadPaymentMethodsChart(filteredInvoices);
  
  // Load tables
  loadTopCustomers(filteredInvoices);
  loadGarmentRevenue(filteredInvoices);
}

function filterInvoicesByDate(invoices, dateFilter) {
  const today = new Date();
  const filterDate = new Date();
  
  switch(dateFilter) {
    case 'month':
      // First day of current month
      filterDate.setDate(1);
      break;
      
    case 'quarter':
      // First day of current quarter
      const currentMonth = today.getMonth();
      const quarterMonth = Math.floor(currentMonth / 3) * 3;
      filterDate.setMonth(quarterMonth, 1);
      break;
      
    case 'year':
      // First day of current year
      filterDate.setMonth(0, 1);
      break;
      
    case 'all':
      // Return all invoices
      return invoices;
  }
  
  filterDate.setHours(0, 0, 0, 0);
  
  return invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= filterDate;
  });
}

function loadSummaryData(invoices) {
  // Calculate total revenue
  let totalRevenue = 0;
  let pendingAmount = 0;
  
  invoices.forEach(invoice => {
    const amount = parseFloat(invoice.payment.total.replace(/[^\d.-]/g, ''));
    totalRevenue += amount;
    
    if (invoice.status.toLowerCase() === 'pending') {
      pendingAmount += amount;
    }
  });
  
  const totalOrders = invoices.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Update the DOM
  document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
  document.getElementById('total-orders').textContent = totalOrders;
  document.getElementById('avg-order').textContent = `₹${avgOrderValue.toFixed(2)}`;
  document.getElementById('pending-amount').textContent = `₹${pendingAmount.toFixed(2)}`;
}

function loadRevenueChart(invoices) {
  // Group invoices by month/day
  const dateGroups = {};
  const dateFormat = {};
  
  // Determine time grouping based on filter
  const dateFilter = document.getElementById('filter-date').value;
  
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.date);
    let key;
    let label;
    
    switch(dateFilter) {
      case 'month':
        // Group by day of month
        key = invoiceDate.getDate();
        label = `Day ${key}`;
        break;
        
      case 'quarter':
        // Group by month within quarter
        key = invoiceDate.getMonth() % 3 + 1;
        const monthName = invoiceDate.toLocaleString('default', { month: 'short' });
        label = `${monthName}`;
        break;
        
      case 'year':
        // Group by month
        key = invoiceDate.getMonth() + 1;
        label = invoiceDate.toLocaleString('default', { month: 'short' });
        break;
        
      case 'all':
        // Group by year & month
        key = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth() + 1}`;
        label = `${invoiceDate.toLocaleString('default', { month: 'short' })} ${invoiceDate.getFullYear()}`;
        break;
    }
    
    if (!dateGroups[key]) {
      dateGroups[key] = 0;
      dateFormat[key] = label;
    }
    
    const amount = parseFloat(invoice.payment.total.replace(/[^\d.-]/g, ''));
    dateGroups[key] += amount;
  });
  
  // Prepare data for chart.js
  const labels = [];
  const data = [];
  
  // Sort keys for chronological display
  const keys = Object.keys(dateGroups).sort((a, b) => {
    if (dateFilter === 'all') {
      return a.localeCompare(b);
    } else {
      return parseInt(a) - parseInt(b);
    }
  });
  
  keys.forEach(key => {
    labels.push(dateFormat[key]);
    data.push(dateGroups[key]);
  });
  
  // Create the chart
  const ctx = document.getElementById('revenue-chart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.revenueChart) {
    window.revenueChart.destroy();
  }
  
  window.revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue',
        data: data,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return '₹' + context.raw.toFixed(2);
            }
          }
        }
      }
    }
  });
}

function loadServicesChart(invoices) {
  // Group by service type
  const serviceCount = {};
  
  // Count services
  invoices.forEach(invoice => {
    invoice.services.forEach(service => {
      const serviceType = capitalizeFirstLetter(service.service);
      
      if (!serviceCount[serviceType]) {
        serviceCount[serviceType] = 0;
      }
      
      serviceCount[serviceType]++;
    });
  });
  
  // Prepare data for chart
  const labels = Object.keys(serviceCount);
  const data = labels.map(label => serviceCount[label]);
  
  // Create color array
  const backgroundColors = [
    'rgba(99, 102, 241, 0.7)',
    'rgba(245, 158, 11, 0.7)',
    'rgba(16, 185, 129, 0.7)',
    'rgba(239, 68, 68, 0.7)',
    'rgba(139, 92, 246, 0.7)'
  ];
  
  // Create the chart
  const ctx = document.getElementById('services-chart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.servicesChart) {
    window.servicesChart.destroy();
  }
  
  window.servicesChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function loadPaymentMethodsChart(invoices) {
  // Group by payment method
  const paymentMethods = {};
  
  // Count payment methods
  invoices.forEach(invoice => {
    const method = capitalizeFirstLetter(invoice.payment.method);
    
    if (!paymentMethods[method]) {
      paymentMethods[method] = 0;
    }
    
    paymentMethods[method]++;
  });
  
  // Prepare data for chart
  const labels = Object.keys(paymentMethods);
  const data = labels.map(label => paymentMethods[label]);
  
  // Create color array
  const backgroundColors = [
    'rgba(16, 185, 129, 0.7)',
    'rgba(99, 102, 241, 0.7)',
    'rgba(245, 158, 11, 0.7)'
  ];
  
  // Create the chart
  const ctx = document.getElementById('payment-chart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.paymentChart) {
    window.paymentChart.destroy();
  }
  
  window.paymentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function loadTopCustomers(invoices) {
  // Group by customer
  const customers = {};
  
  // Process each invoice
  invoices.forEach(invoice => {
    const customerId = invoice.customer.id;
    const customerName = invoice.customer.name;
    
    if (!customerId) return;
    
    if (!customers[customerId]) {
      customers[customerId] = {
        name: customerName,
        orders: 0,
        revenue: 0,
        lastOrder: new Date(0)
      };
    }
    
    customers[customerId].orders++;
    customers[customerId].revenue += parseFloat(invoice.payment.total.replace(/[^\d.-]/g, ''));
    
    const orderDate = new Date(invoice.date);
    if (orderDate > customers[customerId].lastOrder) {
      customers[customerId].lastOrder = orderDate;
    }
  });
  
  // Convert to array for sorting
  const customersArray = Object.keys(customers).map(id => {
    return {
      id: id,
      ...customers[id]
    };
  });
  
  // Sort by revenue (descending)
  customersArray.sort((a, b) => b.revenue - a.revenue);
  
  // Take top 5
  const topCustomers = customersArray.slice(0, 5);
  
  // Update the table
  const tableBody = document.getElementById('top-customers');
  tableBody.innerHTML = '';
  
  if (topCustomers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">No customer data available</td>
      </tr>
    `;
    return;
  }
  
  topCustomers.forEach(customer => {
    const row = document.createElement('tr');
    
    const formattedDate = customer.lastOrder.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    row.innerHTML = `
      <td>${customer.name}</td>
      <td>${customer.orders}</td>
      <td>₹${customer.revenue.toFixed(2)}</td>
      <td>${formattedDate}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

function loadGarmentRevenue(invoices) {
  // Group by garment type
  const garments = {};
  
  // Process each invoice's services
  invoices.forEach(invoice => {
    invoice.services.forEach(service => {
      const garment = capitalizeFirstLetter(service.garment);
      
      if (!garments[garment]) {
        garments[garment] = {
          count: 0,
          revenue: 0
        };
      }
      
      garments[garment].count++;
      garments[garment].revenue += parseFloat(service.price);
    });
  });
  
  // Convert to array for sorting
  const garmentsArray = Object.keys(garments).map(name => {
    return {
      name: name,
      ...garments[name]
    };
  });
  
  // Sort by revenue (descending)
  garmentsArray.sort((a, b) => b.revenue - a.revenue);
  
  // Update the table
  const tableBody = document.getElementById('garment-revenue');
  tableBody.innerHTML = '';
  
  if (garmentsArray.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">No garment data available</td>
      </tr>
    `;
    return;
  }
  
  garmentsArray.forEach(garment => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${garment.name}</td>
      <td>${garment.count}</td>
      <td>₹${garment.revenue.toFixed(2)}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

function exportReportToExcel() {
  const dateFilter = document.getElementById('filter-date').value;
  const dateLabel = document.getElementById('filter-date').options[document.getElementById('filter-date').selectedIndex].text;
  
  alert(`Export ${dateLabel} report functionality will be implemented in a future update.`);
}

// Data management functions
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

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add styles for the reports page
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    
    .summary-card {
      grid-column: 1 / -1;
    }
    
    .summary-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: 1rem;
    }
    
    .stat-item {
      flex: 1;
      min-width: 150px;
      background-color: var(--background-color);
      padding: 1rem;
      border-radius: var(--border-radius);
      text-align: center;
    }
    
    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-light);
    }
    
    .chart-card {
      min-height: 300px;
    }
    
    .chart-container {
      width: 100%;
      height: 250px;
      margin-top: 1rem;
    }
    
    .table-card {
      overflow-x: auto;
    }
    
    .reports-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .reports-table th,
    .reports-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    
    .reports-table th {
      font-weight: 600;
      color: var(--text-light);
    }
    
    .text-center {
      text-align: center;
    }
    
    @media (max-width: 992px) {
      .reports-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
`);
