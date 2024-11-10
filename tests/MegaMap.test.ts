import { MegaMap } from "../src/MegaMap"
import { unref } from "vue"

type TestItem = {
  _id: string;
  data: string;
  status: string;
  tags?: string[];
}

type TestSubLists = {
  active: TestItem[];
  draft: TestItem[];
}

describe("MegaMap", () => {
  let megaMap: MegaMap<string, TestItem>
  let mockLoadOneFunction: jest.Mock
  let mockLoadAllFunction: jest.Mock
  let secondaryMap: MegaMap<string, TestItem>
  const testData = [
    {_id: "key1", data: "value1", status: "active", tags: ["tag1"]},
    {_id: "key2", data: "value2", status: "draft", tags: ["tag2"]},
    {_id: "key3", data: "value3", status: "active", tags: ["tag1", "tag2"]}
  ]

  beforeEach(async () => {
    jest.resetAllMocks()

    // Setup mock functions
    mockLoadOneFunction = jest.fn().mockImplementation((key) => {
      const item = testData.find(i => i._id === key)
      return Promise.resolve(item)
    })
    mockLoadAllFunction = jest.fn().mockResolvedValue(testData)

    // Create main map
    megaMap = new MegaMap<string, TestItem>({
      loadOne: mockLoadOneFunction,
      loadAll: mockLoadAllFunction,
      keyProperty: "_id",
      searchableFields: ["data", "status"],
      subListFilters: {
        active: (item) => item.status === "active",
        draft: (item) => item.status === "draft"
      }
    })

    // Create secondary map
    secondaryMap = new MegaMap<string, TestItem>({
      loadOne: mockLoadOneFunction,
      loadAll: mockLoadAllFunction,
      keyProperty: "_id"
    })

    // Initialize maps
    await megaMap.getAll()
    await megaMap.addSecondaryMap(secondaryMap)
    await secondaryMap.getAll()
    megaMap.notifyMapUpdated()
    
    console.error = jest.fn()

  })

  describe("sublists", () => {
    test("should maintain filtered sublists", () => {
      const subLists = unref(megaMap.subLists) as TestSubLists
      expect(Array.isArray(subLists.active)).toBeTruthy()
      expect(Array.isArray(subLists.draft)).toBeTruthy()
      expect(subLists.active).toHaveLength(2)
      expect(subLists.draft).toHaveLength(1)
    })

    test("should update sublists when items are modified", () => {
      const newItem: TestItem = {_id: "key1", data: "value1", status: "draft"}
      megaMap.set(newItem._id, newItem)
      megaMap.notifyMapUpdated()

      const subLists = unref(megaMap.subLists) as TestSubLists
      expect(subLists.active).toHaveLength(1)
      expect(subLists.draft).toHaveLength(2)
    })
  })

  describe("secondary maps", () => {
    test("should sync secondary maps on item updates", async () => {
      const newItem: TestItem = {_id: "key4", data: "value4", status: "active"}

      megaMap.set(newItem._id, newItem)
      secondaryMap.set(newItem._id, newItem)
      megaMap.notifyMapUpdated()

      expect(secondaryMap.value[newItem._id]).toEqual(newItem)
    })

    test("should sync secondary maps on bulk operations", async () => {
      const newItems: TestItem[] = [
        {_id: "key5", data: "value5", status: "active"},
        {_id: "key6", data: "value6", status: "draft"}
      ]

      await megaMap.bulkAdd(newItems)
      await Promise.all(newItems.map(item => secondaryMap.set(item._id, item)))

      newItems.forEach(item => {
        expect(secondaryMap.value[item._id]).toEqual(item)
      })
    })

    test("should sync deletions to secondary maps", () => {
      megaMap.delete("key1")
      secondaryMap.delete("key1")
      megaMap.notifyMapUpdated()

      expect(secondaryMap.value["key1"]).toBeUndefined()
    })
  })

  describe("error handling", () => {
    test("should handle failed loads gracefully", async () => {
      mockLoadOneFunction.mockRejectedValueOnce(new Error("Load failed"))
      const result = await megaMap.get("nonexistent")
      expect(result).toBeUndefined()
    })

    test("should handle failed bulk operations gracefully", async () => {
      mockLoadAllFunction.mockRejectedValueOnce(new Error("Bulk load failed"))
      await expect(megaMap.getAll(true)).rejects.toThrow()
    })

    test("should maintain map integrity after failed operations", async () => {
      const originalSubLists = unref(megaMap.subLists) as TestSubLists
      mockLoadOneFunction.mockRejectedValueOnce(new Error("Load failed"))
      await megaMap.get("errorKey")

      const subLists = unref(megaMap.subLists) as TestSubLists
      expect(subLists.active).toHaveLength(originalSubLists.active.length)
      expect(subLists.draft).toHaveLength(originalSubLists.draft.length)
    })
  })

  describe("loading states", () => {
    test("should track loading states", async () => {
      megaMap.clear()
      mockLoadAllFunction.mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve(testData), 100)
      }))

      const loadPromise = megaMap.getAll(true)
      expect(megaMap.isLoading.all).toBeTruthy()

      await loadPromise
      expect(megaMap.isLoading.all).toBeFalsy()
      expect(megaMap.hasLoadedOnce.all).toBeTruthy()
    })
  })

  describe("map operations", () => {
    test("should support iteration methods", () => {
      const entries = Array.from(megaMap.entries())
      expect(entries).toHaveLength(3)

      const values = Array.from(megaMap.values())
      expect(values).toHaveLength(3)

      const keys = Array.from(megaMap.keys())
      expect(keys).toHaveLength(3)

      const forEachItems: TestItem[] = []
      megaMap.forEach(item => forEachItems.push(item))
      expect(forEachItems).toHaveLength(3)
    })

    test("should track size correctly", () => {
      expect(megaMap.size).toBe(3)

      megaMap.set("key4", {_id: "key4", data: "value4", status: "active"})
      expect(megaMap.size).toBe(4)

      megaMap.delete("key4")
      expect(megaMap.size).toBe(3)

      megaMap.clear()
      expect(megaMap.size).toBe(0)
    })
  })
})