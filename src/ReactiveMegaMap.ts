import { MegaMap, MegaMapOptions } from "./MegaMap"

import { MaybeRef, reactive } from "vue"
import { LoadingState } from "../src"

export function useReactiveMegaMap<K extends string, V extends Record<string, any>>(opts: MegaMapOptions<K, V>) {
  return new ReactiveMegaMap<K, V>(opts)
}

export class ReactiveMegaMap<K, V extends Record<string, any>> extends MegaMap<K, V> {
  readonly [Symbol.toStringTag]: string = "ReactiveMegaMap"
  public readonly isLoading = reactive({
    all: LoadingState.NOT_LOADED,
    loadingBy: LoadingState.NOT_LOADED,
    loadingQuery: LoadingState.NOT_LOADED
  })
  public readonly hasLoadedOnce = reactive({
    all: LoadingState.NOT_LOADED,
    loadingBy: LoadingState.NOT_LOADED,
    loadingQuery: LoadingState.NOT_LOADED
  })

  _subLists: MaybeRef<Record<string, V[]>> = reactive({})

  get subLists(): MaybeRef<Record<string, V[]>> {
    return this._subLists
  }

  set subLists(value: MaybeRef<Record<string, V[]>>) {
    this._subLists = value
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
      this._subLists[filterKey] = Object.values(this._map).filter(filter)
    }
  }
}
