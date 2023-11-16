import { MegaMap, MegaMapOptions } from "./MegaMap"

import { MaybeRef, reactive } from "vue"

export class ReactiveMegaMap<K, V extends Record<string, any>> extends MegaMap<string, V> {
    readonly [Symbol.toStringTag]: string = "ReactiveMegaMap"
    _subLists: MaybeRef<Record<string, V[]>> = reactive({})

    get subLists(): MaybeRef<Record<string, V[]>> {
        return this._subLists
    }

    set subLists(value: MaybeRef<Record<string, V[]>>) {
        this._subLists = value
        // triggerRef(this._subLists)
    }

    async init(opts: MegaMapOptions<string, V>) {

        this._map = reactive(this._map)
        this._subLists = reactive({})

        for (const filterKey in this._subListFilters) {
            this._subLists[filterKey] = []
        }

        this.on("updated", () => this.updateSubLists())
    }

    updateSubLists() {
        for (const [filterKey, filter] of Object.entries(this._subListFilters)) {
            this._subLists[filterKey] = [...this.values()].filter(filter)
        }
    }

    private _updateLoadingStatus() {
        this.isLoading.all = !!this.loadingAll
        this.isLoading.loadingBy = this.loadingBy.size > 0
        this.isLoading.loadingQuery = this.loadingQuery.size > 0
        console.log("updateLoadingStatus", this.isLoading)
    }

    public readonly isLoading = reactive({
        all: false,
        loadingBy: false,
        loadingQuery: false
    })

}
