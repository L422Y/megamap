import { CachedLoadableMap } from "../src/CachedLoadableMap"

describe("CachedLoadableMap", () => {
    let cachedLoadableMap: CachedLoadableMap<string, { _id: string, data: string }>
    let mockLoadOneFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock
    const expiryInterval = 1000 // 1 second for testing

    beforeEach(() => {
        mockLoadOneFunction = jest.fn().mockImplementation((key) => Promise.resolve({
            _id: key,
            data: `Data for ${key}`
        }))
        mockLoadAllFunction = jest.fn().mockImplementation(() => Promise.resolve([
            {_id: "key1", data: "value1"},
            {_id: "key2", data: "value2"},
        ]))
        cachedLoadableMap = new CachedLoadableMap({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            expiryInterval,
            keyProperty: "_id"
        })
    })

    test("should retrieve item and set expiry", async () => {
        const item = await cachedLoadableMap.get("key1")
        expect(mockLoadOneFunction).toHaveBeenCalledWith("key1")
        expect(item._id).toBe("key1")
        expect(item.data).toBe("Data for key1")

        const refreshedAt = cachedLoadableMap.getRefreshedAt("key1")
        expect(refreshedAt).toBeInstanceOf(Date)
        expect(cachedLoadableMap["refreshedAtMap"]["key1"]).toEqual(refreshedAt)
    })

    test("should call loadOne function again if item is expired", async () => {
        jest.useFakeTimers()
        await cachedLoadableMap.get("key2")
        jest.advanceTimersByTime(expiryInterval + 100) // Advance time to expire the cache
        await cachedLoadableMap.get("key2")
        expect(mockLoadOneFunction).toHaveBeenCalledTimes(2)
        jest.useRealTimers()
    })

    test("should load all items with getAll and set their expiry", async () => {
        const items = await cachedLoadableMap.getAll()
        expect(mockLoadAllFunction).toHaveBeenCalled()
        expect(items?.size).toBe(2)
        expect(cachedLoadableMap["refreshedAtMap"]["key1"]).toBeInstanceOf(Date)
        expect(cachedLoadableMap["refreshedAtMap"]["key2"]).toBeInstanceOf(Date)
    })

    // Additional tests can be added as needed
})
