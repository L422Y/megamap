import { LoadableMap } from "../src"

describe("LoadableMap", () => {
    let loadableMap: LoadableMap<string, { _id: string, data: string }>
    let mockLoadOneFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock

    beforeEach(() => {
        mockLoadOneFunction = jest.fn().mockImplementation((key) => Promise.resolve({
            _id: key,
            data: `Data for ${key}`
        }))
        mockLoadAllFunction = jest.fn().mockImplementation(() => Promise.resolve([
            {_id: "key1", data: "value1"},
            {_id: "key2", data: "value2"}
        ]))
        loadableMap = new LoadableMap({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            keyProperty: "_id"
        })
    })

    test("should call loadOne and add item to map if not present", async () => {
        const item = await loadableMap.get("key1")
        expect(mockLoadOneFunction).toHaveBeenCalledWith("key1")
        expect(item).toEqual({_id: "key1", data: "Data for key1"})
        expect(loadableMap["_map"].has("key1")).toBeTruthy()
    })

    test("should return undefined for nonexistent key", async () => {
        mockLoadOneFunction.mockResolvedValueOnce(undefined)
        const item = await loadableMap.get("nonexistent")
        expect(item).toBeUndefined()
    })

    test("should throw error for undefined key", async () => {
        await expect(loadableMap.get(undefined!)).rejects.toThrow("Key is undefined")
    })

    test("should load all items and add them to map", async () => {
        const allItems = await loadableMap.getAll()
        expect(mockLoadAllFunction).toHaveBeenCalled()
        expect(allItems?.size).toBe(2)
        expect(allItems?.get("key1")).toEqual({_id: "key1", data: "value1"})
        expect(allItems?.get("key2")).toEqual({_id: "key2", data: "value2"})
    })
})
