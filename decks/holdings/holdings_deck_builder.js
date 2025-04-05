const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const CARD_WIDTH = 300;  // width of each card in pixels
const CARD_HEIGHT = 420; // height of each card in pixels
const GRID_COLS = 10;    // number of columns in the grid (changed from 7 to 10)
const GRID_ROWS = 7;     // number of rows in the grid (changed from 10 to 7)
const OUTPUT_FILENAME = 'deck.png'; // name of the output file

// Function to create a blank white card image
async function createBlankCard() {
  // Create a blank white card with a thin gray border to make it visible
  return sharp({
    create: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: Buffer.from(`<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
        <rect x="1" y="1" width="${CARD_WIDTH-2}" height="${CARD_HEIGHT-2}" 
              fill="none" stroke="#cccccc" stroke-width="1"/>
      </svg>`),
      top: 0,
      left: 0
    }
  ])
  .png()
  .toBuffer();
}

// Function to stitch images into a grid
async function createDeckSheet(imageBuffers, outputPath) {
  // Add a small padding to ensure no overlap and fit within TTS guidelines
  const padding = 0; // Can be adjusted if needed
  
  const totalWidth = CARD_WIDTH * GRID_COLS + padding * (GRID_COLS - 1);
  const totalHeight = CARD_HEIGHT * GRID_ROWS + padding * (GRID_ROWS - 1);
  
  // Create a base image (white background)
  const baseImage = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  }).png().toBuffer();
  
  // Prepare composite array for sharp
  const compositeArray = [];
  
  // Debug info
  console.log(`Creating deck with dimensions: ${totalWidth}x${totalHeight}`);
  console.log(`Card dimensions: ${CARD_WIDTH}x${CARD_HEIGHT}`);
  
  for (let i = 0; i < Math.min(imageBuffers.length, GRID_COLS * GRID_ROWS); i++) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    
    // Calculate the exact position for each card with padding
    const left = col * (CARD_WIDTH + padding);
    const top = row * (CARD_HEIGHT + padding);
    
    if (i < 3) {
      // Print the first few card positions for debugging
      console.log(`Card ${i+1} position: (${left}, ${top})`);
    }
    
    compositeArray.push({
      input: imageBuffers[i],
      left: left,
      top: top
    });
  }
  
  // Create the composite image
  await sharp(baseImage)
    .composite(compositeArray)
    .resize(totalWidth, totalHeight, { fit: 'fill' }) // Ensure exact dimensions
    .png()
    .toFile(outputPath);
  
  console.log(`Created deck sheet: ${outputPath}`);
  console.log(`Final dimensions: ${totalWidth}x${totalHeight} pixels`);
}

// Main function to process all card images
async function buildDeck() {
  console.log('Starting deck builder...');
  
  // Get the current directory
  const currentDir = __dirname;
  
  // Collect all image files in the current directory
  const files = fs.readdirSync(currentDir).filter(file => 
    file.toLowerCase().endsWith('.png') || 
    file.toLowerCase().endsWith('.jpg') ||
    file.toLowerCase().endsWith('.jpeg')
  );
  
  // Exclude the output file if it already exists
  const cardImages = files.filter(file => file !== OUTPUT_FILENAME);
  
  console.log(`Found ${cardImages.length} card images in the current directory.`);
  
  if (cardImages.length === 0) {
    console.log('No card images found. Please add card images to this directory.');
    return;
  }
  
  // Sort card images alphabetically
  cardImages.sort();
  
  // Create a blank card for filling empty slots
  const blankCardBuffer = await createBlankCard();
  
  // Load all the card images
  const imageBuffers = [];
  for (let i = 0; i < cardImages.length; i++) {
    try {
      const imagePath = path.join(currentDir, cardImages[i]);
      
      // Process each image to ensure consistent dimensions
      const imageBuffer = await sharp(imagePath)
        .resize(CARD_WIDTH, CARD_HEIGHT, {
          fit: 'fill', // Ensures images are exactly the right size
          withoutEnlargement: false
        })
        .png()
        .toBuffer();
      
      imageBuffers.push(imageBuffer);
      
      if (i === 0) {
        // Log the first image details for debugging
        const metadata = await sharp(imagePath).metadata();
        console.log(`Original image dimensions: ${metadata.width}x${metadata.height}`);
        console.log(`Target dimensions: ${CARD_WIDTH}x${CARD_HEIGHT}`);
      }
    } catch (err) {
      console.error(`Error processing image ${cardImages[i]}: ${err.message}`);
    }
  }
  
  // Check if we have more images than can fit in a single grid
  const maxCards = GRID_COLS * GRID_ROWS;
  if (imageBuffers.length > maxCards) {
    console.warn(`Warning: Found ${imageBuffers.length} images, but only ${maxCards} can fit in the grid.`);
    console.warn(`Only the first ${maxCards} images will be included in the deck.`);
    
    // Trim the array to the maximum size
    imageBuffers.splice(maxCards);
  }
  
  // Fill the remaining slots with blank cards
  const remainingSlots = maxCards - imageBuffers.length;
  for (let i = 0; i < remainingSlots; i++) {
    imageBuffers.push(blankCardBuffer);
  }
  
  // Create the output path
  const outputPath = path.join(currentDir, OUTPUT_FILENAME);
  
  // Generate the deck sheet
  await createDeckSheet(imageBuffers, outputPath);
  
  console.log('Deck creation complete!');
  console.log(`Total cards in deck: ${imageBuffers.length - remainingSlots}`);
  console.log(`Empty slots filled: ${remainingSlots}`);
}

// Run the process
buildDeck().catch(err => {
  console.error('Error in deck building process:', err);
});