const express = require('express')
const path = require('path')
const cors = require('cors')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(cors())
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoidQuery = `SELECT * FROM todo WHERE id = ${todoId}`
  const dbresponse = await db.get(todoidQuery)
  console.log(dbresponse)
  response.send(dbresponse)
})

app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const addtodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status)
    VALUES
      (
        ${id},
        '${todo}',
         '${priority}',
         '${status}'
      );`

  const dbResponse = await db.run(addtodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} =
    request.params /*The todoId parameter from the URL is extracted to know which todo item needs to be updated.*/
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    // examines the data sent in the request body to figure out which aspect of the todo item needs to be updated: its status, priority, or the todo itself.
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery) //The code fetches the current data of the todo item from the database to have a reference for the update.
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body //The code extracts the updated values for the todo item from the request body. If a value isn't provided, it retains the previous value.

  const updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`
  await db.run(updateTodoQuery) //Using the extracted data, the code constructs an SQL query to update the todo item's information in the database.
  response.send(`${updateColumn} Updated`)
}) //Sending the required response.

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deletetodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`
  await db.run(deletetodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
