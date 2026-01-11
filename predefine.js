const defaultItems = [
    { name: "Rice", unit: "kg", price: 60 },
    { name: "Wheat", unit: "kg", price: 50 },
    { name: "Sugar", unit: "kg", price: 45 },
    { name: "Salt", unit: "kg", price: 20 },
    { name: "Oil", unit: "litre", price: 120 },
    { name: "Toothpaste", unit: "piece", price: 40 },
    { name: "Soap", unit: "piece", price: 25 }
];

let predefinedItems;
try {
    const stored = localStorage.getItem("itemPrices");
    predefinedItems = stored ? JSON.parse(stored) : defaultItems;
    if (!Array.isArray(predefinedItems)) predefinedItems = defaultItems;
} catch (e) {
    predefinedItems = defaultItems;
}