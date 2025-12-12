-- Mom's Recipe Box - Database Schema
-- Run this in Supabase SQL Editor (SQL Editor > New Query > paste > Run)

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source TEXT,
  preview TEXT,
  ingredients JSONB DEFAULT '[]',
  directions JSONB DEFAULT '[]',
  tip TEXT,
  original_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App config table (for PIN)
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert the PIN
INSERT INTO app_config (key, value) VALUES ('pin', '1234');

-- Enable Row Level Security (required for Supabase)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to recipes (after PIN verified client-side)
CREATE POLICY "Allow public read access to recipes"
  ON recipes FOR SELECT
  USING (true);

-- Allow anonymous insert/update for recipes (admin will use this)
CREATE POLICY "Allow public insert access to recipes"
  ON recipes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to recipes"
  ON recipes FOR UPDATE
  USING (true);

-- Allow reading app_config (for PIN check)
CREATE POLICY "Allow public read access to app_config"
  ON app_config FOR SELECT
  USING (true);

-- Insert the 4 existing recipes
INSERT INTO recipes (name, source, preview, ingredients, directions, tip) VALUES
(
  'Oreo Truffle',
  'Barb Everard',
  'Crushed Oreos mixed with cream cheese, dipped in chocolate. Dangerously addictive!',
  '[{"item": "Oreo cookies", "amount": "1 package", "category": "Snacks"}, {"item": "Cream cheese", "amount": "8 oz, softened", "category": "Dairy"}, {"item": "Semi-sweet baking chocolate", "amount": "2 (8 oz) bars", "category": "Baking"}, {"item": "Dipping chocolate", "amount": "1 package", "category": "Baking"}]',
  '["Keep 5 cookies to crush for topping", "Crush remaining cookies in food processor", "Add softened cream cheese and mix well", "Roll into 1\" balls", "Dip in melted chocolate", "Sprinkle with topping", "Set up in freezer", "Use cookie sheet & parchment paper"]',
  'Topping ideas: Crushed candy canes, toffee bits, Andes mints, toasted almonds, crushed Oreos, or flaked coconut!'
),
(
  'Pecan Balls',
  'Barb Everard',
  'Buttery melt-in-your-mouth cookies rolled in powdered sugar. A holiday classic!',
  '[{"item": "Flour", "amount": "1 cup", "category": "Baking"}, {"item": "Butter", "amount": "½ cup, softened", "category": "Dairy"}, {"item": "Pecans", "amount": "1 cup, chopped", "category": "Nuts"}, {"item": "Sugar", "amount": "2 T", "category": "Baking"}, {"item": "Salt", "amount": "⅛ tsp", "category": "Baking"}, {"item": "Vanilla extract", "amount": "1 tsp", "category": "Baking"}, {"item": "Powdered sugar", "amount": "for rolling", "category": "Baking"}]',
  '["Combine all ingredients except powdered sugar", "Refrigerate 30 minutes", "Preheat oven to 350°", "Roll into balls", "Place 1 inch apart on ungreased cookie sheet", "Bake 15-20 min (do not brown!)", "Let stand 1 min, cool slightly", "Roll in powdered sugar while warm", "Cool completely"]',
  'Spray Pam on sheet lightly to help with cleanup!'
),
(
  'Double Dipped Pretzels',
  'Barb Everard',
  'Long pretzels wrapped in caramel, dipped in chocolate, decorated with toppings. Double boiler needed!',
  '[{"item": "Long pretzels", "amount": "3 bags", "category": "Snacks"}, {"item": "Caramel (Werther''s chunks)", "amount": "2 bags", "category": "Baking"}, {"item": "Milk chocolate chips", "amount": "1 bag", "category": "Baking"}, {"item": "Toasted almonds", "amount": "for topping", "category": "Nuts"}, {"item": "Toasted coconut", "amount": "for topping", "category": "Baking"}, {"item": "Red/white/green sprinkles", "amount": "for topping", "category": "Baking"}, {"item": "Mixed nuts", "amount": "any type, for topping", "category": "Nuts"}]',
  '["Cut caramel into tiny slabs", "Roll caramel into long length", "Wrap caramel around pretzel", "Dip in melted chocolate", "Decorate with sprinkles, toasted almonds, or nuts", "Freeze to set up", "Use ribbon at bottom to tie off package"]',
  'Need large bags to package as gifts! Use a double boiler for melting.'
),
(
  'Homemade Oreo Cookies',
  'Jen Rosen',
  'Soft devil''s food cookies with cream cheese filling. Makes 50 cookies! Can sub dark chocolate cake mix.',
  '[{"item": "Devil''s food cake mix", "amount": "2 boxes (can sub dark chocolate)", "category": "Baking"}, {"item": "Eggs", "amount": "4", "category": "Dairy"}, {"item": "Vegetable oil", "amount": "⅔ cup", "category": "Baking"}, {"item": "Cream cheese", "amount": "4 oz", "category": "Dairy"}, {"item": "Margarine", "amount": "½ cup", "category": "Dairy"}, {"item": "Powdered sugar", "amount": "1¾ cup", "category": "Baking"}, {"item": "Vanilla extract", "amount": "1 tsp", "category": "Baking"}]',
  '["Mix first 3 ingredients (cake mix, eggs, oil)", "Form into 1 inch balls", "Bake at 350° for 9 minutes", "Remove from oven even if they don''t look done", "Mix filling: cream cheese, margarine, powdered sugar, vanilla", "Spread on bottom of one cookie, top with another to form sandwich", "May use food coloring for holiday colors"]',
  'Use water on hands to roll sticky dough. Use paddle attachment on mixer, NOT dough hook! Cook 8 min for softer cookies.'
);

