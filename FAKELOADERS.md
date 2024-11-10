## Fake Loaders

```typescript
// define a type for our fake data
type TFakePost = {
    _id: string,
    data: string,
    status: "active" | "draft" | "inactive"
}

// load a single record by key
const fakeRecordLoad = async (key: string) => Promise.resolve<TFakePost>({
    _id: key,
    data: `data: ${key}`,
    status: ["active", "draft", "inactive"][Math.floor(Math.random() * 3)]
})

// load all records
const fakeMultipleRecordLoad = async () => () => Promise.resolve<TFakePost[]>([
    {_id: "key1", data: "value1", status: "active"},
    {_id: "key2", data: "value2", status: "inactive"},
    {_id: "key3", data: "value3", status: "inactive"},
    {_id: "key4", data: "value4", status: "draft"},
    {_id: "key5", data: "value5", status: "draft"},
    {_id: "key6", data: "value6", status: "draft"},
    {_id: "key7", data: "value7", status: "draft"},
    {_id: "key8", data: "value8", status: "draft"},
])
```