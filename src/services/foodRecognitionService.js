// Food recognition using Logmeal API + Open Food Facts
const LOGMEAL_API_KEY = import.meta.env.VITE_LOGMEAL_API_KEY;
const LOGMEAL_API_URL = 'https://api.logmeal.com/v2/recognition/dish';

export const foodRecognitionService = {
  // Recognize food from image using Logmeal API
  async recognizeFood(imageFile) {
    try {
      if (!LOGMEAL_API_KEY) {
        throw new Error('Logmeal API key not configured');
      }

      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);

      const response = await fetch(LOGMEAL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOGMEAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image.split(',')[1], // Remove data:image prefix
        }),
      });

      if (!response.ok) {
        throw new Error(`Logmeal API error: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      console.error('Food recognition error:', err);
      return { data: null, error: err.message };
    }
  },

  // Get nutrition data using Logmeal's nutrition endpoint
  async getNutritionEstimate(foodName, imageFile = null) {
    try {
      if (!LOGMEAL_API_KEY) {
        throw new Error('Logmeal API key not configured');
      }

      let requestBody = {};

      if (imageFile) {
        // Use image for more accurate nutrition estimate
        const base64Image = await this.fileToBase64(imageFile);
        requestBody.image = base64Image.split(',')[1];
      } else {
        // Use text-based search
        requestBody.foodName = foodName;
      }

      const response = await fetch('https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOGMEAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Nutrition API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse nutrition data
      const nutrition = {
        calories: Math.round(data.nutritional_info?.calories || 0),
        protein: Math.round(data.nutritional_info?.proteins || 0),
        carbs: Math.round(data.nutritional_info?.carbs || 0),
        fats: Math.round(data.nutritional_info?.fats || 0),
      };

      return { data: nutrition, error: null };
    } catch (err) {
      console.error('Nutrition estimate error:', err);
      return { data: null, error: err.message };
    }
  },

  // Search Open Food Facts as a fallback
  async searchOpenFoodFacts(query) {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`
      );

      if (!response.ok) {
        throw new Error('Open Food Facts API error');
      }

      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        return { data: [], error: null };
      }

      // Map to our format
      const products = data.products.map(product => ({
        name: product.product_name || 'Unknown',
        brand: product.brands || '',
        calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
        protein: Math.round(product.nutriments?.proteins_100g || 0),
        carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
        fats: Math.round(product.nutriments?.fat_100g || 0),
        serving_size: product.serving_size || '100g',
        imageUrl: product.image_url,
      }));

      return { data: products, error: null };
    } catch (err) {
      console.error('Open Food Facts search error:', err);
      return { data: [], error: err.message };
    }
  },

  // Convert File to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  },

  // Combined workflow: Photo -> Recognition -> Nutrition
  async analyzeFood(imageFile) {
    try {
      // Step 1: Recognize food in image
      const { data: recognition, error: recognitionError } = await this.recognizeFood(imageFile);

      if (recognitionError) {
        return { data: null, error: recognitionError };
      }

      // Extract detected food name
      const detectedFood = recognition?.recognition_results?.[0];
      if (!detectedFood) {
        return { data: null, error: 'No food detected in image' };
      }

      const foodName = detectedFood.name || 'Unknown food';
      const confidence = Math.round((detectedFood.prob || 0) * 100);

      // Step 2: Get nutrition estimate from the image
      const { data: nutrition, error: nutritionError } = await this.getNutritionEstimate(foodName, imageFile);

      if (nutritionError) {
        // Fallback to Open Food Facts
        const { data: products } = await this.searchOpenFoodFacts(foodName);
        const fallbackNutrition = products[0] || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };

        return {
          data: {
            name: foodName,
            confidence,
            nutrition: fallbackNutrition,
            source: 'open_food_facts',
          },
          error: null,
        };
      }

      return {
        data: {
          name: foodName,
          confidence,
          nutrition,
          source: 'logmeal',
        },
        error: null,
      };
    } catch (err) {
      console.error('Food analysis error:', err);
      return { data: null, error: err.message };
    }
  },
};

export default foodRecognitionService;
