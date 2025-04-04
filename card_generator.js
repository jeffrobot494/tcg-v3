const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Paths to resources
const CARD_DATA_PATH = path.join(__dirname, 'card_data', 'all_cards.json');
const ASSET_DIR = path.join(__dirname, 'card_art');

// Template paths
const TEMPLATES = {
  Descendants: {
    path: path.join(__dirname, 'descendant_template.html'),
    outputDir: path.join(__dirname, 'generated_cards', 'Descendants')
  },
  Holdings: {
    path: path.join(__dirname, 'holdings_template.html'),
    outputDir: path.join(__dirname, 'generated_cards', 'Holdings')
  },
  Vessels: {
    path: path.join(__dirname, 'vessels_template.html'),
    outputDir: path.join(__dirname, 'generated_cards', 'Vessels')
  },
  Works: {
    path: path.join(__dirname, 'works_template.html'),
    outputDir: path.join(__dirname, 'generated_cards', 'Works')
  },
  Fates: {
    path: path.join(__dirname, 'fate_template.html'),
    outputDir: path.join(__dirname, 'generated_cards', 'Fates')
  }
};

// Create output directories if they don't exist
for (const cardType in TEMPLATES) {
  if (!fs.existsSync(TEMPLATES[cardType].outputDir)) {
    fs.mkdirSync(TEMPLATES[cardType].outputDir, { recursive: true });
  }
}

// Load the card data
let cardData;
try {
  cardData = JSON.parse(fs.readFileSync(CARD_DATA_PATH, 'utf8'));
  console.log('Loaded card data with:');
  for (const cardType in TEMPLATES) {
    console.log(`- ${cardData[cardType]?.length || 0} ${cardType}`);
  }
} catch (error) {
  console.error(`Error loading card data: ${error.message}`);
  process.exit(1);
}

// Load templates
const templateHtml = {};
for (const cardType in TEMPLATES) {
  try {
    templateHtml[cardType] = fs.readFileSync(TEMPLATES[cardType].path, 'utf8');
    console.log(`Loaded ${cardType} template`);
  } catch (error) {
    console.error(`Error loading ${cardType} template: ${error.message}`);
    // Continue even if some templates are missing
  }
}

// Cache for base64 encoded images
const imageCache = {};

// Function to get base64 encoded image
function getBase64Image(imageName) {
  // Return from cache if available
  if (imageCache[imageName]) {
    return imageCache[imageName];
  }
  
  // Load and encode the image
  try {
    const imagePath = path.join(ASSET_DIR, imageName);
    if (fs.existsSync(imagePath)) {
      const imageData = fs.readFileSync(imagePath);
      const base64Image = `data:image/png;base64,${imageData.toString('base64')}`;
      imageCache[imageName] = base64Image; // Cache for future use
      return base64Image;
    } else {
      console.error(`Could not find image: ${imageName}`);
    }
  } catch (error) {
    console.error(`Error loading image ${imageName}: ${error.message}`);
  }
  
  // Return a placeholder for missing images
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
}

// Process command line arguments
const args = process.argv.slice(2);
let cardTypesToGenerate = [];
let help = false;

// Parse command line arguments
console.log('Command line arguments:', args);

for (let i = 0; i < args.length; i++) {
  const arg = args[i].toLowerCase();
  console.log(`Processing argument [${i}]: "${arg}"`);
  
  if (arg === '--help' || arg === '-h') {
    help = true;
  } else if (arg === '--type' || arg === '-t') {
    // Get the type argument
    if (i + 1 < args.length) {
      const typeArg = args[i + 1];
      console.log(`Type argument: "${typeArg}"`);
      
      // Split by comma if multiple types are provided
      const types = typeArg.split(',').map(t => t.trim());
      console.log(`Parsed types: ${JSON.stringify(types)}`);
      
      for (const type of types) {
        // Match the type to a valid card type (case insensitive)
        const matchedType = Object.keys(TEMPLATES).find(
          templateType => templateType.toLowerCase() === type.toLowerCase()
        );
        
        if (matchedType) {
          console.log(`Found valid card type: ${matchedType}`);
          cardTypesToGenerate.push(matchedType);
        } else {
          console.warn(`Warning: Unknown card type "${type}". Valid types are: ${Object.keys(TEMPLATES).join(', ')}`);
        }
      }
      
      i++; // Skip the next argument as we've already processed it
    } else {
      console.warn('No type value provided after -t/--type flag');
    }
  } else if (arg === '--') {
    // Skip the -- separator (commonly used to separate options from positional arguments)
    console.log('Skipping -- separator');
  } else {
    console.log(`Unrecognized argument: ${arg}`);
  }
}

