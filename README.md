
# MegaMap

[![wakatime](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9.svg)](https://wakatime.com/badge/user/018b859f-13fa-41e2-9883-185549942dff/project/018bbdef-9ad5-44b2-a07f-56a02612b0e9)
[![npm version](https://badge.fury.io/js/megamap.svg)](https://badge.fury.io/js/megamap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Build Status](https://github.com/l422y/megamap/actions/workflows/build.yml/badge.svg)
![Test Status](https://github.com/l422y/megamap/actions/workflows/test.yml/badge.svg)


MegaMap is a TypeScript library designed for advanced key-value mapping. It extends the native JavaScript `Map` object and integrates additional features such as caching, loadability, and automatic expiry of entries. MegaMap is built upon two foundational classes, `LoadableMap` and `CachedLoadableMap`, each offering distinct capabilities. This library is ideal for sophisticated mapping solutions where enhanced control over data storage and retrieval is needed.

## Features

- **LoadableMap**: Dynamically loads entries on demand.
- **CachedLoadableMap**: Extends LoadableMap with caching and automatic expiry of entries.
- **MegaMap**: Combines features of both LoadableMap and CachedLoadableMap with additional enhancements for comprehensive mapping solutions.

## Installation

```bash
npm install megamap
```

## Usage

You can use MegaMap in a variety of ways depending on your needs, including utilizing the foundational classes directly or using the MegaMap class for a combination of features.

The following examples demonstrate basic usage of each class.

### Basic Usage of LoadableMap

Import and create an instance of `LoadableMap`:

```typescript
import { LoadableMap } from 'megamap';

const loadFunction = async (key: string) => {
    // Define loading logic (e.g., fetch from a database)
    return fetchDataForKey(key);
};

const loadableMap = new LoadableMap<string, string>(loadFunction);
```

### Using CachedLoadableMap

CachedLoadableMap extends LoadableMap with caching capabilities:

```typescript
import { CachedLoadableMap } from 'megamap';

const cachedMap = new CachedLoadableMap<string, string>(loadFunction, 60000); // Expiry interval in milliseconds
```

### Advanced Usage with MegaMap

MegaMap offers a combination of loading, caching, and advanced manipulation:

```typescript
import { MegaMap } from 'megamap';

const megaMap = new MegaMap<string, string>(loadFunction, 60000);

// Automatically load or retrieve an item
const value = await megaMap.get('someKey');

// Items in MegaMap expire after the specified interval and are refreshed as needed.
```

### Adding and Retrieving Items

Add and retrieve items as you would with a standard Map:

```typescript
megaMap.set('key1', 'value1');
const value = megaMap.get('key1');
```

### Advanced Functionalities in MegaMap

MegaMap also allows for more advanced operations like sub-maps and item updates:

```typescript
// Create a sub-map based on criteria
const subMap = megaMap.createSubMap((item) => item.meetsCriteria);

// Update an existing item
megaMap.updateItem('key1', (currentValue) => 'newValue');
```

## Contributing

Contributions to MegaMap are welcome. Please feel free to submit pull requests or suggest features.

## License

This project is licensed under the MIT License.
