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
const fakePost = (id) => {
    const _id = id || Math.floor(Math.random() * 1000000) + 10
    const post = {
        _id,
        title: "Fake Post",
        status: Math.random() > 0.5 ? "published" : "draft",
        slug: `fake-post-${_id}`,
        author: `0000${Math.floor(Math.random() * 3) + 1}`,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nulla facilisi. Donec euismod, velit eget tincidunt ultricies, libero enim luctus nisl, in tincidunt sapien lorem eget dui. Donec auctor, massa at aliquam aliquam, augue eros tincidunt sem, a suscipit est augue id nisl. Nulla facilisi. Sed euismod, mauris sed ultricies ultricies, urna nisl ultrices lorem, ac tincidunt nisl eros sed nunc. Sed id tortor eget nisl euismod aliquet. Nulla facilisi. Sed euismod, mauris sed ultricies ultricies, urna nisl ultrices lorem, ac tincidunt nisl eros sed nunc. Sed id tortor eget nisl euismod aliquet. Nulla facilisi. Sed euismod, mauris sed ultricies ultricies, urna nisl ultrices lorem, ac tincidunt nisl eros sed nunc. Sed id tortor eget nisl euismod aliquet. Nulla facilisi.",
    }
    post.tags = ["fake", "mock", "dummy", "tag1"].slice(0, Math.floor(Math.random() * 3) + 1)
    return post
}

for (let i = 0; i < 3; i++) {

    posts.push(fakePost())
}

// Mock route
router.get("/api/posts", (req, res) => {
    res.json(posts)
})

router.get("/api/posts/mine", (req, res) => {
    res.json(posts)
})

router.get("/api/posts/by-slug/:slug", (req, res) => {
    const results = posts.filter((post) => post.slug === req.params.slug)
    if (results) {
        res.json(results)
    } else {
        res.status(404).json({message: "Post not found"})
    }
})
router.get("/api/posts/by-tag/:tag", (req, res) => {
    const results = posts.filter((post) => post.tags?.includes(req.params.tag))
    if (results) {
        res.json(results)
    } else {
        res.status(404).json({message: "Post not found"})
    }
})

router.get("/api/posts/by-author/:id", (req, res) => {
    const results = posts.filter((post) => post.author === req.params.id)
    if (results) {
        res.json(results)
    } else {
        res.status(404).json({message: "Post not found"})
    }
})

router.get("/api/posts/by-id/:id", (req, res) => {
    res.json(fakePost(req.params.id))
})


module.exports = router
