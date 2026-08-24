(() => {
  "use strict";

  window.RECIPES = window.RECIPES || {};

  const page = document.body.dataset.page;

  function byId(id) {
    return document.getElementById(id);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;

      script.addEventListener("load", () => resolve(src));
      script.addEventListener("error", () => {
        script.remove();
        reject(new Error(`Could not load ${src}`));
      });

      document.head.appendChild(script);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function titleCase(value) {
    return String(value ?? "")
      .replace(/[-_]/g, " ")
      .replace(/\bw/g, (letter) => letter.toUpperCase());
  }

  function labelForGroup(group) {
    const labels = {
      cuisine: "Cuisine",
      type: "Dish type",
      ingredient: "Main ingredient",
      occasion: "Occasion",
      method: "Method",
      dietary: "Dietary",
      flavor: "Flavor",
      equipment: "Equipment",
      planning: "Planning",
      storage: "Storage",
      serving: "Serving",
      effort: "Effort",
      time: "Time",
      skill: "Skill",
      general: "Other",
    };

    return labels[group] || titleCase(group);
  }

  function splitTag(tag) {
    const text = String(tag ?? "");
    const position = text.indexOf(":");

    if (position === -1) {
      return {
        group: "general",
        value: text,
        key: `general:${text}`,
      };
    }

    return {
      group: text.slice(0, position).trim().toLowerCase(),
      value: text.slice(position + 1).trim().toLowerCase(),
      key: text,
    };
  }

  function displayTag(tag) {
    return titleCase(splitTag(tag).value);
  }

  function normalizeRecipe(recipe) {
    const tags = Array.isArray(recipe.tags) ? [...recipe.tags] : [];

    for (const cuisine of recipe.cuisine || []) {
      tags.push(`cuisine:${cuisine}`);
    }

    for (const type of recipe.types || []) {
      tags.push(`type:${type}`);
    }

    for (const ingredient of recipe.mainIngredients || []) {
      tags.push(`ingredient:${ingredient}`);
    }

    for (const occasion of recipe.occasions || []) {
      tags.push(`occasion:${occasion}`);
    }

    for (const method of recipe.methods || []) {
      tags.push(`method:${method}`);
    }

    return {
      ...recipe,
      id: String(recipe.id ?? ""),
      title: recipe.title || "Untitled recipe",
      description: recipe.description || recipe.desc || "",
      baseServings: Number(recipe.baseServings) || 1,
      tags: [...new Set(tags.filter(Boolean))],
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    };
  }

  function registryIds() {
    return Array.isArray(window.RECIPE_IDS)
      ? window.RECIPE_IDS.map(String).filter(Boolean)
      : [];
  }

  async function loadRecipe(id) {
    if (window.RECIPES[id]) {
      return normalizeRecipe(window.RECIPES[id]);
    }

    try {
      await loadScript(`${encodeURIComponent(id)}.js`);
    } catch {
      return null;
    }

    return window.RECIPES[id] ? normalizeRecipe(window.RECIPES[id]) : null;
  }

  function ingredientSearchText(ingredient) {
    if (typeof ingredient === "string") return ingredient;

    return [
      ingredient.name,
      ingredient.note,
      ingredient.notes,
      ingredient.prep,
    ].filter(Boolean).join(" ");
  }

  function recipeSearchText(recipe) {
    const ingredientText = recipe.ingredients
      .map(ingredientSearchText)
      .join(" ");

    return [
      recipe.title,
      recipe.description,
      recipe.source,
      recipe.tags.join(" "),
      ingredientText,
    ].join(" ").toLowerCase();
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";

    const rounded = Math.round(value * 100) / 100;

    if (Number.isInteger(rounded)) {
      return String(rounded);
    }

    const fractions = [
      [0.125, "1/8"],
      [0.25, "1/4"],
      [0.333, "1/3"],
      [0.375, "3/8"],
      [0.5, "1/2"],
      [0.625, "5/8"],
      [0.667, "2/3"],
      [0.75, "3/4"],
      [0.875, "7/8"],
    ];

    const whole = Math.floor(rounded);
    const decimal = rounded - whole;
    const closest = fractions.reduce((best, option) => {
      return Math.abs(option[0] - decimal) < Math.abs(best[0] - decimal)
        ? option
        : best;
    }, fractions[0]);

    if (Math.abs(closest[0] - decimal) < 0.025) {
      return whole ? `${whole} ${closest[1]}` : closest[1];
    }

    return String(rounded);
  }

  function ingredientMeasurement(ingredient, unitSystem, multiplier) {
    if (typeof ingredient === "string") return "";

    const preferred = ingredient[unitSystem];
    const fallback = ingredient[unitSystem === "us" ? "metric" : "us"];

    let amount;
    let unit;

    if (preferred && typeof preferred === "object") {
      amount = preferred.amt ?? preferred.amount;
      unit = preferred.unit;
    } else {
      amount = ingredient[`${unitSystem}Amt`] ?? ingredient[`${unitSystem}Amount`];
      unit = ingredient[`${unitSystem}Unit`];
    }

    if (amount === undefined || amount === null || amount === "") {
      if (fallback && typeof fallback === "object") {
        amount = fallback.amt ?? fallback.amount;
        unit = fallback.unit;
      } else {
        const otherSystem = unitSystem === "us" ? "metric" : "us";
        amount = ingredient[`${otherSystem}Amt`] ?? ingredient[`${otherSystem}Amount`];
        unit = ingredient[`${otherSystem}Unit`];
      }
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return unit ? String(unit) : "";
    }

    return [formatNumber(numericAmount * multiplier), unit || ""]
      .filter(Boolean)
      .join(" ");
  }

  function ingredientName(ingredient) {
    if (typeof ingredient === "string") return ingredient;

    return [
      ingredient.name || "",
      ingredient.note || ingredient.notes || ingredient.prep || "",
    ].filter(Boolean).join(", ");
  }

  function stepData(step) {
    if (typeof step === "string") {
      return { title: "", content: step };
    }

    return {
      title: step.title || step.t || "",
      content: step.content || step.c || step.text || "",
    };
  }

  function displaySource(source) {
    if (!source) return "";

    if (typeof source === "string") return source;

    const name = source.name || source.title || "";
    const url = source.url || "";

    if (name && url) {
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`;
    }

    return escapeHtml(name || url);
  }

  async function startIndexPage() {
    const searchElement = byId("search");
    const recipesElement = byId("recipes");
    const filtersElement = byId("filters");
    const resultCountElement = byId("result-count");
    const clearButton = byId("clear-filters");
    const loadNoticeElement = byId("load-notice");

    const state = {
      query: "",
      filters: new Map(),
    };

    const ids = registryIds();

    if (!ids.length) {
      resultCountElement.textContent = "No recipes listed yet.";
      recipesElement.innerHTML = `
        <div class="empty-state">
          <p>Your recipe collection is empty.</p>
          <small>Add recipe IDs to registry.js.</small>
        </div>
      `;
      return;
    }

    const results = await Promise.all(
      ids.map(async (id) => ({
        id,
        recipe: await loadRecipe(id),
      }))
    );

    const loadedRecipes = results
      .filter((result) => result.recipe)
      .map((result) => result.recipe);

    const missingIds = results
      .filter((result) => !result.recipe)
      .map((result) => result.id);

    if (missingIds.length) {
      loadNoticeElement.hidden = false;
      loadNoticeElement.innerHTML = `
        ${missingIds.length === 1 ? "One recipe file is" : `${missingIds.length} recipe files are`}
        not available yet: <strong>${missingIds.map(escapeHtml).join(", ")}</strong>.
        Available recipes are still shown below.
      `;
    }

    if (!loadedRecipes.length) {
      resultCountElement.textContent = "No recipe files are available yet.";
      recipesElement.innerHTML = `
        <div class="empty-state">
          <p>No available recipes yet.</p>
          <small>Add a matching <code>&lt;recipe-id&gt;.js</code> file for an ID in registry.js.</small>
        </div>
      `;
      return;
    }

    function filterGroups() {
      const groups = new Map();

      for (const recipe of loadedRecipes) {
        for (const tag of recipe.tags) {
          const { group, value } = splitTag(tag);

          if (!value) continue;
          if (!groups.has(group)) groups.set(group, new Set());
          groups.get(group).add(value);
        }
      }

      return [...groups.entries()]
        .sort(([a], [b]) => labelForGroup(a).localeCompare(labelForGroup(b)))
        .map(([group, values]) => ({
          group,
          values: [...values].sort((a, b) => titleCase(a).localeCompare(titleCase(b))),
        }));
    }

    function matchesFilters(recipe) {
      for (const [group, selectedValues] of state.filters) {
        if (!selectedValues.size) continue;

        const recipeValues = recipe.tags
          .map(splitTag)
          .filter((tag) => tag.group === group)
          .map((tag) => tag.value);

        const hasMatch = [...selectedValues].some((value) => recipeValues.includes(value));

        if (!hasMatch) return false;
      }

      return true;
    }

    function visibleRecipes() {
      const query = state.query.trim().toLowerCase();

      return loadedRecipes.filter((recipe) => {
        const matchesSearch = !query || recipeSearchText(recipe).includes(query);
        return matchesSearch && matchesFilters(recipe);
      });
    }

    function renderFilters() {
      filtersElement.innerHTML = filterGroups().map(({ group, values }) => {
        const selectedValues = state.filters.get(group) || new Set();

        const buttons = values.map((value) => {
          const active = selectedValues.has(value);

          return `
            <button
              class="filter-button"
              type="button"
              data-group="${escapeHtml(group)}"
              data-value="${escapeHtml(value)}"
              aria-pressed="${active}"
            >
              ${escapeHtml(titleCase(value))}
            </button>
          `;
        }).join("");

        return `
          <section class="filter-group">
            <h2 class="filter-title">${escapeHtml(labelForGroup(group))}</h2>
            <div class="filter-options">${buttons}</div>
          </section>
        `;
      }).join("");
    }

    function renderRecipes() {
      const visible = visibleRecipes();

      resultCountElement.textContent =
        `${visible.length} ${visible.length === 1 ? "recipe" : "recipes"} found`;

      if (!visible.length) {
        recipesElement.innerHTML = `
          <div class="empty-state">
            <p>No matching recipes.</p>
            <small>Try another search term or clear your filters.</small>
          </div>
        `;
        return;
      }

      recipesElement.innerHTML = visible.map((recipe) => {
        const meta = [
          ...(recipe.tags
            .filter((tag) => splitTag(tag).group === "cuisine")
            .slice(0, 1)
            .map(displayTag)),
          recipe.baseServings ? `Serves ${recipe.baseServings}` : "",
        ].filter(Boolean);

        const cardTags = recipe.tags
          .filter((tag) => {
            const group = splitTag(tag).group;
            return ["type", "ingredient", "dietary", "method", "occasion"].includes(group);
          })
          .slice(0, 4);

        return `
          <article class="recipe-card">
            <a href="recipe.html?id=${encodeURIComponent(recipe.id)}">
              <p class="recipe-meta">${escapeHtml(meta.join(" · "))}</p>
              <h2>${escapeHtml(recipe.title)}</h2>
              <p class="recipe-description">${escapeHtml(recipe.description)}</p>

              <div class="tag-list">
                ${cardTags.map((tag) => `
                  <span class="tag">${escapeHtml(displayTag(tag))}</span>
                `).join("")}
              </div>
            </a>
          </article>
        `;
      }).join("");
    }

    function render() {
      renderFilters();
      renderRecipes();
    }

    filtersElement.addEventListener("click", (event) => {
      const button = event.target.closest(".filter-button");
      if (!button) return;

      const group = button.dataset.group;
      const value = button.dataset.value;

      if (!state.filters.has(group)) {
        state.filters.set(group, new Set());
      }

      const selectedValues = state.filters.get(group);

      if (selectedValues.has(value)) {
        selectedValues.delete(value);

        if (!selectedValues.size) {
          state.filters.delete(group);
        }
      } else {
        selectedValues.add(value);
      }

      render();
    });

    searchElement.addEventListener("input", () => {
      state.query = searchElement.value;
      renderRecipes();
    });

    clearButton.addEventListener("click", () => {
      state.query = "";
      state.filters.clear();
      searchElement.value = "";
      render();
      searchElement.focus();
    });

    render();
  }

  async function startRecipePage() {
    const loadingElement = byId("recipe-loading");
    const missingElement = byId("recipe-missing");
    const missingMessageElement = byId("recipe-missing-message");
    const detailElement = byId("recipe-detail");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    function showMissing(message) {
      loadingElement.hidden = true;
      detailElement.hidden = true;
      missingMessageElement.textContent = message;
      missingElement.hidden = false;
    }

    if (!id) {
      showMissing("No recipe was selected. Choose a recipe from the collection.");
      return;
    }

    const recipe = await loadRecipe(id);

    if (!recipe) {
      showMissing(`The recipe “${id}” could not be found or has not been added yet.`);
      return;
    }

    const titleElement = byId("recipe-title");
    const metaElement = byId("recipe-meta");
    const descriptionElement = byId("recipe-description");
    const tagsElement = byId("recipe-tags");
    const ingredientListElement = byId("ingredient-list");
    const stepListElement = byId("step-list");
    const notesElement = byId("recipe-notes");
    const notesTextElement = byId("recipe-notes-text");
    const sourceElement = byId("recipe-source");

    const decreaseButton = byId("servings-decrease");
    const increaseButton = byId("servings-increase");
    const servingsElement = byId("servings-count");
    const unitButtons = [
      byId("units-us"),
      byId("units-metric"),
    ];

    const state = {
      servings: recipe.baseServings,
      units: "us",
    };

    document.title = `${recipe.title} · Recipe Collection`;

    const cuisineTags = recipe.tags
      .filter((tag) => splitTag(tag).group === "cuisine")
      .map(displayTag);

    const typeTags = recipe.tags
      .filter((tag) => splitTag(tag).group === "type")
      .map(displayTag);

    metaElement.textContent = [
      ...cuisineTags.slice(0, 1),
      ...typeTags.slice(0, 1),
      recipe.baseServings ? `Serves ${recipe.baseServings}` : "",
    ].filter(Boolean).join(" · ");

    titleElement.textContent = recipe.title;
    descriptionElement.textContent = recipe.description;

    tagsElement.innerHTML = recipe.tags.map((tag) => `
      <span class="tag">${escapeHtml(displayTag(tag))}</span>
    `).join("");

    if (recipe.notes) {
      notesTextElement.textContent = recipe.notes;
      notesElement.hidden = false;
    }

    if (recipe.source) {
      sourceElement.innerHTML = `Source: ${displaySource(recipe.source)}`;
      sourceElement.hidden = false;
    }

    function renderIngredients() {
      const multiplier = state.servings / recipe.baseServings;

      ingredientListElement.innerHTML = recipe.ingredients.map((ingredient) => {
        const amount = ingredientMeasurement(ingredient, state.units, multiplier);
        const name = ingredientName(ingredient);

        return `
          <li>
            <span class="ingredient-amount">${escapeHtml(amount)}</span>
            <span>${escapeHtml(name)}</span>
          </li>
        `;
      }).join("");
    }

    function renderSteps() {
      stepListElement.innerHTML = recipe.steps.map((step) => {
        const { title, content } = stepData(step);

        return `
          <li>
            ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
            ${content ? `<p>${escapeHtml(content)}</p>` : ""}
          </li>
        `;
      }).join("");
    }

    function renderControls() {
      servingsElement.textContent =
        `${formatNumber(state.servings)} ${state.servings === 1 ? "serving" : "servings"}`;

      for (const button of unitButtons) {
        const active = button.dataset.unit === state.units;
        button.setAttribute("aria-pressed", String(active));
      }
    }

    function render() {
      renderControls();
      renderIngredients();
      renderSteps();
    }

    decreaseButton.addEventListener("click", () => {
      state.servings = Math.max(1, state.servings - 1);
      render();
    });

    increaseButton.addEventListener("click", () => {
      state.servings += 1;
      render();
    });

    for (const button of unitButtons) {
      button.addEventListener("click", () => {
        state.units = button.dataset.unit;
        render();
      });
    }

    loadingElement.hidden = true;
    detailElement.hidden = false;
    render();
  }

  if (page === "index") {
    startIndexPage();
  }

  if (page === "recipe") {
    startRecipePage();
  }
})();