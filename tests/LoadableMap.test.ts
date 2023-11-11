import { LoadableMap } from "../src/LoadableMap"

describe("LoadableMap", () => {
    let loadableMap: LoadableMap<string, string>
    let mockLoadFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock

    beforeEach(() => {
        mockLoadFunction = jest.fn(key => Promise.resolve(`Value for ${key}`))
        mockLoadAllFunction = jest.fn(() => Promise.resolve(new Map([
            ["key1", "value1"],
            ["key2", "value2"]
        ])))
        loadableMap = new LoadableMap(mockLoadFunction, mockLoadAllFunction)
    })

    test("should call load function on get", async () => {
        await loadableMap.get("testKey")
        expect(mockLoadFunction).toHaveBeenCalledWith("testKey")
    })

    test("should call loadAll function on getAll", async () => {
        const allItems = await loadableMap.getAll()
        expect(mockLoadAllFunction).toHaveBeenCalled()
        expect(allItems).toBeInstanceOf(Map)
        expect(allItems?.size).toBe(2)
    })
})
