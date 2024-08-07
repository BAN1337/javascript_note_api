var express = require('express');
var router = express.Router();
const User = require("../models/user")
const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.JWT_TOKEN
const withAuth = require('../middlewares/auth')

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  const user = new User({ name, email, password })

  try {
    await user.save()
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: 'Error registering new user' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    let user = await User.findOne({ email })
    if (!user)
      res.status(401).json({ error: 'Incorrect email or password' })
    else {
      user.isCorrectPassword(password,
        function (err, same) {
          if (!same)
            res.status(401).json({ error: 'Incorrect email or password' })
          else {
            const token = jwt.sign({ email }, secret, { expiresIn: '10d' })
            res.json({ user: user, token: token })
          }
        }
      )
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Error, please try again' })
  }
})

router.delete('/edit/:id', withAuth, async (req, res) => {
  const { id } = req.params
  try {
    await User.findByIdAndDelete(id)
    res.json(`Delete ok: id ${id}`)
  } catch (error) {
    res.status(500).json({ error })
  }
})

router.put('/edit/name/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { newName } = req.body

    let user = await User.findByIdAndUpdate(id,
      { $set: { name: newName } },
      { upsert: true, 'new': true }
    )
    res.json(user)
  } catch (error) {
    res.status(500).json({ error })
  }
})

router.put('/edit/email/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { newEmail } = req.body

    let user = await User.findByIdAndUpdate(id,
      { $set: { email: newEmail } },
      { upsert: true, 'new': true }
    )
    res.json(user)
  } catch (error) {
    res.status(500).json({ error })
  }
})

router.put('/edit/password/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { currentPassword, newPassword } = req.body

    let user = await User.findOne({ _id: id })
    if (!user)
      res.status(401).json({ error: 'Incorrect ID' })
    else {
      user.isCorrectPassword(currentPassword,
        async function (err, same) {
          if (!same)
            res.status(401).json({ error: 'Incorrect password' })
          else {
            let userUpdate = new User({ email: 'teste', name: 'teste', password: newPassword })
            userUpdate = await userUpdate.save()

            let user = await User.findByIdAndUpdate(id,
              { $set: { password: userUpdate.password } },
              { upsert: true, 'new': true }
            )
            await User.findByIdAndDelete(userUpdate.id)
            res.json(user)
          }
        }
      )
    }
  } catch (error) {
    res.status(500).json({ error })
  }
})

router.get('/', async (req, res) => {
  try {
    let users = await User.find()
    res.send(users)
  } catch (error) {
    res.status(500).json({ error: 'Problem to get a users' })
  }
})

module.exports = router;