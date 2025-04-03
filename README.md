# War for the Stars Card Builder

This tool allows you to generate cards for the War for the Stars card game by reading data from Google Sheets and creating styled card images.

## Setup Instructions

### 1. Make Your Google Sheets Accessible

1. Open your Google Sheet
2. Click "Share" in the top right
3. Click "Change to anyone with the link"
4. Set to "Viewer" access
5. Click "Done"

### 2. Install Dependencies

```bash
npm install
```

### 3. Fetching Card Data

Run one of the following commands to fetch card data from Google Sheets:

```bash
# Recommended method (direct CSV export)
npm run fetch-simple

# Alternative method (requires Google API key)
npm run fetch-cards
```

This will create a `card_data` directory with `all_cards.json` containing all your card information.

### 4. Generating Card Images

After fetching the card data, generate card images with:

```bash
npm run generate-images
```

This will:
1. Process all cards in your data
2. Create styled HTML versions of each card
3. Render them as PNG images in the `generated_cards` directory

## Customizing Cards

### Card Template

The `card_template.html` file contains the HTML/CSS template used for rendering cards. You can modify this to change the appearance of your cards.

### Card Images

The script attempts to find images for cards in the following order:
1. An image named after the card (e.g., "heavy_assault_trooper.png")
2. A default image for the faction and card type (e.g., "mars_dominion_descendants.png")
3. A placeholder image for the card type (e.g., "descendants_placeholder.png")
4. The video file "md_00.mp4" as a fallback

Place card art in the `card_art` directory.

## Card Data Structure

Your Google Sheets should follow this structure:

1. **Descendants** (characters/units)
   - name, text, faction, force, psyche, vector, sync, etc.

2. **Vessels** (spaceships)
   - name, text, faction, force, vector, etc.

3. **Fates** (events/instants)
   - name, text, materia_cost, data_cost, anima_cost, etc.

4. **Works** (installations)
   - name, text, materia_cost, data_cost, anima_cost, etc.

5. **Holdings** (locations)
   - name, text, garrison, etc.

## Troubleshooting

- If card images aren't rendering properly, check the browser console for errors
- If card data isn't loading, ensure your Google Sheet is properly shared
- For missing images, check that your art files are in the correct location and format