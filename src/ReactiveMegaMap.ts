import { MegaMap, MegaMapOptions } from "./MegaMap"

import { reactive } from "vue"

export class ReactiveMegaMap<K, V extends Record<string, any>> extends MegaMap<string, V> {
    readonly [Symbol.toStringTag]: string = "ReactiveMegaMap"

    async init(opts: MegaMapOptions<string, V>) {
        this._map = reactive(this._map)
        this.subLists = new Proxy(reactive({}), {
            get: (target, prop) => {
                if (prop === Symbol.iterator) {
                    return function* () {
                        for (let [key, val] of Object.entries(target)) {
                            yield [key, val]
                        }
                    }
                }
                return prop in target ? target[prop] : []
            },
            set: (target, prop, value) => {
                target[prop] = value
                return true
            }
        })


        this.onUpdated = opts.onUpdated

        for (const filterKey in this._subListFilters) {
            this.subLists[filterKey] = []
        }

        this.getAll().then(() => {
            this.updateSubLists()
        })

        if (this.onUpdated) {
            setTimeout(() => {
                this.notifyMapUpdated()
                this.onUpdated()
            }, 0)
        }
    }

}
