const express = require("express")
const router = express.Router()
let posts = [
    {_id: "key1", data: "value1", status: "active"},
    {_id: "key2", data: "value2", status: "inactive"},
    {_id: "key3", data: "value3", status: "inactive"},
    {_id: "key4", data: "value4", status: "draft"},
    {_id: "key5", data: "value5", status: "draft"},
    {_id: "key6", data: "value6", status: "draft"},
    {_id: "key7", data: "value7", status: "draft"},
    {_id: "key8", data: "value8", status: "draft"},
]

// Helper function to add delay
const withDelay = (callback, min = 500, max = 1500) => {
    return (req, res) => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min
        setTimeout(() => callback(req, res), delay)
    }
}

const fakePost = (id) => {
    const _id = id || Math.floor(Math.random() * 1000000) + 10
    const post = {
        _id,
        title: `Post ${_id}`,
        status: Math.random() > 0.5 ? "published" : "draft",
        slug: `fake-post-${_id}`,
        author: `0000${Math.floor(Math.random() * 3) + 1}`,
        content: `Content for fake-post-${_id} (Generated at ${new Date().toLocaleTimeString()})`,
        updatedAt: new Date().toISOString()
    }
    post.tags = ["fake", "mock", "dummy", "tag1"].slice(0, Math.floor(Math.random() * 3) + 1)
    return post
}

// Initialize with some random posts
for (let i = 0; i < 3; i++) {
    posts.push(fakePost())
}

// Mock routes with artificial delays
router.get("/api/posts", withDelay((req, res) => {
    res.json(posts)
}))

router.get("/api/posts/mine", withDelay((req, res) => {
    res.json(posts)
}))

router.get("/api/posts/by-slug/:slug", withDelay((req, res) => {
    const results = posts.filter((post) => post.slug === req.params.slug)
    if (results.length) {
        res.json(results)
    } else {
        res.status(404).json({message: "Post not found"})
    }
}))

router.get("/api/posts/by-tag/:tag", withDelay((req, res) => {
    const results = posts.filter((post) => post.tags?.includes(req.params.tag))
    if (results.length) {
        res.json(results)
    } else {
        res.status(404).json({message: "Post not found"})
    }
}))

router.get("/api/posts/by-author/:id", withDelay((req, res) => {
    const results = posts.filter((post) => post.author === req.params.id)
    if (results.length) {
        res.json(results)
    } else {
        res.status(404).json({message: "Post not found"})
    }
}))

router.get("/api/posts/by-id/:id", withDelay((req, res) => {
    res.json(fakePost(req.params.id))
}, 800, 2000))

module.exports = router