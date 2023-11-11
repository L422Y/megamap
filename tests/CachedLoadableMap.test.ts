import { CachedLoadableMap } from "../src/CachedLoadableMap"

describe("CachedLoadableMap", () => {
    let cachedLoadableMap: CachedLoadableMap<string, string>
    let mockLoadFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock

    beforeEach(() => {
        mockLoadFunction = jest.fn(key => Promise.resolve(`Value for ${key}`))
        mockLoadAllFunction = jest.fn(() => Promise.resolve(new Map([
            ["key1", "value1"],
            ["key2", "value2"]
        ])))
        cachedLoadableMap = new CachedLoadableMap(mockLoadFunction, mockLoadAllFunction, 1000)
    })

    test("should retrieve item from cache if not expired", async () => {
        await cachedLoadableMap.set("key1", "cachedValue1")
        const item = await cachedLoadableMap.get("key1")
        expect(item).toBe("cachedValue1")
        expect(mockLoadFunction).not.toHaveBeenCalledWith("key1")
    })

    test("should call load function if item is expired", async () => {
        jest.useFakeTimers()
        await cachedLoadableMap.set("key2", "cachedValue2")
        jest.advanceTimersByTime(2000) // Advance time to expire the cache
        await cachedLoadableMap.get("key2")
        expect(mockLoadFunction).toHaveBeenCalledWith("key2")
        jest.useRealTimers()
    })

    test("should load all items with loadAll function", async () => {
        const items = await cachedLoadableMap.getAll()
        expect(mockLoadAllFunction).toHaveBeenCalled()
        expect(items?.size).toBe(2)
    })
})
