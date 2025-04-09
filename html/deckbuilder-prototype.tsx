import React, { useState } from 'react';
import { Search, X, Filter, Download, Upload, Copy, Save, Info, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';

const DeckbuilderUI = () => {
  // Sample data
  const [cards] = useState([
    { id: 1, name: "Fireball Mage", type: "Character", cost: 3, color: "red" },
    { id: 2, name: "Swift Strike", type: "Action", cost: 1, color: "red" },
    { id: 3, name: "Healing Potion", type: "Item", cost: 2, color: "green" },
    { id: 4, name: "Stone Wall", type: "Defense", cost: 4, color: "blue" },
    { id: 5, name: "Gold Mine", type: "Resource", cost: 5, color: "yellow" },
    { id: 6, name: "Shadow Assassin", type: "Character", cost: 4, color: "purple" },
    { id: 7, name: "Magic Shield", type: "Defense", cost: 2, color: "blue" },
    { id: 8, name: "Energy Bolt", type: "Action", cost: 2, color: "red" },
    { id: 9, name: "Ancient Scroll", type: "Item", cost: 1, color: "green" },
    { id: 10, name: "Diamond Mine", type: "Resource", cost: 6, color: "yellow" },
    { id: 11, name: "Forest Guardian", type: "Character", cost: 5, color: "green" },
    { id: 12, name: "Counterspell", type: "Action", cost: 3, color: "blue" },
  ]);
  
  const [deck, setDeck] = useState([
    { id: 1, name: "Fireball Mage", type: "Character", cost: 3, color: "red", count: 2 },
    { id: 3, name: "Healing Potion", type: "Item", cost: 2, color: "green", count: 3 },
    { id: 7, name: "Magic Shield", type: "Defense", cost: 2, color: "blue", count: 1 },
  ]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [statsOpen, setStatsOpen] = useState(false);
  
  // Card type colors
  const typeColors = {
    Character: "bg-red-100 text-red-800",
    Action: "bg-amber-100 text-amber-800",
    Item: "bg-green-100 text-green-800",
    Defense: "bg-blue-100 text-blue-800",
    Resource: "bg-purple-100 text-purple-800"
  };
  
  // Calculate deck stats
  const deckStats = {
    totalCards: deck.reduce((sum, card) => sum + card.count, 0),
    averageCost: parseFloat((deck.reduce((sum, card) => sum + (card.cost * card.count), 0) / 
                    (deck.reduce((sum, card) => sum + card.count, 0) || 1)).toFixed(1)),
    typeBreakdown: {
      Character: deck.filter(card => card.type === "Character").reduce((sum, card) => sum + card.count, 0),
      Action: deck.filter(card => card.type === "Action").reduce((sum, card) => sum + card.count, 0),
      Item: deck.filter(card => card.type === "Item").reduce((sum, card) => sum + card.count, 0),
      Defense: deck.filter(card => card.type === "Defense").reduce((sum, card) => sum + card.count, 0),
      Resource: deck.filter(card => card.type === "Resource").reduce((sum, card) => sum + card.count, 0)
    }
  };
  
  // Advanced search parser for syntax like "t:Character c>3"
  const parseSearchQuery = (query) => {
    // Return all cards if empty query
    if (!query.trim()) return () => true;
    
    // Parse regular text search (no special syntax)
    if (!query.includes(':') && !query.includes('>') && !query.includes('<')) {
      const lowerQuery = query.toLowerCase();
      return (card) => card.name.toLowerCase().includes(lowerQuery) || 
                         card.type.toLowerCase().includes(lowerQuery);
    }
    
    // Parse advanced query
    const conditions = [];
    
    // Extract type filter: t:Type or type:Type
    const typeMatch = query.match(/(?:^|\s)(t|type):(\w+)/i);
    if (typeMatch) {
      const typeValue = typeMatch[2].toLowerCase();
      conditions.push(card => card.type.toLowerCase() === typeValue);
    }
    
    // Extract cost comparisons: c>3, cost<5, etc.
    const costMatches = query.matchAll(/(?:^|\s)(c|cost)(>|<|>=|<=|=)(\d+)/gi);
    for (const match of Array.from(costMatches)) {
      const operator = match[2];
      const value = parseInt(match[3], 10);
      
      switch(operator) {
        case '>':
          conditions.push(card => card.cost > value);
          break;
        case '<':
          conditions.push(card => card.cost < value);
          break;
        case '>=':
          conditions.push(card => card.cost >= value);
          break;
        case '<=':
          conditions.push(card => card.cost <= value);
          break;
        case '=':
          conditions.push(card => card.cost === value);
          break;
      }
    }
    
    // Extract name search
    const nameMatch = query.match(/(?:^|\s)(n|name):(\w+)/i);
    if (nameMatch) {
      const nameValue = nameMatch[2].toLowerCase();
      conditions.push(card => card.name.toLowerCase().includes(nameValue));
    }
    
    // If no special conditions were found, do a regular text search
    if (conditions.length === 0) {
      const lowerQuery = query.toLowerCase();
      return (card) => card.name.toLowerCase().includes(lowerQuery) || 
                       card.type.toLowerCase().includes(lowerQuery);
    }
    
    // Return a function that checks all conditions
    return (card) => conditions.every(condition => condition(card));
  };
  
  // Filter cards based on search and active filter
  const searchFunction = parseSearchQuery(searchQuery);
  const filteredCards = cards.filter(card => {
    const matchesSearch = searchFunction(card);
    const matchesFilter = activeFilter === "All" || card.type === activeFilter;
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col w-full h-full">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Deck Builder</h1>
          
          {/* Search and filter section */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search cards (e.g. 't:Character c>3')"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute top-full mt-1 z-10 bg-white border rounded-lg shadow-lg w-full p-2 text-xs text-gray-600" style={{display: searchQuery && !searchQuery.includes(':') && !searchQuery.includes('>') && !searchQuery.includes('<') ? 'block' : 'none'}}>
                  <div className="font-semibold mb-1">Search syntax examples:</div>
                  <div><span className="font-mono bg-gray-100 px-1">t:Character</span> - cards of type Character</div>
                  <div><span className="font-mono bg-gray-100 px-1">c>3</span> - cards with cost greater than 3</div>
                  <div><span className="font-mono bg-gray-100 px-1">name:Fire</span> - cards with "Fire" in name</div>
                </div>
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                {searchQuery && (
                  <button 
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="ml-2">
                <select className="border rounded-lg py-2 px-4">
                  <option>Sort: Name (A-Z)</option>
                  <option>Sort: Cost (Low-High)</option>
                  <option>Sort: Cost (High-Low)</option>
                  <option>Sort: Type</option>
                </select>
              </div>
            </div>
            
            {/* Quick filters */}
            <div className="flex flex-wrap gap-2">
              {["All", "Character", "Action", "Item", "Defense", "Resource"].map(filter => (
                <button
                  key={filter}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    activeFilter === filter 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
              <button className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center">
                <Filter size={14} className="mr-1" />
                More Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area with the 3/4 - 1/4 split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Card grid section - 75% width */}
          <div className="w-3/4 p-0 overflow-auto">
            <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-0.5 auto-rows-fr">
              {filteredCards.map(card => (
                <div key={card.id} className="bg-white shadow overflow-hidden hover:shadow-md transition-shadow" style={{ height: "230px" }}>
                  {/* Card image - maintaining 2.5:3.5 aspect ratio */}
                  <div 
                    className="h-36 flex items-center justify-center relative overflow-hidden" 
                    style={{backgroundColor: card.color}}
                  >
                    <span className="text-white font-bold text-lg">{card.name}</span>
                    <div className="absolute top-1 right-1 bg-black bg-opacity-30 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <span className="text-xs font-bold">{card.cost}</span>
                    </div>
                  </div>
                  <div className="p-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeColors[card.type]}`}>
                        {card.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{card.name}</span>
                      <button className="p-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Deck panel - 25% width */}
          <div className="w-1/4 bg-white shadow-lg p-4 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Deck</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {deckStats.totalCards} / 60 Cards
              </span>
            </div>
            
            {/* Deck actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded text-sm">
                <Copy size={14} className="mr-1" />
                Share Link
              </button>
              <button className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">
                <Save size={14} className="mr-1" />
                Save Text
              </button>
              <button className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">
                <Download size={14} className="mr-1" />
                Download
              </button>
              <button className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm">
                <Upload size={14} className="mr-1" />
                Import
              </button>
            </div>
            
            {/* Deck statistics */}
            <div className="mb-4 border rounded-lg overflow-hidden">
              <button 
                className="w-full flex justify-between items-center p-3 bg-gray-100"
                onClick={() => setStatsOpen(!statsOpen)}
              >
                <div className="flex items-center">
                  <Info size={16} className="mr-2 text-gray-500" />
                  <span className="font-medium">Deck Statistics</span>
                </div>
                {statsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {statsOpen && (
                <div className="p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Total Cards:</span>
                    <span className="font-medium">{deckStats.totalCards}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Average Cost:</span>
                    <span className="font-medium">{deckStats.averageCost}</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600 block mb-2">Card Types:</span>
                    {Object.entries(deckStats.typeBreakdown).map(([type, count]) => (
                      count > 0 && (
                        <div key={type} className="flex justify-between items-center mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[type]}`}>
                            {type}
                          </span>
                          <span>{count} ({Math.round(count/deckStats.totalCards*100)}%)</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Deck contents */}
            <div className="space-y-2">
              {deck.map(card => (
                <div key={card.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                  <div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: card.color}}></span>
                      <span className="font-medium">{card.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className={`text-xs px-1.5 py-0 rounded-full mr-2 ${typeColors[card.type]}`}>
                        {card.type}
                      </span>
                      <span>{card.cost} ⭐</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mx-2">{card.count}x</span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Minus size={16} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {deck.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Your deck is empty. Add cards from the collection.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckbuilderUI;