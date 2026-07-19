import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit', { enum: ['kg', 'l'] }).notNull(),
  icon: text('icon').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const ingredientPrices = sqliteTable('ingredient_prices', {
  id: text('id').primaryKey(),
  ingredientId: text('ingredient_id')
    .notNull()
    .references(() => ingredients.id, { onDelete: 'cascade' }),
  price: real('price').notNull(),
  currency: text('currency').notNull(),
  createdAt: text('created_at').notNull()
})

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description', { mode: 'json' }).notNull(),
  steps: text('steps', { mode: 'json' }).notNull(),
  imagePath: text('image_path'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const recipeIngredients = sqliteTable('recipe_ingredients', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientId: text('ingredient_id')
    .notNull()
    .references(() => ingredients.id, { onDelete: 'restrict' }),
  quantityPerPerson: real('quantity_per_person').notNull(),
  position: integer('position').notNull()
})
