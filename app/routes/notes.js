const express = require('express');
const router = express.Router();
const Note = require("../models/note")
const withAuth = require('../middlewares/auth')

router.post('/', withAuth, async(req, res) => {
    const {title, body} = req.body
    
    try {
        let note = new Note({title: title, body: body, author: req.user._id})
        await note.save()
        res.status(200).json(note)
    } catch (error) {
        res.status(500).json({error: 'Problem to create a new note'})
    }
})

router.get('/:id', withAuth, async(req, res) => {
    try {
        const {id} = req.params
        let note = await Note.findById(id)
        if(isOwner(req.user, note))
            res.json(note)
        else
            res.status(403).json({error: 'Permission denied'})

    } catch (error) {
        res.status(500).json({error: 'Problem to get a note'})
    }
})

router.put('/:id', withAuth, async(req, res) => {
    const { title, body } = req.body
    const { id } = req.params

    try {
        let note = await Note.findById(id)
        if(isOwner(req.user, note)){
            let note = await Note.findByIdAndUpdate(id, 
                {$set: {title: title, body: body}},
                {upsert: true, 'new': true}
            )

            res.json(note)
        }else{
            res.status(403).json({error: 'Permission denied'})
        }
    } catch (error) {
        res.status(500).json({error: 'Problem to update a note'})
    }
})

router.delete('/:id', withAuth, async(req, res) => {
    const { id } = req.params

    try {
        let note = await Note.findById(id)
        if(isOwner(req.user, note)){
            await note.deleteOne()
            res.json({message: `OK to delete note ${id}`})
        }else{
            res.status(403).json({error: 'Permission denied'})
        }
    } catch (error) {
        res.status(500).json({error: 'Problem to delete a note'})
    }
})

router.get('/', async(req, res) => {
    try {
        let notes = await Note.find()
        res.send(notes)
    } catch (error) {
        res.status(500).json({error: 'Problem to get a notes'})
    }
})

const isOwner = (user, note) => {
    if(JSON.stringify(user._id) == JSON.stringify(note.author._id))
        return true
    else
        return false
}

module.exports = router