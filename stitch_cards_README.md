# Card Stitcher

This script combines individual card images into deck sheets (7×10 grids).

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Setup

1. Rename `stitch_cards_package.json` to `package.json`
   ```
   mv stitch_cards_package.json package.json
   ```

2. Install dependencies
   ```
   npm install
   ```

## Usage

1. Make sure you've generated all your card images using `card_generator.js` first.

2. Run the stitching script:
   ```
   node stitch_cards.js
   ```

3. The resulting deck sheets will be saved in the `deck_sheets` directory.

## How It Works

- The script scans all card type directories (`Descendants`, `Holdings`, `Fates`, `Vessels`, `Works`) in the `generated_cards` folder.
- It collects all PNG/JPG images and arranges them in a 7×10 grid.
- If there are fewer than 70 cards, it fills the remaining spaces with blank white cards.
- Multiple deck sheets will be created if there are more than 70 cards.

## Customization

You can adjust these variables at the top of the script:

- `CARD_WIDTH` and `CARD_HEIGHT`: Dimensions of each card in pixels
- `GRID_COLS` and `GRID_ROWS`: Grid layout (defaults to 7×10)
- `sourceDirs`: Directories to scan for card images
- `outputDir`: Where to save the deck sheets