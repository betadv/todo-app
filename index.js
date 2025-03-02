const express = require('express');
const app = express();

const EasyDB = require('@betadv/easy-db');
const db = new EasyDB({
	path: './db/users.json',
	liveDB: true,
  beautify: true,
	encrypted: false,
});

const cookieSession = require('cookie-session')
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieSession({
	name: 'session',
	keys: ['testingkey'],
	maxAge: 1 * 60 * 60 * 1000 // 1 hour
}))

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
	req.session = {};
	res.render('index', { req, username: "", lastID:0 });
});

app.post('/todos/add', (req, res) => {
  
	let username = req.body.username.toLowerCase();

	const user = db.get(username) || {};

	let todos = user.todos || [];
	let lastID = user.lastID;
	
	
	let todoText = req.body.todoText;
	let itemID = req.body.itemID;

	
	db.push(username + ".todos", { text: todoText, completed: false, itemID: lastID + 1 });
	db.add(username + ".lastID", 1)
	res.render('index', { req, todos, username, db, lastID });
});

app.post('/todos/update', (req, res) => {
	const username = req.session.username.toLowerCase();
	const checked = req.body.completed;
	let itemID = req.body.itemID;
	
	const user = db.get(username);
	let todos = user.todos;
	let lastID = db.get(username + ".lastID")

	for (let i = 0; i < todos.length; i++) {
		if (todos[i].itemID === itemID) {
			todos[i].completed = checked;
		}
	}
		
	db.set(username + ".todos", todos)
	res.render('index', { req, todos, username, db, lastID });

});


app.post("/todos", (req, res) => {

	let username = req.body.username.toLowerCase();

	if(!db.get(username)) db.set(username, { lastID: 0, todos: [] })
	
	const user = db.get(username);
	
	let todos = user.todos || [];
	let lastID = user.lastID;

	req.session.username = username; // CHANGE SESSION USER
	
	res.render('index', { req, todos, username, db, lastID });
})

app.post('/todos/remove', (req, res) => {
	let username = req.session.username;
	
	const user = db.get(username);
	let itemID = req.body.itemID
	let todos = user.todos;
	let lastID = db.get(username + ".lastID")

	let entry = todos.find(item => item.itemID === itemID);

	console.log(entry)
	
	db.unpush(username + ".todos", entry)
	res.render('index', { req, todos, username, db, lastID });
});


app.listen(3000, () => {
	console.log('Server listening on port 3000');
});