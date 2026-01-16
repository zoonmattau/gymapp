# Logmeal API Setup Guide

Follow these steps to enable food photo recognition in your UpRep app.

## Step 1: Get Your Free Logmeal API Key

1. Go to **https://logmeal.com/**
2. Click **"Sign Up"** or **"Get Started"**
3. Create a free account with your email
4. After logging in, go to your **Dashboard** or **API Keys** section
5. Copy your **API Key** (it will look like: `YOUR_LOGMEAL_API_KEY_HERE`)

**Free tier includes:**
- 100 API calls per month
- Food recognition from photos
- Nutrition estimation
- No credit card required

## Step 2: Add API Key to Your Project

1. Create a `.env` file in your project root (same folder as `package.json`):

```bash
# In M:\projects\uprep\
touch .env
```

2. Open `.env` and add your API key:

```env
VITE_LOGMEAL_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Example:**
```env
VITE_LOGMEAL_API_KEY=lm_abc123def456ghi789jkl012mno345pqr678stu901
```

3. **Restart your dev server** (important!):

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 3: Test It Out!

1. Go to your app at **http://localhost:5173/**
2. Navigate to the **Health tab** → **Meals**
3. Click **"Log Meal"**
4. Click **"Take Photo of Food"**
5. Take or upload a photo of food
6. Watch the AI recognize it and auto-fill the nutrition info!

## Troubleshooting

### "Logmeal API key not configured" error
- Make sure your `.env` file is in the root folder (same level as `package.json`)
- Check that the variable name is exactly `VITE_LOGMEAL_API_KEY`
- Restart your dev server after creating/editing `.env`

### "API error: 401" or authentication failed
- Your API key might be incorrect - double-check it in the Logmeal dashboard
- Make sure there are no extra spaces before/after the key in `.env`

### "API error: 429" or rate limit exceeded
- You've used your 100 free monthly requests
- Wait until next month or upgrade your Logmeal plan

### Food not recognized
- Make sure the photo is clear and well-lit
- Try to have the food centered in the frame
- Some complex mixed dishes may not be recognized accurately

## What Happens Behind the Scenes

1. **Photo Capture** → User takes photo with phone camera
2. **Logmeal AI** → Recognizes food items in the image
3. **Nutrition Estimation** → Estimates calories, protein, carbs, and fats
4. **Fallback to Open Food Facts** → If Logmeal fails, searches Open Food Facts database
5. **Auto-Fill Form** → Detected values populate the meal entry form
6. **Manual Editing** → User can adjust values before saving

## Security Notes

- **Never commit your `.env` file to Git!** (it's already in `.gitignore`)
- Don't share your API key publicly
- Each developer should have their own API key

## Alternative: Using Without API Key

If you don't want to use Logmeal, the app still works perfectly fine:
- Users can manually enter calories, protein, carbs, and fats
- The "Take Photo" button won't appear if no API key is configured
- All nutrition tracking features still work normally
