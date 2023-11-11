# MegaMap

MegaMap is a TypeScript library that extends the native JavaScript `Map` object. It provides advanced features such as caching, loadability, automatic expiry of entries, and more. MegaMap is ideal for situations where you need a sophisticated mapping solution with enhanced control over data storage and retrieval.

## Features

- **Caching**: Automatically cache and retrieve map entries.
- **Loadability**: Dynamically load entries as needed.
- **Expirable Entries**: Set entries to expire after a defined interval.
- **Enhanced Control**: More control over how map entries are handled and manipulated.

## Installation

```bash
npm install megamap
```

## Usage

### Basic Usage

First, import `MegaMap` from the library:

```typescript
import { MegaMap } from 'megamap';
```

Create an instance of `MegaMap`, passing the load functions and expiry intervals:

```typescript
// Creating a MegaMap with a loading function and expiry interval
const advancedMap = new MegaMap<string, any>(
  async (key) => {
    // Define how to load the item (e.g., from a database or API)
    return fetchDataForKey(key);
  },
  60000 // Expiry interval in milliseconds
);
```

### Adding and Retrieving Items

```typescript
// Add items to the map
simpleMap.set('key1', 'value1');
simpleMap.set('key2', 'value2');

// Retrieve items
const value = simpleMap.get('key1');
```

For the `advancedMap`, items can be loaded automatically if they are not present:

```typescript
// Retrieve or load an item
const valueOrLoaded = await advancedMap.get('someKey');
```

### Working with Expirable Entries

In `advancedMap`, entries will automatically expire after the specified interval. You can interact with the map as usual, and expired entries will be reloaded on demand.

### Advanced Functionalities

`MegaMap` also offers advanced functionalities like creating sub-maps based on specific criteria, updating items, and more.

```typescript
// Example of creating a sub-map
const subMap = advancedMap.createSubMap((item) => item.meetsSomeCriteria);

// Updating an item in the map
advancedMap.updateItem('someKey', (currentValue) => updatedValue);
```

Remember to tailor these examples to align with the actual API and functionalities of your `MegaMap` library.
```

This updated section provides a more comprehensive guide on how to use the `MegaMap`, including its constructor parameters and some advanced functionalities. It's essential to ensure that the examples are aligned with the actual implementation of your library.


## Contributing

Contributions to MegaMap are welcome! 


## License

This project is licensed under the MIT License 
