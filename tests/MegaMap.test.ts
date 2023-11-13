import { MegaMap } from "../src/MegaMap"

describe("MegaMap", () => {
    let megaMap: MegaMap<string, { _id: string, data: string }>
    let mockLoadOneFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock
    let secondaryMegaMap: MegaMap<string, { _id: string, data: string }>

    beforeEach(() => {
        mockLoadOneFunction = jest.fn().mockImplementation((key) => Promise.resolve({_id: key, data: `Data for ${key}`}))
        mockLoadAllFunction = jest.fn().mockImplementation(() => Promise.resolve([
            {_id: "key1", data: "value1"},
            {_id: "key2", data: "value2"}
        ]))
        megaMap = new MegaMap({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            expiryInterval: 1000,
            keyProperty: "_id"
        })

        secondaryMegaMap = new MegaMap({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            expiryInterval: 1000,
            keyProperty: "_id"
        })
        megaMap.addSecondaryMap(secondaryMegaMap)
    })

    test("should retrieve item and update secondary maps", async () => {
        const item = await megaMap.get("key1")
        expect(item).toEqual({_id: "key1", data: "value1"})

        const item2 = await megaMap.load("key3")
        console.log(item2)
        expect(item2).toEqual({_id: "key3", data: "Data for key3"})
        expect(secondaryMegaMap["_map"].has("key3")).toBeTruthy()
        expect(secondaryMegaMap["_map"].get("key3")).toEqual(item2)
    })

    // test('should throw error when getAll returns no items', async () => {
    //     mockLoadAllFunction.mockResolvedValueOnce(new Map());
    //     await expect(megaMap.getAll()).rejects.toThrow("No items found");
    // });

    test("should load all items with getAll", async () => {
        const items = await megaMap.getAll()
        expect(mockLoadAllFunction).toHaveBeenCalled()
        expect(items?.size).toBe(2)
        expect(items?.get("key1")).toEqual({_id: "key1", data: "value1"})
    })

    // Additional tests can be added as needed
})
