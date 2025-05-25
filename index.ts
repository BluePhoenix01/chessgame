import express from "express"
import morgan from "morgan"

const app = express()
const port = 3000
// const PATH = path.dirname(fileURLToPath(import.meta.url))
app.use(morgan('tiny'))

app.get('/', (req, res) => {
  res.send("Hello! World")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
