// Authentication (PIN-based)
// This file is shared across all pages

// Check if user has verified PIN
function isAuthenticated() {
  return localStorage.getItem('recipes_pin_verified') === 'true';
}

// Show/hide PIN overlay
function showPinOverlay(show) {
  const overlay = document.getElementById('pinOverlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

// Verify PIN via secure edge function (PIN stored as secret, not in database)
async function verifyPin(pin) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ pin })
    });
    
    if (!response.ok) {
      throw new Error('PIN verification failed');
    }
    
    const data = await response.json();
    return data.valid === true;
  } catch (err) {
    console.error('PIN check error:', err);
    return false;
  }
}

// Set up PIN form event handlers
function initPinForm(onSuccess) {
  const pinSubmit = document.getElementById('pinSubmit');
  const pinInput = document.getElementById('pinInput');
  const pinError = document.getElementById('pinError');
  
  if (!pinSubmit || !pinInput) return;
  
  pinSubmit.addEventListener('click', async () => {
    const pin = pinInput.value;
    
    if (!pin) {
      if (pinError) pinError.textContent = 'Please enter the PIN';
      return;
    }
    
    const valid = await verifyPin(pin);
    
    if (valid) {
      localStorage.setItem('recipes_pin_verified', 'true');
      showPinOverlay(false);
      if (onSuccess) onSuccess();
    } else {
      if (pinError) pinError.textContent = 'Incorrect PIN. Try again!';
      pinInput.value = '';
      pinInput.focus();
    }
  });
  
  pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      pinSubmit.click();
    }
  });
}

// Initialize auth - call this on page load
function initAuth(onSuccess) {
  if (isAuthenticated()) {
    showPinOverlay(false);
    if (onSuccess) onSuccess();
  } else {
    showPinOverlay(true);
    const pinInput = document.getElementById('pinInput');
    if (pinInput) pinInput.focus();
    initPinForm(onSuccess);
  }
}

