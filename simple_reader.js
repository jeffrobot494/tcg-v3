const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Your Google Sheet ID from the URLs
const SPREADSHEET_ID = '1W_FgwrbdUViGUIOK7bdLhvRLxGjdTSUZ8bUxMZ8aDIA';

// The card types and their corresponding GIDs
const CARD_TYPES = {
  Descendants: '1705660634',
  Vessels: '1556065794',
  Fates: '1516324389',
  Works: '2089438450',
  Holdings: '1043054677'
};

/**
 * For public sheets, we can use a direct export URL to get CSV data
 * This is simpler than using the Google Sheets API
 */
async function fetchSheetAsCSV(sheetName, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  console.log(`Fetching ${sheetName} from: ${url}`);
  
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
    return null;
  }
}

/**
 * Parse CSV data into an array of objects
 */
function parseCSV(csvData) {
  if (!csvData) return [];
  
  // Process the CSV data character by character instead of line by line
  // to properly handle multiline fields
  const records = [];
  const fields = [];
  let currentField = '';
  let inQuote = false;
  
  // First pass to extract all records properly handling quotes and newlines
  for (let i = 0; i < csvData.length; i++) {
    const char = csvData[i];
    const nextChar = csvData[i + 1] || '';
    
    if (char === '"') {
      // Handle escaped quotes (two double quotes in a row)
      if (nextChar === '"') {
        currentField += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuote) {
      // End of record
      fields.push(currentField);
      if (fields.length > 0) { // Avoid empty records
        records.push([...fields]);
      }
      fields.length = 0;
      currentField = '';
      
      // Skip the \n if we encountered \r\n
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      // Regular character
      currentField += char;
    }
  }
  
  // Add the last field and record if not empty
  if (currentField || fields.length > 0) {
    fields.push(currentField);
    records.push([...fields]);
  }
  
  if (records.length === 0) return [];
  
  // Headers are in the first record
  const headers = records[0].map(header => header.trim());
  
  // Convert the rest of the records to objects
  return records.slice(1).map(record => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = (record[index] || '').trim();
    });
    return obj;
  });
}

/**
 * Main function to fetch and process all sheets
 */
async function fetchAllCards() {
  console.log('Starting card data fetch...');
  const cardData = {};
  
  // Process each card type
  for (const [cardType, gid] of Object.entries(CARD_TYPES)) {
    console.log(`Processing ${cardType}...`);
    const csvData = await fetchSheetAsCSV(cardType, gid);
    
    if (csvData) {
      const cards = parseCSV(csvData);
      console.log(`Found ${cards.length} ${cardType}`);
      cardData[cardType] = cards;
    } else {
      console.log(`No data found for ${cardType}`);
      cardData[cardType] = [];
    }
  }
  
  // Save the data
  const outputDir = path.join(__dirname, 'card_data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'all_cards.json'),
    JSON.stringify(cardData, null, 2)
  );
  
  console.log('Card data saved to card_data/all_cards.json');
  return cardData;
}

// Run if this script is executed directly
if (require.main === module) {
  fetchAllCards()
    .then(data => {
      const summary = Object.entries(data)
        .map(([type, cards]) => `${type}: ${cards.length}`)
        .join(', ');
      console.log(`Summary: ${summary}`);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fetchAllCards };