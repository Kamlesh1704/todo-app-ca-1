const express = require('express')
const format = require('date-fns/format')
//format(date, format, [options])
const isValid = require('date-fns/isValid')
//isValid(date)
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
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

const invalidmiddleware = (request, response, next) => {
  if (request.query.status !== undefined) {
    const {status} = request.query
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      next()
    } else {
      response.status(400).send('Invalid Todo Status')
    }
  } else if (request.query.category !== undefined) {
    const {category} = request.query
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
      next()
    } else {
      response.status(400).send('Invalid Todo Category')
    }
  } else if (request.query.priority !== undefined) {
    const {priority} = request.query
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      next()
    } else {
      response.status(400).send('Invalid Todo Priority')
    }
  } else if (request.query.date !== undefined) {
    next()
  } else if (request.query.search_q !== undefined) {
    next()
  }
}
const due_datetodueDate = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', invalidmiddleware, async (request, response) => {
  const {status, priority, category, search_q} = request.query
  let gettodoQuery = ''
  if (status !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            status LIKE '${status}';`
    const todoArrays = await db.all(gettodoQuery)
    response.send(todoArrays.map(eacharray => due_datetodueDate(eacharray)))
  } else if (priority !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            priority LIKE '${priority}';`
    const todoArrayp = await db.all(gettodoQuery)
    response.send(todoArrayp.map(eacharray => due_datetodueDate(eacharray)))
  } else if (priority !== undefined && status !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            status LIKE '${status}'
            AND priority LIKE '${priority}'`
    const todoArrayps = await db.all(gettodoQuery)
    response.send(todoArrayps.map(eacharray => due_datetodueDate(eacharray)))
  } else if (search_q !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            todo LIKE '%${search_q}%';`
    const todoArraysq = await db.all(gettodoQuery)
    response.send(todoArraysq.map(eacharray => due_datetodueDate(eacharray)))
  } else if (category !== undefined && status !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            status LIKE '${status}'
             AND category LIKE '${category}';`
    const todoArraycs = await db.all(gettodoQuery)
    response.send(todoArraycs.map(eacharray => due_datetodueDate(eacharray)))
  } else if (category !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            category LIKE '${category}';`
    const todoArrayc = await db.all(gettodoQuery)
    response.send(todoArrayc.map(eacharray => due_datetodueDate(eacharray)))
  } else if (category !== undefined && priority !== undefined) {
    gettodoQuery = `
            SELECT
              *
            FROM
            todo
            WHERE
            category LIKE '${category}'
            AND priority LIKE '${priority}';`
    const todoArraycp = await db.all(gettodoQuery)
    response.send(todoArraycp.map(eacharray => due_datetodueDate(eacharray)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const gettodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id= ${todoId};`
  const todo = await db.get(gettodoQuery)
  response.send(due_datetodueDate(todo))
})

app.get('/agenda/', invalidmiddleware, async (request, response) => {
  const {date} = request.query
  const dateObj = new Date(date)
  console.log(date)
  console.log(dateObj)
  if (isValid(dateObj)) {
    const formatedDate = format(dateObj, 'yyyy-MM-dd')
    const gettodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            due_date= '${formatedDate}';`
    const todo = await db.all(gettodoQuery)
    response.send(todo.map(eachtodo => due_datetodueDate(eachtodo)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

const postmiddleware = (request, response, next) => {
  const {priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isValid(new Date(dueDate))) {
          next()
        } else {
          response.status(400).send('Invalid Due Date')
        }
      } else {
        response.status(400).send('Invalid Todo Category')
      }
    } else {
      response.status(400).send('Invalid Todo Status')
    }
  } else {
    response.status(400).send('Invalid Todo Priority')
  }
}

app.post('/todos/', postmiddleware, async (request, response) => {
  const tododetail = request.body
  const {id, todo, priority, status, category, dueDate} = tododetail
  const dateObj = new Date(dueDate)
  const formatedDate = format(dateObj, 'yyyy-MM-dd')
  const addtodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status,category,due_date)
    VALUES
      (
        ${id},
        '${todo}',
         '${priority}',
         
         '${status}',
         '${category}',
         '${formatedDate}'
      );`

  await db.run(addtodoQuery)

  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status, priority, todo, category, dueDate} = request.body

  if (status !== undefined) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      const updateTodoQuery = `
                UPDATE
                    todo
                SET
                    status='${status}'
                WHERE
                    id = ${todoId};`
      await db.run(updateTodoQuery)
      response.send('Status Updated')
    } else {
      response.status(400).send('Invalid Todo Status')
    }
  } else if (priority !== undefined) {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      const updateTodoQuery = `
                UPDATE
                    todo
                SET
                    priority='${priority}'
                WHERE
                    id = ${todoId};`
      await db.run(updateTodoQuery)
      response.send('Priority Updated')
    } else {
      response.status(400).send('Invalid Todo Priority')
    }
  } else if (todo !== undefined) {
    const updateTodoQuery = `
            UPDATE
                todo
            SET
                todo='${todo}'
            WHERE
                id = ${todoId};`
    await db.run(updateTodoQuery)
    response.send('Todo Updated')
  } else if (category !== undefined) {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
      const updateTodoQuery = `
                UPDATE
                    todo
                SET
                    category='${category}'
                WHERE
                    id = ${todoId};`
      await db.run(updateTodoQuery)
      response.send('Category Updated')
    } else {
      response.status(400).send('Invalid Todo Category')
    }
  } else if (dueDate !== undefined) {
    if(isValid(new Date(dueDate))){
      const dateObj = new Date(dueDate)
      const formatedDate = format(dateObj, 'yyyy-MM-dd')
      const updateTodoQuery = `
                UPDATE
                    todo
                SET
                    due_date='${formatedDate}'
                WHERE
                    id = ${todoId};`
      await db.run(updateTodoQuery)
      response.send('Due Date Updated')
    }
    }else{ response.status(400).send('Invalid Due Date')}
  })

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
