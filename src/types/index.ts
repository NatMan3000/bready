export type BreadCategory = 'sourdough' | 'flatbread' | 'enriched' | 'quick' | 'artisan'

export interface Bread {
  id: string
  name: string
  category: BreadCategory
  origin: string
  description: string
  characteristics: {
    crust: string
    crumb: string
    flavor: string
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  imageUrl?: string
  funFact?: string
}

export interface Ingredient {
  name: string
  amount: string
  unit: string
  notes?: string
}

export interface Step {
  order: number
  instruction: string
  duration?: number // minutes
  icon?: 'mix' | 'knead' | 'proof' | 'shape' | 'bake' | 'cool'
}

export interface Recipe {
  id: string
  breadId: string
  name: string
  prepTime: number
  proofTime: number
  bakeTime: number
  servings: number
  ingredients: Ingredient[]
  steps: Step[]
  tips: string[]
}

export const CATEGORY_LABELS: Record<BreadCategory, string> = {
  sourdough: 'Sourdough',
  flatbread: 'Flatbreads',
  enriched: 'Enriched Breads',
  quick: 'Quick Breads',
  artisan: 'Artisan Breads'
}

export const CATEGORY_COLORS: Record<BreadCategory, string> = {
  sourdough: 'amber',
  flatbread: 'orange',
  enriched: 'yellow',
  quick: 'lime',
  artisan: 'stone'
}
