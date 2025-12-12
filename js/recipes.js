// Recipe Display Logic
// Used by index.html

let recipes = [];
let selectedRecipes = new Set();

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
      preview: r.preview,
      ingredients: r.ingredients || [],
      directions: r.directions || [],
      tip: r.tip,
      imageUrl: r.original_image_url
    }));
    
    renderRecipes();
  } catch (err) {
    console.error('Error loading recipes:', err);
    document.getElementById('recipeGrid').innerHTML = `
      <div class="error-message">
        <p>Could not load recipes.</p>
        <p style="font-size: 0.9rem; margin-top: 10px;">Please check your connection and try again.</p>
      </div>
    `;
  }
}

// Render recipe cards
function renderRecipes() {
  const grid = document.getElementById('recipeGrid');
  
  if (recipes.length === 0) {
    grid.innerHTML = '<div class="loading-text">No recipes yet!</div>';
    return;
  }
  
  grid.innerHTML = recipes.map(recipe => `
    <div class="recipe-card ${selectedRecipes.has(recipe.id) ? 'selected' : ''}" 
         data-id="${recipe.id}">
      <div class="card-header">
        <div>
          <h2>${escapeHtml(recipe.name)}</h2>
          <div class="from">From ${escapeHtml(recipe.from || 'the family')}</div>
        </div>
        <div class="checkbox"></div>
      </div>
      <div class="card-preview">
        <p>${escapeHtml(recipe.preview || '')}</p>
        <p class="expand-hint">👆 Tap to view full recipe</p>
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
    <p class="from-line">From the kitchen of ${escapeHtml(recipe.from || 'the family')}</p>
    
    ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="Original recipe card" style="max-width: 100%; border-radius: 12px; margin-bottom: 20px;">` : ''}
    
    <h3>📝 Ingredients</h3>
    <ul>
      ${ingredients.map(i => `<li><strong>${escapeHtml(i.amount)}</strong> ${escapeHtml(i.item)}</li>`).join('')}
    </ul>
    
    <h3>👩‍🍳 Directions</h3>
    <ol>
      ${directions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
    </ol>
    
    ${recipe.tip ? `<div class="recipe-tip"><strong>💡 Mom's Tip:</strong> ${escapeHtml(recipe.tip)}</div>` : ''}
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
    count === recipes.length ? 'Deselect All' : 'Select All';
}

// Select/deselect all
function toggleSelectAll() {
  if (selectedRecipes.size === recipes.length) {
    selectedRecipes.clear();
  } else {
    recipes.forEach(r => selectedRecipes.add(r.id));
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

