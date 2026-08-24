/*
  RECIPE TEMPLATE

  1. Save as recipes/<id>.js
  2. Add "<id>" to recipes/registry.js
     or the recipe will not appear.
*/

window.RECIPES = window.RECIPES || {};

window.RECIPES["replace-with-recipe-id"] = {
  id: "replace-with-recipe-id",
  title: "Recipe title",
  description: "Brief description.",
  baseServings: 4,
  source: "name or url etc",

  // Choose any or create your own. Can be empty, one or a list.
  cuisine: ["italian"],
  mainIngredients: ["chicken","tomato"],
  methods: ["grill"],

  // Tags can be simple tags or group tags
  tags: [
    "generic-tag",
    "group:tag-value",
    "harveysfavorite",
    "recipe-to-try",
    "equipment:instantpot",
    "dietary:vegan",
  ],

  ingredients: [
    {
      name: "Ingredient name and preparation",
      us: { amt: 1, unit: "cup" },
      metric: { amt: 240, unit: "ml" },
    },
    {      name: "Yellow onion, finely diced",
      us: { amt: 1, unit: "medium" },
      metric: { amt: 1, unit: "medium" },
    }
  ],

  steps: [    
    {      
      title: "Step title",
      content: "Write the instruction.",
    },
    { 
      title: "Sauté the onion",
      content: "Warm the oil in a large pot over medium heat. Add the onion and cook, stirring occasionally, until softened and lightly golden, about 5 minutes.",
    },
  ],

  notes: "Optional notes.",

/*
   TAG group suggestions

  type: ["appetizer", "main", "side", "dessert", "soup"]
  occasion: ["weeknight", "winter", "holiday", "thanksgiving", "potluck"]
  dietary: ["vegetarian", "vegan", "gluten-free", "dairy-free", "plant-forward"]
  equipment: ["oven", "slow-cooker", "instant-pot", "blender", "wok"]
  effort: ["quick", "easy", "one-pot", "weekend-project", "multi-step"]
  planning: ["make-ahead", "meal-prep", "batch-cook", "pantry-meal", "last-minute"]
  storage: ["freezer-friendly", "leftovers", "reheats-well", "portable", "freezer-meal"]
  serving: ["family-style", "individual-portions", "packed-lunch", "potluck-friendly", "party-food"]
  flavor: ["spicy", "umami", "comforting", "tangy", "refreshing"]
  time: ["under-15-minutes", "under-30-minutes", "under-1-hour", "long-simmer", "overnight"]
  origin: ["original","family", "nyt", "bonappetit"],
  skill: ["beginner", "intermediate", "advanced", "technical", "forgiving"]
*/