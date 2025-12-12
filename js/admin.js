// Admin Upload Logic
// Used by admin.html

let currentImage = null;
let currentImageBase64 = null;
let uploadedImageUrl = null;
let parsedRecipe = null;

// Image handling
function handleImageSelect(file) {
  if (!file) return;
  
  currentImage = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageBase64 = e.target.result.split(',')[1]; // Remove data:image/...;base64,
    
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.add('has-image');
    uploadArea.innerHTML = `
      <img src="${e.target.result}" class="preview-image" alt="Recipe card">
      <p class="upload-text" style="margin-top: 15px;">Tap to change photo</p>
      <input type="file" id="imageInput" accept="image/*" capture="environment">
    `;
    
    // Re-attach listener
    document.getElementById('imageInput').addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageSelect(e.target.files[0]);
    });
    
    // Show step 2
    document.getElementById('step2').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Upload image to Supabase Storage
async function uploadImageToStorage() {
  if (!currentImage) return null;
  
  const fileName = `${Date.now()}-${currentImage.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, currentImage, {
      contentType: currentImage.type,
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

// Process image with Claude via Edge Function
async function processWithClaude() {
  if (!currentImageBase64) {
    alert('Please upload an image first');
    return;
  }
  
  const statusEl = document.getElementById('processStatus');
  const processBtn = document.getElementById('processBtn');
  
  statusEl.className = 'status loading';
  statusEl.textContent = 'Uploading image and reading recipe... this may take a moment';
  statusEl.classList.remove('hidden');
  processBtn.disabled = true;
  
  try {
    // First, upload image to storage
    statusEl.textContent = 'Uploading image...';
    uploadedImageUrl = await uploadImageToStorage();
    
    // Then call the edge function for OCR
    statusEl.textContent = 'Reading recipe with Claude AI...';
    
    const response = await fetch(OCR_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        imageBase64: currentImageBase64,
        mimeType: currentImage.type
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `OCR request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the recipe
    if (typeof data.recipe === 'string') {
      parsedRecipe = JSON.parse(data.recipe);
    } else {
      parsedRecipe = data.recipe;
    }
    
    statusEl.className = 'status success';
    statusEl.textContent = '✓ Recipe extracted successfully!';
    
    // Populate form
    populateForm(parsedRecipe);
    document.getElementById('step3').classList.remove('hidden');
    
  } catch (err) {
    console.error('OCR error:', err);
    statusEl.className = 'status error';
    statusEl.textContent = 'Error: ' + err.message;
  } finally {
    processBtn.disabled = false;
  }
}

// Form population
function populateForm(recipe) {
  document.getElementById('recipeName').value = recipe.name || '';
  document.getElementById('recipeSource').value = recipe.source || '';
  document.getElementById('recipePreview').value = recipe.preview || '';
  document.getElementById('recipeTip').value = recipe.tip || '';
  
  // Ingredients
  const ingredientsList = document.getElementById('ingredientsList');
  ingredientsList.innerHTML = '';
  (recipe.ingredients || []).forEach((ing) => {
    addIngredientRow(ing.amount, ing.item, ing.category);
  });
  
  // Directions
  const directionsList = document.getElementById('directionsList');
  directionsList.innerHTML = '';
  (recipe.directions || []).forEach((dir) => {
    addDirectionRow(dir);
  });
}

function addIngredientRow(amount = '', item = '', category = 'Other') {
  const list = document.getElementById('ingredientsList');
  const div = document.createElement('div');
  div.className = 'list-item';
  div.innerHTML = `
    <input type="text" placeholder="Amount" value="${escapeAttr(amount)}" class="ing-amount" style="flex: 0.7;">
    <input type="text" placeholder="Ingredient" value="${escapeAttr(item)}" class="ing-item">
    <select class="ing-category" style="flex: 0.6; padding: 10px; border: 2px solid #d4c4b0; border-radius: 8px;">
      <option value="Baking" ${category === 'Baking' ? 'selected' : ''}>Baking</option>
      <option value="Dairy" ${category === 'Dairy' ? 'selected' : ''}>Dairy</option>
      <option value="Nuts" ${category === 'Nuts' ? 'selected' : ''}>Nuts</option>
      <option value="Snacks" ${category === 'Snacks' ? 'selected' : ''}>Snacks</option>
      <option value="Produce" ${category === 'Produce' ? 'selected' : ''}>Produce</option>
      <option value="Meat" ${category === 'Meat' ? 'selected' : ''}>Meat</option>
      <option value="Spices" ${category === 'Spices' ? 'selected' : ''}>Spices</option>
      <option value="Other" ${category === 'Other' ? 'selected' : ''}>Other</option>
    </select>
    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
  `;
  list.appendChild(div);
}

