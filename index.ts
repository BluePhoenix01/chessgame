import express from "express"
import morgan from "morgan"

const app = express()
const port = 3000
// const PATH = path.dirname(fileURLToPath(import.meta.url))
app.use(morgan('tiny'))
app.use(express.json())

app.get('/', (req, res) => {
  res.send("Hello World")
})

app.get('/user/:id', (req, res) => {
    const id = req.params.id
    res.send(`Fetching user with id: ${id}`) 
})

app.post('/user', (req, res) => {
    const userdata = req.body
    console.log(userdata)
    res.send(`Creating user: ${JSON.stringify(userdata)}`) 
})

app.put('/user/:id', (req, res) => {
    const id = req.params.id
    const userdata = req.body
    res.send(`Updating user ${id}: ${JSON.stringify(userdata)}`) 
})
 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
