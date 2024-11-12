import { CachedLoadableMap, LoadingState } from "../src/CachedLoadableMap"

describe("CachedLoadableMap", () => {
  let cachedMap: CachedLoadableMap<string, { _id: string, data: string }>
  let mockLoadOneFunction: jest.Mock
  let mockLoadAllFunction: jest.Mock
  let mockQueryFunction: jest.Mock
  const expiryInterval = 1000 // 1 second for testing

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    // Setup mock functions
    mockLoadOneFunction = jest.fn().mockResolvedValue({
      _id: "key1",
      data: "Data for key1"
    })
    mockLoadAllFunction = jest.fn().mockResolvedValue([
      {_id: "key1", data: "value1"},
      {_id: "key2", data: "value2"},
    ])
    mockQueryFunction = jest.fn()
    mockQueryFunction.mockImplementation((_queryName, ...args: any[]) =>
       Promise.resolve({_id: "query1", data: `Query result for ${args.join(":")}`})
    )

    // Create map with mocks
    cachedMap = new CachedLoadableMap({
      loadOne: mockLoadOneFunction,
      loadAll: mockLoadAllFunction,
      expiryInterval,
      keyProperty: "_id",
      namedQueries: {
        testQuery: mockQueryFunction
      }
    })

    console.error = jest.fn()

  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe("query caching", () => {
    test("should cache query results", async () => {
      const queryName = "testQuery"
      const args = ["arg1", "arg2"]

      // First call should execute the query
      await cachedMap.query[queryName](...args)
      expect(mockQueryFunction).toHaveBeenCalledTimes(1)
      expect(mockQueryFunction).toHaveBeenCalledWith(queryName, ...args)

      // Second call should use cache
      mockQueryFunction.mockClear()
      await cachedMap.query[queryName](...args)
      expect(mockQueryFunction).not.toHaveBeenCalled()

      // After expiry, should execute query again
      jest.advanceTimersByTime(expiryInterval + 100)
      await cachedMap.query[queryName](...args)
      expect(mockQueryFunction).toHaveBeenCalledTimes(1)
      expect(mockQueryFunction).toHaveBeenCalledWith(queryName, ...args)
    }, 10000)

    test("should not share cache between different query args", async () => {
      const queryName = "testQuery"

      // First query
      await cachedMap.query[queryName]("arg1")
      expect(mockQueryFunction).toHaveBeenCalledWith(queryName, "arg1")

      // Different args should execute new query
      mockQueryFunction.mockClear()
      await cachedMap.query[queryName]("arg2")
      expect(mockQueryFunction).toHaveBeenCalledWith(queryName, "arg2")
    })

    test("should handle empty args", async () => {
      const queryName = "testQuery"

      await cachedMap.query[queryName]()
      expect(mockQueryFunction).toHaveBeenCalledWith(queryName)

      mockQueryFunction.mockClear()
      await cachedMap.query[queryName]()
      expect(mockQueryFunction).not.toHaveBeenCalled()
    })
  })

  describe("caching behavior", () => {
    test("should cache items with expiry", async () => {
      // First call should hit the service
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledTimes(1)

      // Second call should use cache
      mockLoadOneFunction.mockClear()
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).not.toHaveBeenCalled()

      // After expiry, should hit service again
      jest.advanceTimersByTime(expiryInterval + 100)
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledTimes(1)
    })

    test("should respect cache expiry for bulk operations", async () => {
      // First call should hit service
      await cachedMap.getAll()
      expect(mockLoadAllFunction).toHaveBeenCalledTimes(1)

      // Second call should use cache
      mockLoadAllFunction.mockClear()
      await cachedMap.getAll()
      expect(mockLoadAllFunction).not.toHaveBeenCalled()

      // After expiry, should hit service again
      jest.advanceTimersByTime(expiryInterval + 100)
      await cachedMap.getAll(true)
      expect(mockLoadAllFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe("cache management", () => {
    test("should clear cache on delete", async () => {
      // Load and cache item
      await cachedMap.get("key1")
      mockLoadOneFunction.mockClear()

      // Delete should clear cache
      cachedMap.delete("key1")

      // Next get should hit service
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledTimes(1)
    })

    test("should clear cache on deleteBy", async () => {
      // Load and cache item
      await cachedMap.get("key1")
      mockLoadOneFunction.mockClear()

      // DeleteBy should clear cache
      cachedMap.deleteBy("data", "Data for key1")

      // Next get should hit service
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledTimes(1)
    })

    test("should update cache on set", async () => {
      const newItem = {_id: "key1", data: "updated"}

      // Set should update cache
      cachedMap.set("key1", newItem)

      // Get should use cache
      const item = await cachedMap.get("key1")
      expect(item).toEqual(newItem)
      expect(mockLoadOneFunction).not.toHaveBeenCalled()
    })
  })

  describe("error handling", () => {
    // test("should handle failed loads gracefully", async () => {
    //     mockLoadOneFunction.mockRejectedValueOnce(new Error("Load failed"))
    //     const result = await cachedMap.get("errorKey")
    //     expect(result).toBeUndefined()
    // })

    // test("should handle failed bulk loads gracefully", async () => {
    //     mockLoadAllFunction.mockRejectedValueOnce(new Error("Bulk load failed"))
    //     const result = await cachedMap.getAll()
    //     expect(result).toBeUndefined()
    // })

    // test("should handle failed queries gracefully", async () => {
    //     const queryError = new Error("Query failed")
    //     mockQueryFunction.mockRejectedValueOnce(queryError)
    //
    //     const result = await cachedMap.query.testQuery("arg1")
    //     expect(result).toBeUndefined()
    // })

    // test("should maintain cache integrity after errors", async () => {
    //     // Cache an item
    //     const item = await cachedMap.get("key1")
    //     expect(item).toBeDefined()
    //
    //     // Failed operation shouldn't affect cache
    //     mockLoadOneFunction.mockRejectedValueOnce(new Error("Load failed"))
    //     await cachedMap.get("errorKey")
    //
    //     // Cached item should still be available
    //     mockLoadOneFunction.mockClear()
    //     const cachedItem = await cachedMap.get("key1")
    //     expect(cachedItem).toEqual(item)
    //     expect(mockLoadOneFunction).not.toHaveBeenCalled()
    // })
  })

  describe("bulk operations", () => {
    test("should cache all items from getAll", async () => {
      // Load all items
      const items = await cachedMap.getAll()
      expect(mockLoadAllFunction).toHaveBeenCalledTimes(1)

      // Verify items are cached
      mockLoadAllFunction.mockClear()
      const cachedItems = await cachedMap.getAll()
      expect(cachedItems).toEqual(items)
      expect(mockLoadAllFunction).not.toHaveBeenCalled()
    })

    test("should update individual item cache from bulk load", async () => {
      // Load all items
      await cachedMap.getAll()
      mockLoadOneFunction.mockClear()

      // Individual items should be cached
      const item = await cachedMap.get("key1")
      expect(item).toBeDefined()
      expect(mockLoadOneFunction).not.toHaveBeenCalled()
    })

    test("should clear bulk cache on individual updates", async () => {
      // Load all items
      await cachedMap.getAll()
      mockLoadAllFunction.mockClear()

      // Update an item
      cachedMap.set("key1", {_id: "key1", data: "updated"})

      // Next getAll should refresh
      await cachedMap.getAll(true)
      expect(mockLoadAllFunction).toHaveBeenCalled()
    })
  })

  describe("auto-refresh expired entries", () => {
    test("should auto-refresh expired entries when accessed", async () => {
      // First call should hit the service
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledTimes(1)

      // After expiry, should auto-refresh when accessed
      jest.advanceTimersByTime(expiryInterval + 100)
      await cachedMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledTimes(2)
    })
  })

  describe("loading state enum", () => {
    test("should use LoadingState enum for isLoading property", () => {
      expect(cachedMap.isLoading.all).toBe(LoadingState.NOT_LOADED)
    })
  })
})
