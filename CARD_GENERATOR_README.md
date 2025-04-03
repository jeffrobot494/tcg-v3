# War for the Stars Card Generator System

This document explains how the card generation system works for the War for the Stars card game, including how templates are structured, how data is populated, and how to generate card images.

## System Overview

The card generation system consists of three main components:

1. **Template HTML Files** - The visual design for each card type
2. **Card Data** - JSON file containing all card information
3. **Card Generator Script** - JavaScript code that combines templates with data to create card images

## Template HTML Files

Templates are HTML files that define the appearance of each card type. Each template uses CSS for styling and JavaScript to load data dynamically.

### Available Templates:

- `descendant_template.html` - For Descendant cards (characters)
- `holdings_template.html` - For Holdings cards (locations)
- `vessels_template.html` - For Vessel cards (ships)
- `works_template.html` - For Works cards (installations)
- `fate_template.html` - For Fate cards (events)

### Template Structure:

Each template follows a similar structure:

1. **HTML Structure**:
   - Card container with styled background
   - Image area for card art
   - Text areas for card attributes and effects
   - Various visual elements like scanlines, borders, and indicators

2. **CSS Styling**:
   - Card dimensions (300px × 420px)
   - Retro computer terminal aesthetic with appropriate color schemes
   - Visual effects (scanlines, glows, noise textures)
   - Text formatting and positioning

3. **JavaScript Functions**:
   - `DOMContentLoaded` event listener to fetch and display card data
   - Functions to set attribute bars (Force, Psyche, Vector, Sync)
   - Content population from JSON data
   - Dynamic text sizing based on title length

### Template HTML Elements:

Templates include elements with specific IDs that are used to populate content:

- `cardName` - The card's name
- `cardImage` - The card's artwork
- `cardEffect` - The card's effect text
- Card type-specific fields (e.g., `statForce`, `cardEnvironment`, etc.)

## Card Data (all_cards.json)

The `all_cards.json` file in the `card_data` directory contains structured data for all cards organized by type:

```json
{
  "Descendants": [
    {
      "Name": "Blitzjager",
      "image name": "blitzjager.png",
      "Translation": "Strike Hunter",
      "Cost": "3m",
      "Sex": "M",
      "Race": "Marsdominium",
      "Force": "2",
      "Psyche": "1",
      ...
    },
    ...
  ],
  "Vessels": [...],
  "Holdings": [...],
  "Works": [...],
  "Fates": [...]
}
```

### Common Card Properties:

- `Name` - Card name
- `image name` - Filename of card art in `card_art/` directory
- `Cost` - Resources needed to play the card
- `Effect` - Card's game effect

### Type-Specific Properties:

- **Descendants**: Force, Psyche, Vector, Sync, Race, Sex, Height, Sign, Trait
- **Holdings**: Sector, Environment, Garrison, Population, Resource, Flavor
- **Vessels**: Force, Psyche, Vector, Sync, Race, Size, Layout
- **Works**: No additional specific properties
- **Fates**: No additional specific properties

## Card Generator Script (card_generator.js)

The card generator is a Node.js script that:

1. Loads templates and card data
2. Creates a browser instance using Puppeteer
3. Renders each card by combining template HTML with card data
4. Captures screenshots of the rendered cards
5. Saves them as PNG images in appropriate directories

### Key Functions:

- **Loading Resources**:
  - Loads card data from `card_data/all_cards.json`
  - Loads HTML templates for each card type
  - Creates output directories if they don't exist

- **Image Handling**:
  - Caches images as base64 encoded strings for efficient rendering
  - Provides a placeholder for missing images

- **Card Generation**:
  - Renders each card in a headless browser
  - Injects card data into the template using DOM manipulation
  - Takes high-resolution screenshots
  - Saves images to appropriate output directories

### Command Line Usage:

```
node card_generator.js [options]

Options:
  --type, -t <type>    Generate only cards of specific type(s)
                       Valid types: Descendants, Holdings, Vessels, Works, Fates
                       Multiple types can be specified with comma: -t Descendants,Holdings
  
  --help, -h           Show this help message

Examples:
  node card_generator.js                     Generate all card types
  node card_generator.js -t Descendants      Generate only Descendant cards
  node card_generator.js -t Holdings,Vessels Generate Holdings and Vessels cards
```

## Output Structure

Generated card images are saved to:

```
/generated_cards/
  ├── Descendants/
  │   └── [Card Name].png
  ├── Holdings/
  │   └── [Card Name].png
  ├── Vessels/
  │   └── [Card Name].png
  ├── Works/
  │   └── [Card Name].png
  └── Fates/
      └── [Card Name].png
```

## Workflow for Editing Cards

### To Edit Card Templates:

1. Open the appropriate template file (e.g., `holdings_template.html`)
2. Modify the HTML structure or CSS styling as needed
3. Test the template by opening it in a browser
4. The template will load the first card of its type from `all_cards.json`

### To Add or Edit Card Data:

1. Open `card_data/all_cards.json`
2. Add new card entries or modify existing ones
3. Make sure all required fields for the card type are included

### To Generate Card Images:

1. Run `node card_generator.js` to generate all cards
2. Or specify card types: `node card_generator.js -t Holdings`
3. Check the generated images in the `generated_cards/` directory

## Technical Notes

- **Puppeteer**: The system uses Puppeteer to create a headless Chrome browser for rendering cards
- **Resolution**: Cards are generated at 2x resolution for high-quality images
- **Asset Paths**: The generator handles relative paths, converting them to absolute for rendering
- **Error Handling**: The generator continues even if some cards or images are missing

## Common Issues and Solutions

- **Missing Images**: Check that image files exist in the `card_art/` directory and are named correctly
- **Render Issues**: Inspect the template HTML in a browser to identify styling problems
- **Path Problems**: Ensure paths are relative to the project root in templates

## Example: Card Customization

To create a new Holdings card:

1. Add an entry to the Holdings array in `all_cards.json`:
   ```json
   {
     "Name": "New Settlement",
     "image name": "new_settlement.png",
     "Body": "Mars",
     "Environment": "Low-g",
     "Garrison": "2",
     "Population": "4",
     "Resource": "Materia",
     "Effect": "Your effect text here.",
     "Flavor": "Flavor text here."
   }
   ```

2. Place the corresponding image in `card_art/new_settlement.png`

3. Run `node card_generator.js -t Holdings` to generate the new card

The generated card will be saved to `generated_cards/Holdings/New_Settlement.png`.