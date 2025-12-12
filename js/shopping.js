// Shopping List Logic
// Used by index.html

// Generate shopping list from selected recipes
function generateShoppingList() {
  const selected = recipes.filter(r => selectedRecipes.has(r.id));
  const combined = {};

  selected.forEach(recipe => {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    ingredients.forEach(ing => {
      const key = ing.item.toLowerCase();
      if (!combined[key]) {
        combined[key] = {
          item: ing.item,
          amounts: [],
          category: ing.category || 'Other',
          recipes: []
        };
      }
      combined[key].amounts.push(ing.amount);
      combined[key].recipes.push(recipe.name);
    });
  });

  // Group by category
  const categories = {};
  Object.values(combined).forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="recipes-included">
      <strong>Recipes:</strong> ${selected.map(r => escapeHtml(r.name)).join(', ')}
    </div>
    ${Object.entries(categories).map(([cat, items]) => `
      <div class="shopping-category">
        <h3>${getCategoryEmoji(cat)} ${escapeHtml(cat)}</h3>
        ${items.map((item, i) => `
          <div class="shopping-item" data-index="${cat}-${i}">
            <input type="checkbox" id="item-${cat}-${i}">
            <label for="item-${cat}-${i}">
              <strong>${escapeHtml(item.item)}</strong><br>
              <span style="color: #8b7355; font-size: 0.95rem;">${smartCombineAmounts(item.amounts)}</span>
            </label>
            <span class="recipe-tags">${item.recipes.length > 1 ? '(' + item.recipes.map(escapeHtml).join(' + ') + ')' : ''}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
    <button class="btn btn-secondary print-btn" onclick="window.print()">🖨️ Print Shopping List</button>
  `;

  // Attach checkbox handlers
  document.querySelectorAll('.shopping-item input').forEach(cb => {
    cb.addEventListener('change', (e) => {
      e.target.closest('.shopping-item').classList.toggle('checked', e.target.checked);
    });
  });

  document.getElementById('modalOverlay').classList.add('active');
}

// Get emoji for category
function getCategoryEmoji(cat) {
  const emojis = { 
    'Dairy': '🧈', 
    'Baking': '🥣', 
    'Nuts': '🥜', 
    'Snacks': '🥨',
    'Produce': '🥕',
    'Meat': '🥩',
    'Spices': '🌿',
    'Other': '📦'
  };
  return emojis[cat] || '📦';
}

// Combine amounts intelligently
function smartCombineAmounts(amounts) {
  if (amounts.length === 1) return amounts[0];
  return amounts.join(' + ');
}

// Initialize shopping list handlers
function initShoppingHandlers() {
  document.getElementById('shoppingBtn')?.addEventListener('click', generateShoppingList);
  
  document.getElementById('selectAllBtn')?.addEventListener('click', toggleSelectAll);

  document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('modalOverlay').classList.remove('active');
  });

  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('modalOverlay').classList.remove('active');
    }
  });
}

