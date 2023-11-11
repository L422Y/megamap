import { MegaMap } from "../src/MegaMap"

describe("MegaMap", () => {
    let megaMap: MegaMap<string, string>
    let mockLoadFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock

    beforeEach(() => {
        mockLoadFunction = jest.fn(key => Promise.resolve(`Value for ${key}`))
        mockLoadAllFunction = jest.fn(() => Promise.resolve(new Map([
            ["key1", "value1"],
            ["key2", "value2"]
        ])))
        megaMap = new MegaMap(mockLoadFunction, mockLoadAllFunction, 1000)
    })

    test("should call load function on get and throw error if item is undefined", async () => {
        mockLoadFunction.mockResolvedValueOnce(undefined)
        await expect(megaMap.get("testKey")).rejects.toThrow("Item is undefined")
    })

    test("should fetch all items and return an empty map if no items found", async () => {
        mockLoadAllFunction.mockResolvedValueOnce(new Map())
        const items = await megaMap.getAll()
        expect(items).toBeInstanceOf(Map)
        expect(items?.size).toBe(0)
    })

})
