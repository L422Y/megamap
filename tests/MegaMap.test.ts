import { MegaMap } from '../src/MegaMap';

describe('MegaMap', () => {
    let megaMap: MegaMap<string, { _id: string, data: string }>;
    let mockLoadOneFunction: jest.Mock;
    let mockLoadAllFunction: jest.Mock;
    let secondaryMegaMap: MegaMap<string, { _id: string, data: string }>;

    beforeEach(() => {
        mockLoadOneFunction = jest.fn().mockImplementation((key) => Promise.resolve({ _id: key, data: `Data for ${key}` }));
        mockLoadAllFunction = jest.fn().mockImplementation(() => Promise.resolve(new Map([
            ['key1', { _id: 'key1', data: 'value1' }],
            ['key2', { _id: 'key2', data: 'value2' }]
        ])));
        megaMap = new MegaMap({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            expiryInterval: 1000,
            keyProperty: "_id"
        });

        secondaryMegaMap = new MegaMap({
            loadOne: jest.fn(),
            loadAll: jest.fn(),
            expiryInterval: 1000,
            keyProperty: "_id"
        });
        megaMap.addSecondaryMap(secondaryMegaMap);
    });

    test('should retrieve item and update secondary maps', async () => {
        const item = await megaMap.get('key1');
        expect(item).toEqual({ _id: 'key1', data: 'Data for key1' });
        expect(secondaryMegaMap['_map'].has('key1')).toBeTruthy();
        expect(secondaryMegaMap['_map'].get('key1')).toEqual(item);
    });

    // test('should throw error when getAll returns no items', async () => {
    //     mockLoadAllFunction.mockResolvedValueOnce(new Map());
    //     await expect(megaMap.getAll()).rejects.toThrow("No items found");
    // });

    test('should load all items with getAll', async () => {
        const items = await megaMap.getAll();
        expect(mockLoadAllFunction).toHaveBeenCalled();
        expect(items?.size).toBe(2);
        expect(items?.get('key1')).toEqual({ _id: 'key1', data: 'value1' });
    });

    // Additional tests can be added as needed
});