// Display help
if (help || args.length === 0) {
  console.log(`
Usage: node card_generator.js [options]

Options:
  --type, -t <type>    Generate only cards of specific type(s)
                       Valid types: ${Object.keys(TEMPLATES).join(', ')}
                       Multiple types can be specified with comma: -t Descendants,Holdings
  
  --help, -h           Show this help message

Examples:
  node card_generator.js                     Generate all card types
  node card_generator.js -t Descendants      Generate only Descendant cards
  node card_generator.js -t Holdings,Vessels Generate Holdings and Vessels cards
  `);
  
  if (help) {
    process.exit(0);
  }
}

// If no specific types are requested, generate all
if (cardTypesToGenerate.length === 0) {
  cardTypesToGenerate = Object.keys(TEMPLATES);
}

// Main function to generate cards
async function generateCards(cardTypes) {
  console.log('Starting card generation...');
  console.log(`Card types to generate: ${cardTypes.join(', ')}`);
  
  // Launch browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Initial viewport dimensions (will update per card type)
  await page.setViewport({
    width: 300,
    height: 420,
    deviceScaleFactor: 2 // For higher resolution
  });
  
  let totalCardsGenerated = 0;
  
  // Process each requested card type
  for (const cardType of cardTypes) {
    // Skip if no template or no cards of this type
    if (!templateHtml[cardType] || !cardData[cardType] || !cardData[cardType].length) {
      console.log(`Skipping ${cardType}: No template or no cards of this type.`);
      continue;
    }
    
    const cards = cardData[cardType];
    const template = templateHtml[cardType];
    const outputDir = TEMPLATES[cardType].outputDir;
    
    console.log(`\nProcessing ${cards.length} ${cardType} cards...`);
    
    // Set viewport dimensions based on card type (landscape for Holdings)
    if (cardType === 'Holdings') {
      await page.setViewport({
        width: 420,
        height: 300,
        deviceScaleFactor: 2 // For higher resolution
      });
      console.log(`Using landscape orientation (420x300) for ${cardType} cards`);
    } else {
      await page.setViewport({
        width: 300,
        height: 420,
        deviceScaleFactor: 2 // For higher resolution
      });
      console.log(`Using portrait orientation (300x420) for ${cardType} cards`);
    }
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }
    
    let cardsGenerated = 0;
    
    for (const card of cards) {
      if (!card.Name) {
        console.log('Skipping card without name');
        continue;
      }
      
      const cardName = card.Name.replace(/[^a-zA-Z0-9]/g, '_');
      console.log(`  Processing ${cardName}...`);
      
      try {
        // Prepare the base64 image data if an image name is provided
        let base64Image = null;
        if (card['image name']) {
          base64Image = getBase64Image(card['image name']);
        }
        
        // Load the template
        await page.setContent(template, { 
          waitUntil: 'domcontentloaded'
        });
        
        // Fill in card data using DOM manipulation
        await page.evaluate((cardData, imageData, cardType) => {
          try {
            // Helper function to safely set element content
            const setElement = (id, value) => {
              const elem = document.getElementById(id);
              if (elem) elem.textContent = value || '';
            };
            
            // Set basic fields that apply to all card types
            const nameElem = document.getElementById('cardName');
            if (nameElem) {
              nameElem.textContent = cardData.Name || '';
              nameElem.setAttribute('data-cost', cardData.Cost || '');
            }
            
            setElement('cardTranslation', cardData.Translation);
            
            // Set image using base64 data
            const imgElem = document.getElementById('cardImage');
            if (imgElem && imageData) {
              imgElem.src = imageData;
              imgElem.alt = cardData.Name || '';
            }
            
            // Descendants specific fields
            if (cardType === 'Descendants') {
              setElement('statForce', cardData.Force || '0');
              setElement('statPsyche', cardData.Psyche || '0');
              setElement('statVector', cardData.Vector || '0');
              setElement('statSync', cardData.Sync || '0');
              setElement('cardRace', cardData.Race);
              setElement('cardHeight', cardData.Height);
              setElement('cardSex', cardData.Sex);
              setElement('cardSign', cardData.Sign);
              setElement('cardAction', cardData['ACTION:']);
              setElement('cardTrait', cardData.Trait);
              setElement('cardFlavor', cardData.Flavor);
              
              // Handle sex indicator
              const sexIndicator = document.querySelector('.sex-indicator');
              if (sexIndicator) {
                if (cardData.Sex === 'M') {
                  sexIndicator.classList.add('male');
                } else if (cardData.Sex === 'F') {
                  sexIndicator.classList.add('female');
                }
              }
            }
            
            // Holdings specific fields
            else if (cardType === 'Holdings') {
              // Fix to correctly use Body field instead of Sector for the body display
              setElement('cardSector', cardData.Body || '');
              setElement('cardEnvironment', cardData.Environment);
              setElement('cardGarrison', cardData.Garrison || '0');
              setElement('cardPopulation', cardData.Population || '0');
              setElement('cardResource', cardData.Resource);
              setElement('cardEffect', cardData.Effect);
              setElement('cardFlavor', cardData.Flavor);
            }
            
            // Vessels specific fields
            else if (cardType === 'Vessels') {
              setElement('statForce', cardData.Force || '0');
              setElement('statPsyche', cardData.Psyche || '0');
              setElement('statVector', cardData.Vector || '0');
              setElement('statSync', cardData.Sync || '0');
              setElement('cardRace', cardData.Race);
              setElement('cardCrew', cardData.Crew);
              setElement('cardGarrison', cardData.Garrison || '0');
              setElement('cardLayout', cardData.Layout);
              setElement('cardAction', cardData['ACTION:']);
              setElement('cardTrait', cardData.Trait);
              setElement('cardEffect', cardData.Effect);
              setElement('cardFlavor', cardData.Flavor);
              setElement('cardSign', cardData.Sign);
              
              // Handle sex indicator if available for vessels
              const sexIndicator = document.querySelector('.sex-indicator');
              if (sexIndicator && cardData.Sex) {
                if (cardData.Sex === 'M') {
                  sexIndicator.classList.add('male');
                } else if (cardData.Sex === 'F') {
                  sexIndicator.classList.add('female');
                }
              }
            }
            
            // Works specific fields
            else if (cardType === 'Works') {
              setElement('cardEffect', cardData.Effect);
            }
            
            // Fates specific fields
            else if (cardType === 'Fates') {
              setElement('cardEffect', cardData.Effect);
              setElement('cardAction', cardData['ACTION:']);
              setElement('cardFlavor', cardData.Flavor);
            }
            
            // Show/hide containers based on data (for most card types)
            if (['Descendants', 'Holdings', 'Vessels', 'Fates'].includes(cardType)) {
              const actionContainer = document.getElementById('actionContainer');
              if (actionContainer) {
                actionContainer.style.display = cardData['ACTION:'] ? 'block' : 'none';
              }
            }
            
            if (['Descendants', 'Holdings', 'Vessels'].includes(cardType)) {
              const traitContainer = document.getElementById('traitContainer');
              if (traitContainer) {
                traitContainer.style.display = cardData.Trait ? 'block' : 'none';
              }
            }
            
            if (cardType === 'Vessels') {
              const layoutContainer = document.getElementById('layoutContainer');
              if (layoutContainer) {
                layoutContainer.style.display = cardData.Layout ? 'block' : 'none';
              }
            }
            
            // Set stat/resource bars
            if (['Descendants', 'Vessels'].includes(cardType)) {
              const setStatBar = (statId, barId, maxVal = 5) => {
                const statElem = document.getElementById(statId);
                const barElem = document.getElementById(barId);
                if (statElem && barElem) {
                  const statValue = parseInt(statElem.textContent) || 0;
                  const width = Math.min(statValue, maxVal) * 10; // 10px per point, max 5 points
                  barElem.style.width = width + 'px';
                }
              };
              
              // Set all stat bars
              setStatBar('statForce', 'forceBar');
              setStatBar('statPsyche', 'psycheBar');
              setStatBar('statVector', 'vectorBar');
              setStatBar('statSync', 'syncBar');
            }
            
            // No need for resource bars in the updated Holdings template
            
            // Update title size based on length
            const titleElement = document.getElementById('cardName');
            if (titleElement) {
              const titleLength = titleElement.textContent.length;
              
              let fontSize = 18;
              if (titleLength > 35) {
                fontSize = 14;
              } else if (titleLength > 25) {
                fontSize = 16;
              }
              titleElement.style.fontSize = fontSize + 'px';
            }
            
            // Ensure card content is visible
            const cardContent = document.querySelector('.card-content');
            if (cardContent) {
              cardContent.style.opacity = '1';
            }
          } catch (error) {
            console.error('Error in page evaluate:', error);
          }
        }, card, base64Image, cardType);
        
        // Wait for content to be fully loaded
        await page.waitForTimeout(300);
        
        // Disable animations for screenshot
        await page.addStyleTag({
          content: `
            .flicker, .horizontal-distortion, .scan-line {
              display: none !important;
            }
            .cursor {
              display: none !important;
            }
          `
        });
        
        // Take a screenshot
        const outputPath = path.join(outputDir, `${cardName}.png`);
        await page.screenshot({
          path: outputPath,
          type: 'png',
          omitBackground: true
        });
        
        console.log(`    Generated ${cardName}.png`);
        cardsGenerated++;
      } catch (error) {
        console.error(`Error generating card ${cardName}:`, error.message);
      }
    }
    
    console.log(`Completed ${cardType}: Generated ${cardsGenerated} cards.`);
    totalCardsGenerated += cardsGenerated;
  }
  
  await browser.close();
  console.log(`\nDone! Generated ${totalCardsGenerated} cards total.`);
}

// Run the generator with the requested card types
generateCards(cardTypesToGenerate)
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });