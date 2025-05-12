
// Custom alert function to replace the default browser alerts
function customAlert(message) {
  // Store the original alert function
  const originalAlert = window.alert;
  
  // Override the alert temporarily
  window.alert = function(msg) {
    // Change the document title momentarily to affect the alert dialog
    const originalTitle = document.title;
    document.title = "Billing App Says";
    
    // Call the original alert with our message
    originalAlert(msg);
    
    // Restore the original title
    document.title = originalTitle;
  };
  
  // Call our modified alert
  alert(message);
  
  // Restore the original alert function
  window.alert = originalAlert;
}

// Custom confirm dialog with the same title change
function customConfirm(message) {
  const originalConfirm = window.confirm;
  
  window.confirm = function(msg) {
    const originalTitle = document.title;
    document.title = "Billing App Says";
    
    const result = originalConfirm(msg);
    
    document.title = originalTitle;
    return result;
  };
  
  const result = confirm(message);
  window.confirm = originalConfirm;
  
  return result;
}
