import { ReactiveMegaMap } from "../src/ReactiveMegaMap"
import { reactive } from "vue"

// Mock vue's reactive function
jest.mock('vue', () => ({
    reactive: jest.fn(obj => obj)
}))

describe("ReactiveMegaMap", () => {
    let reactiveMap: ReactiveMegaMap<string, { _id: string, data: string, status: string }>
    let mockLoadOneFunction: jest.Mock
    let mockLoadAllFunction: jest.Mock

    beforeEach(() => {
        mockLoadOneFunction = jest.fn().mockImplementation((key) => Promise.resolve({
            _id: key,
            data: `Data for ${key}`,
            status: "active"
        }))
        mockLoadAllFunction = jest.fn().mockImplementation(() => Promise.resolve([
            {_id: "key1", data: "value1", status: "active"},
            {_id: "key2", data: "value2", status: "draft"}
        ]))

        reactiveMap = new ReactiveMegaMap({
            loadOne: mockLoadOneFunction,
            loadAll: mockLoadAllFunction,
            keyProperty: "_id",
            subListFilters: {
                active: (item) => item.status === "active",
                draft: (item) => item.status === "draft"
            }
        })
    })

    describe("initialization", () => {
        test("should create reactive properties", () => {
            expect(reactive).toHaveBeenCalledWith(expect.any(Object))
            expect(reactiveMap._map).toBeDefined()
            expect(reactiveMap._subLists).toBeDefined()
        })

        test("should initialize reactive loading states", () => {
            expect(reactiveMap.isLoading.all).toBeFalsy()
            expect(reactiveMap.isLoading.loadingBy).toBeFalsy()
            expect(reactiveMap.isLoading.loadingQuery).toBeFalsy()
        })

        test("should initialize reactive hasLoadedOnce states", () => {
            expect(reactiveMap.hasLoadedOnce.all).toBeFalsy()
            expect(reactiveMap.hasLoadedOnce.loadingBy).toBeFalsy()
            expect(reactiveMap.hasLoadedOnce.loadingQuery).toBeFalsy()
        })
    })

    describe("reactive updates", () => {
        beforeEach(async () => {
            await reactiveMap.getAll()
        })

        test("should update reactive subLists when items change", () => {
            reactiveMap.set("key3", { _id: "key3", data: "value3", status: "active" })
            expect(reactiveMap.subLists.active.length).toBe(2)
            expect(reactiveMap.subLists.draft.length).toBe(1)
        })

        test("should maintain reactivity when clearing", () => {
            reactiveMap.clear()
            expect(reactiveMap.subLists.active.length).toBe(0)
            expect(reactiveMap.subLists.draft.length).toBe(0)
        })

        test("should update loading states reactively", async () => {
            const loadPromise = reactiveMap.getAll(true)
            expect(reactiveMap.isLoading.all).toBeTruthy()
            await loadPromise
            expect(reactiveMap.isLoading.all).toBeFalsy()
        })
    })

    describe("subLists reactivity", () => {
        test("should update subLists reactively on item modifications", async () => {
            await reactiveMap.getAll()

            // Modify item status
            reactiveMap.set("key1", { _id: "key1", data: "value1", status: "draft" })
            expect(reactiveMap.subLists.active.length).toBe(0)
            expect(reactiveMap.subLists.draft.length).toBe(2)
        })

        test("should maintain separate reactive references for each subList", async () => {
            await reactiveMap.getAll()
            const activeList = reactiveMap.subLists.active
            const draftList = reactiveMap.subLists.draft

            reactiveMap.set("key3", { _id: "key3", data: "value3", status: "active" })
            expect(reactiveMap.subLists.active).toBe(activeList)
            expect(reactiveMap.subLists.draft).toBe(draftList)
        })
    })

    describe("error handling", () => {
        test("should handle errors while maintaining reactive state", async () => {
            mockLoadAllFunction.mockRejectedValueOnce(new Error("Load failed"))

            try {
                await reactiveMap.getAll()
            } catch (error) {
                expect(reactiveMap.isLoading.all).toBeFalsy()
                expect(Object.keys(reactiveMap._map).length).toBe(0)
            }
        })
    })
})