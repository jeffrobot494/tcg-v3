# TTS Deck Builder

A simple script to create a 10×7 grid of card images for Tabletop Simulator.

## How to Use

1. **Setup (First Time Only)**
   - Make sure you have Node.js installed
   - Run `npm install` to get the required dependencies

2. **Build a Deck**
   - Copy `deck_builder.js` into a folder with your card images
   - Run the script: `node deck_builder.js`
   - The script will create a `deck.png` file in the same folder

## What It Does

- Finds all image files (PNG, JPG) in the current directory
- Arranges them in a 10×7 grid (70 cards total)
- Fills any empty slots with blank white cards
- Creates a single `deck.png` file ready for TTS import

## Notes

- Images are arranged alphabetically by filename
- If you have more than 70 images, only the first 70 will be used
- Recommended: Name your files with prefixes like "01_", "02_" to control order

## Customization

You can edit these values at the top of the script:
- Card dimensions (defaults to 300×420 pixels)
- Grid size (defaults to 7×10)
- Output filename (defaults to "deck.png")