// Recipe Display Logic
// Used by index.html

let recipes = [];
let filteredRecipes = [];
let selectedRecipes = new Set();
let currentFilter = 'all';

// Load recipes from database
async function loadRecipes() {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    recipes = data.map(r => ({
      id: r.id,
      name: r.name,
      from: r.source,
      category: r.category || 'Other',
      preview: r.preview,
      ingredients: r.ingredients || [],
      directions: r.directions || [],
      tip: r.tip,
      imageUrl: r.original_image_url
    }));
    
    filteredRecipes = [...recipes];
    populateFilters();
    renderRecipes();
  } catch (err) {
    console.error('Error loading recipes:', err);
    document.getElementById('recipeGrid').innerHTML = `
      <div class="error-message">
        <p>Could not load recipes.</p>
        <p class="text-muted mt-sm">Check your connection and try again.</p>
      </div>
    `;
  }
}

// Populate filter buttons based on categories
function populateFilters() {
  const categories = new Set();
  recipes.forEach(r => {
    if (r.category) categories.add(r.category);
  });
  
  const container = document.getElementById('filtersContainer');
  if (!container) return;
  
  // Keep "All" button, add category filters
  let html = '<button class="filter-btn active" data-filter="all">All</button>';
  
  // Define category order for consistent display
  const categoryOrder = ['Cookies', 'Candy', 'Cakes', 'Breads', 'Main Dishes', 'Sides', 'Appetizers', 'Drinks', 'Other'];
  
  categoryOrder.forEach(cat => {
    if (categories.has(cat)) {
      html += `<button class="filter-btn" data-filter="${escapeAttr(cat)}">${escapeHtml(cat)}</button>`;
    }
  });
  
  container.innerHTML = html;
  
  // Attach click handlers
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Apply filter
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });
}

// Apply current filter
function applyFilter() {
  if (currentFilter === 'all') {
    filteredRecipes = [...recipes];
  } else {
    filteredRecipes = recipes.filter(r => r.category === currentFilter);
  }
  renderRecipes();
}

// Render recipe cards
function renderRecipes() {
  const grid = document.getElementById('recipeGrid');
  
  if (filteredRecipes.length === 0) {
    grid.innerHTML = '<div class="loading-text">No recipes found</div>';
    return;
  }
  
  grid.innerHTML = filteredRecipes.map(recipe => `
    <div class="recipe-card ${selectedRecipes.has(recipe.id) ? 'selected' : ''}" 
         data-id="${recipe.id}">
      <div class="card-header">
        <h2>${escapeHtml(recipe.name)}</h2>
        <div class="checkbox"></div>
      </div>
      <div class="card-preview">
        <p>${escapeHtml(recipe.preview || '')}</p>
        <p class="expand-hint">Tap for full recipe</p>
      </div>
    </div>
  `).join('');

  // Attach click handlers
  document.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      if (e.target.closest('.checkbox')) {
        toggleSelect(id);
      } else {
        openRecipeModal(id);
      }
    });
  });

  updateUI();
}

// Open recipe detail modal
function openRecipeModal(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;
  
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const directions = Array.isArray(recipe.directions) ? recipe.directions : [];
  
  document.getElementById('recipeModalTitle').textContent = recipe.name;
  document.getElementById('recipeModalBody').innerHTML = `
    ${recipe.from ? `<p class="from-line">From ${escapeHtml(recipe.from)}</p>` : ''}
    
    ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="Original recipe card" style="max-width: 100%; border-radius: 8px; margin-bottom: 16px;">` : ''}
    
    <h3>📝 Ingredients</h3>
    <ul>
      ${ingredients.map(i => `<li><strong>${escapeHtml(i.amount)}</strong> ${escapeHtml(i.item)}</li>`).join('')}
    </ul>
    
    <h3>👩‍🍳 Directions</h3>
    <ol>
      ${directions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
    </ol>
    
    ${recipe.tip ? `<div class="recipe-tip"><strong>💡 Tip:</strong> ${escapeHtml(recipe.tip)}</div>` : ''}
  `;
  
  document.getElementById('recipeModalOverlay').classList.add('active');
}

// Toggle recipe selection
function toggleSelect(id) {
  if (selectedRecipes.has(id)) {
    selectedRecipes.delete(id);
  } else {
    selectedRecipes.add(id);
  }
  renderRecipes();
}

// Update UI state
function updateUI() {
  const count = selectedRecipes.size;
  document.getElementById('selectedCount').textContent = count;
  document.getElementById('shoppingBtn').disabled = count === 0;
  document.getElementById('selectAllBtn').textContent = 
    count === filteredRecipes.length && count > 0 ? 'Deselect All' : 'Select All';
}

// Select/deselect all (in current filter)
function toggleSelectAll() {
  if (selectedRecipes.size === filteredRecipes.length) {
    selectedRecipes.clear();
  } else {
    filteredRecipes.forEach(r => selectedRecipes.add(r.id));
  }
  renderRecipes();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escape attribute value
function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Close modal handlers
function initModalHandlers() {
  document.getElementById('closeRecipeModal')?.addEventListener('click', () => {
    document.getElementById('recipeModalOverlay').classList.remove('active');
  });

  document.getElementById('recipeModalOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('recipeModalOverlay').classList.remove('active');
    }
  });
}