function addDirectionRow(text = '') {
  const list = document.getElementById('directionsList');
  const div = document.createElement('div');
  div.className = 'list-item';
  div.innerHTML = `
    <input type="text" placeholder="Step..." value="${escapeAttr(text)}">
    <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
  `;
  list.appendChild(div);
}

// Escape attribute value
function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Save recipe
async function saveRecipe(e) {
  e.preventDefault();
  
  const statusEl = document.getElementById('saveStatus');
  statusEl.className = 'status loading';
  statusEl.textContent = 'Saving recipe...';
  statusEl.classList.remove('hidden');
  
  // Gather form data
  const ingredients = [];
  document.querySelectorAll('#ingredientsList .list-item').forEach(row => {
    const amount = row.querySelector('.ing-amount').value.trim();
    const item = row.querySelector('.ing-item').value.trim();
    const category = row.querySelector('.ing-category').value;
    if (item) {
      ingredients.push({ amount, item, category });
    }
  });
  
  const directions = [];
  document.querySelectorAll('#directionsList .list-item input').forEach(input => {
    const text = input.value.trim();
    if (text) directions.push(text);
  });
  
  const recipe = {
    name: document.getElementById('recipeName').value.trim(),
    source: document.getElementById('recipeSource').value.trim() || null,
    preview: document.getElementById('recipePreview').value.trim() || null,
    ingredients: ingredients,
    directions: directions,
    tip: document.getElementById('recipeTip').value.trim() || null,
    original_image_url: uploadedImageUrl || null
  };
  
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert([recipe]);
    
    if (error) throw error;
    
    // Show success
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('successCard').classList.remove('hidden');
    
  } catch (err) {
    console.error('Save error:', err);
    statusEl.className = 'status error';
    statusEl.textContent = 'Error saving: ' + err.message;
  }
}

// Reset form
function resetForm() {
  currentImage = null;
  currentImageBase64 = null;
  uploadedImageUrl = null;
  parsedRecipe = null;
  
  const uploadArea = document.getElementById('uploadArea');
  uploadArea.classList.remove('has-image');
  uploadArea.innerHTML = `
    <input type="file" id="imageInput" accept="image/*" capture="environment">
    <div class="upload-icon">📷</div>
    <p class="upload-text">Tap to take photo or choose file</p>
  `;
  
  document.getElementById('imageInput').addEventListener('change', (e) => {
    if (e.target.files[0]) handleImageSelect(e.target.files[0]);
  });
  
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.add('hidden');
  document.getElementById('successCard').classList.add('hidden');
  document.getElementById('processStatus').classList.add('hidden');
  document.getElementById('saveStatus').classList.add('hidden');
  
  document.getElementById('recipeForm').reset();
  document.getElementById('ingredientsList').innerHTML = '';
  document.getElementById('directionsList').innerHTML = '';
}

// Initialize admin page handlers
function initAdminHandlers() {
  document.getElementById('uploadArea')?.addEventListener('click', () => {
    document.getElementById('imageInput').click();
  });
  
  document.getElementById('imageInput')?.addEventListener('change', (e) => {
    if (e.target.files[0]) handleImageSelect(e.target.files[0]);
  });
  
  document.getElementById('processBtn')?.addEventListener('click', processWithClaude);
  
  document.getElementById('addIngredient')?.addEventListener('click', () => addIngredientRow());
  document.getElementById('addDirection')?.addEventListener('click', () => addDirectionRow());
  
  document.getElementById('recipeForm')?.addEventListener('submit', saveRecipe);
  
  document.getElementById('addAnother')?.addEventListener('click', resetForm);
}

