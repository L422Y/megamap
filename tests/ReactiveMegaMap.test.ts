import { ReactiveMegaMap } from "../src/ReactiveMegaMap"
import { isProxy, isReactive, watchSyncEffect } from "vue"

type TPost = { _id: string, data: string, status: string }

/**
 * Runs `read` immediately and again on every reactive notification, counting
 * the notifications (the initial run is not counted).
 */
function tracker(read: () => unknown) {
    let notifications = -1
    const stop = watchSyncEffect(() => {
        read()
        notifications++
    })
    return {
        get count() {
            return notifications
        },
        stop
    }
}

describe("ReactiveMegaMap", () => {
    let reactiveMap: ReactiveMegaMap<string, TPost>
    let mockLoadOneFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock

    beforeEach(async () => {
        mockLoadOneFunction = jest.fn().mockImplementation((key) => Promise.resolve({
            _id: key,
            data: `Data for ${key}`,
            status: "active"
        }))
        mockLoadAllFunction = jest.fn().mockImplementation(() => Promise.resolve([
            {_id: "key1", data: "value1", status: "active"},
            {_id: "key2", data: "value2", status: "draft"}
        ]))

        reactiveMap = new ReactiveMegaMap<string, TPost>({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            keyProperty: "_id",
            subListFilters: {
                active: (item) => item.status === "active",
                draft: (item) => item.status === "draft"
            }
        })

        await reactiveMap.getAll()
    })

    describe("initialization", () => {
        test("should pre-populate a sublist for every filter", () => {
            const map = new ReactiveMegaMap<string, TPost>({
                loadOne: mockLoadOneFunction,
                keyProperty: "_id",
                subListFilters: {active: (item) => item.status === "active"}
            })
            expect(map.subLists.active).toEqual([])
        })

        test("should expose reactive loading state", () => {
            expect(isReactive(reactiveMap.isLoading)).toBe(true)
            expect(isReactive(reactiveMap.hasLoadedOnce)).toBe(true)
        })

        test("should load all items when loadAll is provided", () => {
            expect(mockLoadAllFunction).toHaveBeenCalled()
            expect(reactiveMap.size).toBe(2)
        })
    })

    describe("record identity", () => {
        test("should not wrap records in a proxy", () => {
            const record: TPost = {_id: "key3", data: "value3", status: "active"}
            reactiveMap.set("key3", record)

            expect(reactiveMap.value.key3).toBe(record)
            expect(isProxy(reactiveMap.value.key3)).toBe(false)
        })

        test("should hand out the same ref for a key on every call", () => {
            expect(reactiveMap.itemRef("key1")).toBe(reactiveMap.itemRef("key1"))
        })

        test("should allow a ref to be taken before the record exists", () => {
            const ref = reactiveMap.itemRef("later")
            expect(ref.value).toBeUndefined()

            const record: TPost = {_id: "later", data: "late", status: "draft"}
            reactiveMap.set("later", record)
            expect(ref.value).toBe(record)
        })
    })

    describe("granular record updates", () => {
        test("should notify only the updated record's ref", () => {
            const key1 = tracker(() => reactiveMap.itemRef("key1").value)
            const key2 = tracker(() => reactiveMap.itemRef("key2").value)

            reactiveMap.set("key1", {_id: "key1", data: "changed", status: "active"})

            expect(key1.count).toBe(1)
            expect(key2.count).toBe(0)

            key1.stop()
            key2.stop()
        })

        test("should notify a record's ref when the record is touched in place", () => {
            const key1 = tracker(() => reactiveMap.itemRef("key1").value)
            const key2 = tracker(() => reactiveMap.itemRef("key2").value)

            reactiveMap.value.key1.data = "mutated"
            expect(key1.count).toBe(0)

            reactiveMap.touch("key1")
            expect(key1.count).toBe(1)
            expect(key2.count).toBe(0)

            key1.stop()
            key2.stop()
        })

        test("should notify a record's ref when it is deleted", () => {
            const ref = reactiveMap.itemRef("key1")
            const key1 = tracker(() => ref.value)

            reactiveMap.delete("key1")

            expect(key1.count).toBe(1)
            expect(ref.value).toBeUndefined()

            key1.stop()
        })

        test("should notify only records replaced by a reload", async () => {
            const unchanged = reactiveMap.value.key2
            mockLoadAllFunction.mockResolvedValueOnce([
                {_id: "key1", data: "reloaded", status: "active"},
                unchanged
            ])

            const key1 = tracker(() => reactiveMap.itemRef("key1").value)
            const key2 = tracker(() => reactiveMap.itemRef("key2").value)

            await reactiveMap.getAll(true)

            expect(key1.count).toBe(1)
            expect(key2.count).toBe(0)

            key1.stop()
            key2.stop()
        })
    })

    describe("collection updates", () => {
        test("should notify map-level consumers on any content change", () => {
            const all = tracker(() => reactiveMap.value)

            reactiveMap.set("key3", {_id: "key3", data: "value3", status: "active"})
            expect(all.count).toBe(1)

            reactiveMap.delete("key3")
            expect(all.count).toBe(2)

            all.stop()
        })

        test("should repoint the map ref after a clear", () => {
            const all = tracker(() => Object.keys(reactiveMap.value).length)

            reactiveMap.clear()

            expect(all.count).toBeGreaterThan(0)
            expect(reactiveMap.value).toEqual({})
            expect(reactiveMap.mapRef.value).toBe(reactiveMap.value)

            all.stop()
        })
    })

    describe("sublists", () => {
        test("should notify only the sublists whose contents changed", () => {
            const active = tracker(() => reactiveMap.subLists.active)
            const draft = tracker(() => reactiveMap.subLists.draft)

            // key2 is a draft; replacing it must not disturb the active list
            reactiveMap.set("key2", {_id: "key2", data: "changed", status: "draft"})

            expect(draft.count).toBe(1)
            expect(active.count).toBe(0)

            active.stop()
            draft.stop()
        })

        test("should move a record between sublists when its filter match changes", () => {
            expect(reactiveMap.subLists.active.map(i => i._id)).toEqual(["key1"])
            expect(reactiveMap.subLists.draft.map(i => i._id)).toEqual(["key2"])

            reactiveMap.set("key1", {_id: "key1", data: "value1", status: "draft"})

            expect(reactiveMap.subLists.active).toEqual([])
            expect(reactiveMap.subLists.draft.map(i => i._id)).toEqual(["key1", "key2"])
        })

        test("should reflect an in-place status change on touch", () => {
            reactiveMap.value.key1.status = "draft"
            expect(reactiveMap.subLists.active.length).toBe(1)

            reactiveMap.touch("key1")
            expect(reactiveMap.subLists.active.length).toBe(0)
            expect(reactiveMap.subLists.draft.length).toBe(2)
        })

        test("should empty the sublists on clear", () => {
            reactiveMap.clear()
            expect(reactiveMap.subLists.active).toEqual([])
            expect(reactiveMap.subLists.draft).toEqual([])
        })
    })
})
