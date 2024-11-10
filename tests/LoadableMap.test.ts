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

    console.error = jest.fn()

  })

  describe("initialization", () => {
    test("should throw error when loadOne is not defined", () => {
      expect(() => new LoadableMap({loadOne: undefined as any}))
         .toThrow("loadOne function is not defined")
    })

    test("should set default keyProperty if not provided", () => {
      const map = new LoadableMap({loadOne: mockLoadOneFunction})
      expect(map.keyProperty).toBe("_id")
    })
  })

  describe("get", () => {
    test("should call loadOne and add item to map if not present", async () => {
      const item = await loadableMap.get("key1")
      expect(mockLoadOneFunction).toHaveBeenCalledWith("key1")
      expect(item?._id).toBe("key1")
      expect(item?.data).toBe("Data for key1")
      expect(loadableMap.has("key1")).toBeTruthy()
    })

    test("should return undefined for nonexistent key", async () => {
      mockLoadOneFunction.mockResolvedValueOnce(undefined)
      const item = await loadableMap.get("nonexistent")
      expect(item).toBeUndefined()
    })

    test("should throw error for undefined key", async () => {
      await expect(loadableMap.get(undefined as any)).rejects.toThrow("Key is undefined")
    })

    test("should return cached item without calling loadOne again", async () => {
      await loadableMap.get("key1")
      mockLoadOneFunction.mockClear()
      const item = await loadableMap.get("key1")
      expect(item?._id).toBe("key1")
      expect(mockLoadOneFunction).not.toHaveBeenCalled()
    })
  })

  describe("getAll", () => {
    test("should load all items and add them to map", async () => {
      const items = await loadableMap.getAll()
      expect(mockLoadAllFunction).toHaveBeenCalled()
      expect(Object.keys(items || {}).length).toBe(2)
      expect(items?.key1.data).toBe("value1")
      expect(items?.key2.data).toBe("value2")
    })

    test("should throw error if loadAll is not defined", async () => {
      loadableMap = new LoadableMap({loadOne: mockLoadOneFunction})
      await expect(loadableMap.getAll()).rejects.toThrow("Load all items function is not defined")
    })

    test("should return cached items without calling loadAll again", async () => {
      await loadableMap.getAll()
      mockLoadAllFunction.mockClear()
      const items = await loadableMap.getAll()
      expect(items?.key1.data).toBe("value1")
      expect(mockLoadAllFunction).not.toHaveBeenCalled()
    })
  })

  describe("map operations", () => {
    test("should correctly track size", () => {
      loadableMap.set("key1", {_id: "key1", data: "test"})
      loadableMap.set("key2", {_id: "key2", data: "test"})
      expect(loadableMap.size).toBe(2)
    })

    test("should support delete operation", () => {
      loadableMap.set("key1", {_id: "key1", data: "test"})
      expect(loadableMap.delete("key1")).toBeTruthy()
      expect(loadableMap.has("key1")).toBeFalsy()
    })

    test("should support clear operation", () => {
      loadableMap.set("key1", {_id: "key1", data: "test"})
      loadableMap.set("key2", {_id: "key2", data: "test"})
      loadableMap.clear()
      expect(loadableMap.size).toBe(0)
    })
  })

  describe("events", () => {
    test("should emit updated event when item is set", () => {
      const listener = jest.fn()
      loadableMap.on("updated", listener)
      loadableMap.set("key1", {_id: "key1", data: "test"})
      expect(listener).toHaveBeenCalled()
    })

    test("should remove event listener", () => {
      const listener = jest.fn()
      loadableMap.on("updated", listener)
      loadableMap.off("updated", listener)
      loadableMap.set("key1", {_id: "key1", data: "test"})
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe("refresh times", () => {
    test("should update refreshedAtMap when setting items", () => {
      loadableMap.set("key1", {_id: "key1", data: "test"})
      const refreshedAt = loadableMap.getRefreshedAt("key1")
      expect(refreshedAt).toBeInstanceOf(Date)
    })

    test("should clear refresh times when deleting items", () => {
      loadableMap.set("key1", {_id: "key1", data: "test"})
      loadableMap.delete("key1")
      expect(loadableMap.getRefreshedAt("key1")).toBeUndefined()
    })
  })
})