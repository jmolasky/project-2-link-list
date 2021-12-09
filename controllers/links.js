// Require dependencies
const express = require("express");
const linksRouter = express.Router();
const Link = require("../models/link");

const axios = require("axios");
require("dotenv").config();
const BASE_URL = "https://api.linkpreview.net/";
const API_KEY = process.env.API_KEY;

// Routes / Controllers

// Search Route
linksRouter.post("/search", async (req, res) => {
    if(res.locals.user === null) {
        res.redirect("/login");
    } else {
        const term = req.body.term;
        let links = await Link.find({ title: { $regex: term }});
        if(links.length === 0) {
            links = "No Results";
        }
        res.render("index.ejs", { links, navBrand: "Search Results"});
    }
});

// seed route
linksRouter.get("/seed", async (req, res) => {
    if(res.locals.user === null) {
        res.redirect("/login");
    } else {
        const data = [
            {
                title: "KMFDM 97 GERMANY",
                url: "https://www.youtube.com/watch?v=Sp9Pvb2ulbQ",
                user_id: res.locals.user._id,
                website: "YouTube",
                description: "ViVA show",
                private: false,
            },
            {
                title: ".filter() jQuery API documentation",
                url: "https://api.jquery.com/filter/",
                user_id: res.locals.user._id,
                private: false,
            },
        ];
        await Link.deleteMany({});
        await Link.create(data);
        res.redirect("/");
    }
});

// Index
linksRouter.get("/", (req, res) => {
    // store categories in database?
    if(res.locals.user === null) {
        res.redirect("/login");
    } else {
        const id = req.session.user;
        // find only links belonging to the user
        Link.find({ user_id: id }, (err, links) => {
            res.render("index.ejs", { links, navBrand: "Links" });
        });
    }
});

// New
linksRouter.get("/new", (req, res) => {
    if(res.locals.user === null) {
        res.redirect("/login");
    } else {
        res.render("new.ejs", { navBrand: "Add a Link" });
    }
});

// Delete
linksRouter.delete("/:id", (req, res) => {
    Link.findByIdAndDelete(req.params.id, (err, link) => {
        res.redirect("/");
    });
});

// Update
linksRouter.put("/:id", async (req, res) => {
    req.body.private = !!req.body.private;
    //req.body.user_id = res.locals.user._id;
    if(req.body.description === '') {
        req.body.description = null;
    }
    if(req.body.website === '') {
        req.body.website = null;
    }
    if(!req.body.url.includes("youtube.com")) {
        const url = req.body.url;
        await axios.get(`${BASE_URL}?key=${API_KEY}&q=${url}`).then(response => {
            req.body.img = response.data.image;
        });
    }
    // Link.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, link) => {
    // });
    await Link.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect("/");
});

// Create
linksRouter.post("/", async (req, res) => {
    const url = req.body.url;
    // call the linkpreview.net API here to get image for site preview to add to database
    if(!req.body.url.includes("youtube.com")) {
        await axios.get(`${BASE_URL}?key=${API_KEY}&q=${url}`).then(response => {
            req.body.img = response.data.image;
        });
    }
    req.body.private = !!req.body.private;
    req.body.user_id = req.session.user;
    if(req.body.description === '') {
        delete req.body.description;
    }
    Link.create(req.body, (error, link) => {
        res.redirect("/");
    });
});

// Edit
linksRouter.get("/:id/edit", (req, res) => {
    if(res.locals.user === null) {
        res.redirect("/login");
    } else {
        Link.findById(req.params.id, (err, link) => {
            res.render("edit.ejs", { link, navBrand: "Edit Link" });
        });
    }
});

module.exports = linksRouter;