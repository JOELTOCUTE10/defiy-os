"""Starter food reference database (~60 foods with estimated nutritional values per serving)."""

FOODS_DATABASE = [
    # Protein / Meat / Poultry / Fish / Eggs
    {"name": "Chicken Breast (cooked, skinless)", "quantity": 100, "unit": "g", "calories": 165, "protein_g": 31.0, "carbs_g": 0.0, "fat_g": 3.6, "fiber_g": 0.0, "micronutrients": {"iron_mg": 1.0, "potassium_mg": 256}},
    {"name": "Chicken Thigh (cooked, skinless)", "quantity": 100, "unit": "g", "calories": 209, "protein_g": 26.0, "carbs_g": 0.0, "fat_g": 10.9, "fiber_g": 0.0, "micronutrients": {"iron_mg": 1.3, "potassium_mg": 222}},
    {"name": "Lean Ground Beef (90/10, cooked)", "quantity": 100, "unit": "g", "calories": 215, "protein_g": 26.1, "carbs_g": 0.0, "fat_g": 11.5, "fiber_g": 0.0, "micronutrients": {"iron_mg": 2.7, "zinc_mg": 6.3}},
    {"name": "Salmon Fillet (baked/grilled)", "quantity": 100, "unit": "g", "calories": 206, "protein_g": 22.0, "carbs_g": 0.0, "fat_g": 12.3, "fiber_g": 0.0, "micronutrients": {"vitamin_d_iu": 520, "omega3_g": 2.2}},
    {"name": "Tuna (canned in water)", "quantity": 100, "unit": "g", "calories": 116, "protein_g": 25.5, "carbs_g": 0.0, "fat_g": 0.8, "fiber_g": 0.0, "micronutrients": {"sodium_mg": 350}},
    {"name": "Large Egg (whole, cooked)", "quantity": 1, "unit": "large egg", "calories": 72, "protein_g": 6.3, "carbs_g": 0.4, "fat_g": 4.8, "fiber_g": 0.0, "micronutrients": {"choline_mg": 147, "vitamin_b12_mcg": 0.45}},
    {"name": "Egg White", "quantity": 1, "unit": "egg white", "calories": 17, "protein_g": 3.6, "carbs_g": 0.2, "fat_g": 0.1, "fiber_g": 0.0, "micronutrients": {}},
    {"name": "Turkey Breast (cooked)", "quantity": 100, "unit": "g", "calories": 135, "protein_g": 30.0, "carbs_g": 0.0, "fat_g": 1.0, "fiber_g": 0.0, "micronutrients": {"selenium_mcg": 31}},
    {"name": "Tofu (firm)", "quantity": 100, "unit": "g", "calories": 83, "protein_g": 10.0, "carbs_g": 2.3, "fat_g": 5.0, "fiber_g": 1.0, "micronutrients": {"calcium_mg": 200, "iron_mg": 2.7}},
    {"name": "Shrimp (cooked)", "quantity": 100, "unit": "g", "calories": 99, "protein_g": 24.0, "carbs_g": 0.2, "fat_g": 0.3, "fiber_g": 0.0, "micronutrients": {"selenium_mcg": 38}},

    # Dairy / Dairy Alternatives
    {"name": "Greek Yogurt (non-fat, plain)", "quantity": 170, "unit": "g", "calories": 100, "protein_g": 17.0, "carbs_g": 6.0, "fat_g": 0.7, "fiber_g": 0.0, "micronutrients": {"calcium_mg": 187, "probiotics": True}},
    {"name": "Whole Milk", "quantity": 240, "unit": "ml", "calories": 149, "protein_g": 7.7, "carbs_g": 11.7, "fat_g": 8.0, "fiber_g": 0.0, "micronutrients": {"calcium_mg": 276, "vitamin_d_iu": 120}},
    {"name": "Almond Milk (unsweetened)", "quantity": 240, "unit": "ml", "calories": 30, "protein_g": 1.0, "carbs_g": 1.0, "fat_g": 2.5, "fiber_g": 1.0, "micronutrients": {"calcium_mg": 450, "vitamin_e_mg": 7.5}},
    {"name": "Cheddar Cheese", "quantity": 28, "unit": "g", "calories": 115, "protein_g": 7.0, "carbs_g": 0.4, "fat_g": 9.4, "fiber_g": 0.0, "micronutrients": {"calcium_mg": 200}},
    {"name": "Cottage Cheese (low-fat)", "quantity": 113, "unit": "g", "calories": 90, "protein_g": 14.0, "carbs_g": 4.5, "fat_g": 1.5, "fiber_g": 0.0, "micronutrients": {"sodium_mg": 400}},
    {"name": "Whey Protein Powder", "quantity": 30, "unit": "g scoop", "calories": 120, "protein_g": 24.0, "carbs_g": 3.0, "fat_g": 1.5, "fiber_g": 0.0, "micronutrients": {"bcaa_g": 5.5}},

    # Grains & Carbs
    {"name": "White Rice (cooked)", "quantity": 158, "unit": "g cup", "calories": 205, "protein_g": 4.2, "carbs_g": 44.5, "fat_g": 0.4, "fiber_g": 0.6, "micronutrients": {"folate_mcg": 90}},
    {"name": "Brown Rice (cooked)", "quantity": 195, "unit": "g cup", "calories": 218, "protein_g": 4.5, "carbs_g": 45.8, "fat_g": 1.6, "fiber_g": 3.5, "micronutrients": {"magnesium_mg": 86}},
    {"name": "Oatmeal (rolled oats, cooked)", "quantity": 234, "unit": "g cup", "calories": 166, "protein_g": 5.9, "carbs_g": 28.1, "fat_g": 3.6, "fiber_g": 4.0, "micronutrients": {"beta_glucan_g": 2.0, "iron_mg": 2.1}},
    {"name": "Quinoa (cooked)", "quantity": 185, "unit": "g cup", "calories": 222, "protein_g": 8.1, "carbs_g": 39.4, "fat_g": 3.6, "fiber_g": 5.2, "micronutrients": {"iron_mg": 2.8, "magnesium_mg": 118}},
    {"name": "Whole Wheat Bread", "quantity": 1, "unit": "slice", "calories": 80, "protein_g": 4.0, "carbs_g": 13.8, "fat_g": 1.0, "fiber_g": 2.0, "micronutrients": {"b_vitamins": True}},
    {"name": "Whole Wheat Pasta (cooked)", "quantity": 140, "unit": "g cup", "calories": 174, "protein_g": 7.5, "carbs_g": 37.0, "fat_g": 0.8, "fiber_g": 4.5, "micronutrients": {}},
    {"name": "Sweet Potato (baked)", "quantity": 114, "unit": "medium", "calories": 103, "protein_g": 2.3, "carbs_g": 23.6, "fat_g": 0.2, "fiber_g": 3.8, "micronutrients": {"vitamin_a_iu": 22000, "potassium_mg": 542}},
    {"name": "White Potato (baked)", "quantity": 173, "unit": "medium", "calories": 161, "protein_g": 4.3, "carbs_g": 36.6, "fat_g": 0.2, "fiber_g": 3.8, "micronutrients": {"potassium_mg": 926, "vitamin_c_mg": 16.6}},
    {"name": "Tortilla (Whole Wheat)", "quantity": 1, "unit": "medium tortilla", "calories": 130, "protein_g": 4.0, "carbs_g": 22.0, "fat_g": 3.0, "fiber_g": 3.0, "micronutrients": {}},
    {"name": "Bagel (Plain)", "quantity": 1, "unit": "medium bagel", "calories": 245, "protein_g": 9.0, "carbs_g": 48.0, "fat_g": 1.5, "fiber_g": 2.0, "micronutrients": {}},

    # Fruits
    {"name": "Banana", "quantity": 1, "unit": "medium", "calories": 105, "protein_g": 1.3, "carbs_g": 27.0, "fat_g": 0.3, "fiber_g": 3.1, "micronutrients": {"potassium_mg": 422, "vitamin_b6_mg": 0.4}},
    {"name": "Apple", "quantity": 1, "unit": "medium", "calories": 95, "protein_g": 0.5, "carbs_g": 25.0, "fat_g": 0.3, "fiber_g": 4.4, "micronutrients": {"vitamin_c_mg": 8.4}},
    {"name": "Blueberries", "quantity": 148, "unit": "g cup", "calories": 84, "protein_g": 1.1, "carbs_g": 21.4, "fat_g": 0.5, "fiber_g": 3.6, "micronutrients": {"antioxidants": True, "vitamin_c_mg": 14.4}},
    {"name": "Strawberries", "quantity": 152, "unit": "g cup", "calories": 49, "protein_g": 1.0, "carbs_g": 11.7, "fat_g": 0.5, "fiber_g": 3.0, "micronutrients": {"vitamin_c_mg": 89.4}},
    {"name": "Orange", "quantity": 1, "unit": "medium", "calories": 62, "protein_g": 1.2, "carbs_g": 15.4, "fat_g": 0.2, "fiber_g": 3.1, "micronutrients": {"vitamin_c_mg": 70.0, "folate_mcg": 40}},
    {"name": "Avocado", "quantity": 1, "unit": "medium", "calories": 240, "protein_g": 3.0, "carbs_g": 12.0, "fat_g": 22.0, "fiber_g": 10.0, "micronutrients": {"potassium_mg": 708, "vitamin_e_mg": 2.7}},
    {"name": "Grapes", "quantity": 151, "unit": "g cup", "calories": 104, "protein_g": 1.1, "carbs_g": 27.3, "fat_g": 0.2, "fiber_g": 1.4, "micronutrients": {"resveratrol": True}},
    {"name": "Mango", "quantity": 165, "unit": "g cup sliced", "calories": 99, "protein_g": 1.4, "carbs_g": 24.7, "fat_g": 0.6, "fiber_g": 2.6, "micronutrients": {"vitamin_a_iu": 1785, "vitamin_c_mg": 60}},
    {"name": "Pineapple", "quantity": 165, "unit": "g cup chunks", "calories": 82, "protein_g": 0.9, "carbs_g": 21.6, "fat_g": 0.2, "fiber_g": 2.3, "micronutrients": {"vitamin_c_mg": 78.9, "manganese_mg": 1.5}},

    # Vegetables
    {"name": "Broccoli (cooked)", "quantity": 156, "unit": "g cup", "calories": 55, "protein_g": 3.7, "carbs_g": 11.2, "fat_g": 0.6, "fiber_g": 5.1, "micronutrients": {"vitamin_c_mg": 101, "vitamin_k_mcg": 220}},
    {"name": "Spinach (raw)", "quantity": 30, "unit": "g cup", "calories": 7, "protein_g": 0.9, "carbs_g": 1.1, "fat_g": 0.1, "fiber_g": 0.7, "micronutrients": {"iron_mg": 0.8, "folate_mcg": 58, "vitamin_k_mcg": 145}},
    {"name": "Carrots (raw)", "quantity": 128, "unit": "g cup chopped", "calories": 52, "protein_g": 1.2, "carbs_g": 12.3, "fat_g": 0.3, "fiber_g": 3.6, "micronutrients": {"vitamin_a_iu": 21383}},
    {"name": "Bell Pepper (Red)", "quantity": 149, "unit": "g cup chopped", "calories": 46, "protein_g": 1.5, "carbs_g": 9.0, "fat_g": 0.4, "fiber_g": 3.1, "micronutrients": {"vitamin_c_mg": 190}},
    {"name": "Cucumber", "quantity": 100, "unit": "g", "calories": 15, "protein_g": 0.7, "carbs_g": 3.6, "fat_g": 0.1, "fiber_g": 0.5, "micronutrients": {"water_g": 95}},
    {"name": "Tomato", "quantity": 1, "unit": "medium", "calories": 22, "protein_g": 1.1, "carbs_g": 4.8, "fat_g": 0.2, "fiber_g": 1.5, "micronutrients": {"lycopene_mg": 3.2, "vitamin_c_mg": 17}},
    {"name": "Asparagus (cooked)", "quantity": 180, "unit": "g cup", "calories": 40, "protein_g": 4.3, "carbs_g": 7.4, "fat_g": 0.4, "fiber_g": 3.6, "micronutrients": {"folate_mcg": 268}},
    {"name": "Green Beans (cooked)", "quantity": 125, "unit": "g cup", "calories": 44, "protein_g": 2.4, "carbs_g": 9.9, "fat_g": 0.3, "fiber_g": 4.0, "micronutrients": {}},

    # Legumes & Nuts & Seeds
    {"name": "Black Beans (cooked)", "quantity": 172, "unit": "g cup", "calories": 227, "protein_g": 15.2, "carbs_g": 40.8, "fat_g": 0.9, "fiber_g": 15.0, "micronutrients": {"folate_mcg": 256, "iron_mg": 3.6}},
    {"name": "Chickpeas (cooked)", "quantity": 164, "unit": "g cup", "calories": 269, "protein_g": 14.5, "carbs_g": 45.0, "fat_g": 4.2, "fiber_g": 12.5, "micronutrients": {"folate_mcg": 282}},
    {"name": "Lentils (cooked)", "quantity": 198, "unit": "g cup", "calories": 230, "protein_g": 17.9, "carbs_g": 39.9, "fat_g": 0.8, "fiber_g": 15.6, "micronutrients": {"iron_mg": 6.6, "folate_mcg": 358}},
    {"name": "Almonds", "quantity": 28, "unit": "g oz", "calories": 164, "protein_g": 6.0, "carbs_g": 6.1, "fat_g": 14.2, "fiber_g": 3.5, "micronutrients": {"vitamin_e_mg": 7.3, "magnesium_mg": 76}},
    {"name": "Peanut Butter", "quantity": 32, "unit": "tbsp (2 tbsp)", "calories": 188, "protein_g": 8.0, "carbs_g": 7.0, "fat_g": 16.0, "fiber_g": 2.0, "micronutrients": {"niacin_mg": 4.3}},
    {"name": "Chia Seeds", "quantity": 28, "unit": "g oz", "calories": 138, "protein_g": 4.7, "carbs_g": 11.9, "fat_g": 8.7, "fiber_g": 9.8, "micronutrients": {"omega3_g": 5.0, "calcium_mg": 179}},
    {"name": "Walnuts", "quantity": 28, "unit": "g oz", "calories": 185, "protein_g": 4.3, "carbs_g": 3.9, "fat_g": 18.5, "fiber_g": 1.9, "micronutrients": {"omega3_g": 2.5}},

    # Fats / Oils / Condiments
    {"name": "Olive Oil", "quantity": 15, "unit": "tbsp", "calories": 119, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 13.5, "fiber_g": 0.0, "micronutrients": {"vitamin_e_mg": 1.9}},
    {"name": "Butter", "quantity": 14, "unit": "tbsp", "calories": 102, "protein_g": 0.1, "carbs_g": 0.0, "fat_g": 11.5, "fiber_g": 0.0, "micronutrients": {"vitamin_a_iu": 350}},
    {"name": "Hummus", "quantity": 30, "unit": "tbsp (2 tbsp)", "calories": 70, "protein_g": 2.0, "carbs_g": 4.0, "fat_g": 5.0, "fiber_g": 1.5, "micronutrients": {}},

    # Common Dishes / Prepared Foods
    {"name": "Pizza Slice (Cheese)", "quantity": 1, "unit": "slice (107g)", "calories": 285, "protein_g": 12.0, "carbs_g": 35.0, "fat_g": 10.4, "fiber_g": 2.5, "micronutrients": {"calcium_mg": 210}},
    {"name": "Burrito Bowl (Chicken, Rice, Beans)", "quantity": 1, "unit": "bowl", "calories": 650, "protein_g": 42.0, "carbs_g": 72.0, "fat_g": 20.0, "fiber_g": 11.0, "micronutrients": {"sodium_mg": 1200}},
    {"name": "Protein Bar", "quantity": 1, "unit": "bar (60g)", "calories": 210, "protein_g": 20.0, "carbs_g": 22.0, "fat_g": 7.0, "fiber_g": 8.0, "micronutrients": {}},
    {"name": "Dark Chocolate (70%)", "quantity": 28, "unit": "g oz", "calories": 170, "protein_g": 2.2, "carbs_g": 13.0, "fat_g": 12.0, "fiber_g": 3.1, "micronutrients": {"magnesium_mg": 65}},
]
