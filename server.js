// define ports
var expressPort = 80;
var mongodbPort = 4000;

// initial variables
const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(mongodbPort).sockets;
var express = require('express');
var session = require('express-session');
var fs = require('fs');
var path = require('path');
var app = express();

app.use(express.urlencoded());
app.use(express.json());

// allow public static folders for access
app.use('/assets/css', express.static(path.join(__dirname, '/assets/css')));
app.use('/assets/js', express.static(path.join(__dirname, '/assets/js')));
app.use('/assets/img', express.static(path.join(__dirname, '/assets/img')));

// allow expressJS uses session
app.use(session({
    secret: '3XD3FNT3CjxK6gpRnpkBycHmXLqjJ9C9xJfyEUTZ8sPbh8ArZgrtEYnFDQzLD44RD3HrtLExPvebv8FbpyHRvLEPE9mJHzrehDMZxvBj8mbaPYNCm898NaKpajvjjxVc', 
    cookie: { maxAge: 60 * 60 * 1000 } // the session will last for 1 hour
}));

// start expressJS server, to handle static html files
app.listen(expressPort);

// ExpressJS route table
// #1 route table - root
app.get('/', function (req, res) {

    // handle exisitng session
    if(req.session.isVisit) {

        // add visiting times
        req.session.isVisit++;
        
        // logging
        console.log(req.session.randId + " is visited.");

    } 

    // for first time visit
    else {
        // initialize random ID for current session
        req.session.isVisit = 1;
        req.session.randId = Math.floor(Math.random() * Math.floor(100000000));

        // logging
        console.log(req.session.randId + " is created.");
    
    }
    
    fs.readFile('view_index.html', "utf8", function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data.replace("%SessionID%", req.session.randId));
        //console.log(data);
        res.end();
    });
    
});

// #2 route table - admin login page
app.get('/admin', function (req, res) {
    // send with error message
    if(req.query.error == 1){
        fs.readFile('view_login.html', "utf8", function(err, data) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data.replace("display:none", "display:block"));
            //console.log(data);
            res.end();
        });
    }else{
        // send without error message
        fs.readFile('view_login.html', "utf8", function(err, data) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        });
    }
    
});

// #3 route table - admin backend
app.get('/backend', function (req, res) {

    // check user auth session
    if(req.session.login == 1){
        fs.readFile('view_backend.html', "utf8", function(err, data) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        });
        
    }else{
        res.redirect("/admin");
        res.end();
    }
    
    
});



// POST method - login function
app.post('/post_login', function (req, res) {
    // check user login by POST form data
    if((req.body.inputUsername == "admin") 
        // if everything correct
        && (req.body.inputPassword == "123456")){
        req.session.login = 1;
        res.redirect("/backend");
        res.end();
    }else{
        // if wrong username or password
        res.redirect("/admin?error=1");
        res.end();
    }

    
});

// POST method - logout function
app.post('/post_logout', function (req, res) {
    req.session.login = null;
    res.redirect("/admin");
    res.end();

    
});

// secert method to reset database
app.get('/reset', function (req, res) {
    // Connect to mongo
    mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
        if(err){
            throw err;
        }

        console.log('Reset triggered...');

        // Connect to Socket.io
        client.on('connection', function(socket){
            let chat = db.collection('chats');
            chat.remove({});
        });
    });

    res.write("Database reset");
    res.end();
});
// End of Express route table


// Start MongoDB
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }
    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        // initialize DB collection
        let chat = db.collection('chats');

        console.log('Socket.io connected...');

        // Handle handle_adminConnect event 
        socket.on("handle_adminConnect", function(data){

            // send current open chats list to backend admin
            chat.distinct("name", function(err, res){
                if(err){
                    throw err;
                }

                client.emit('handle_backend_sessionList', res);
            });
        });

        // Handle handle_backend_newMessage events
        socket.on('handle_backend_newMessage', function(data){
            let name = data.name;
            let message = data.message;
            let staff = data.staff;
            let datetime = data.datetime;

            // Check for message
            if(message != ''){
                
                // Insert message
                chat.insert({name: name, message: message, staff:staff, datetime: datetime}, function(){

                    // Get chats from mongo collection
                    chat.find({ name: name}).limit(100).sort({_id:1}).toArray(function(err, res){
                        if(err){
                            throw err;
                        }

                        // send messages to backend admin
                        client.emit('handle_retrive_backend_allMessages', res);

                    });


                });

                // send chats log to frontend client
                chat.find({ name: name}).limit(100).sort({_id:1}).toArray(function(err, res){
                    if(err){
                        throw err;
                    }

                    // send messages to backend admin
                    client.emit('handle_retrive_frontend_allMessages', res);

                });
                
            }
        });

        // Handle input events  
        socket.on('handle_frontend_newMessage', function(data){
            let name = data.name;
            let message = data.message;
            let staff = data.staff;
            let datetime = data.datetime;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                //sendStatus('Please enter a name and message');
            } else {

                // Insert message first
                chat.insert({name: name, message: message, staff: staff, datetime: datetime}, function(){
                    console.log(datetime);

                    // Get chats from mongo collection
                    chat.find({ name: name}).limit(100).sort({_id:1}).toArray(function(err, res){
                        if(err){
                            throw err;
                        }

                        // send messages to backend admin
                        client.emit('handle_retrive_backend_allMessages', res);
                        chat.distinct("name", function(err, result_DistinctSession){
                            if(err){
                                throw err;
                            }
                            client.emit('handle_backend_sessionList', result_DistinctSession);
                            client.emit('handle_backend_highlight', name);
                        });

                    });

                    // send chats log to frontend client
                    chat.find({ name: name}).limit(100).sort({_id:1}).toArray(function(err, res){
                        if(err){
                            throw err;
                        }

                        // send messages to frontend admin
                        client.emit('handle_retrive_frontend_allMessages', res);

                    });

                });
            }
        });

        // search
        socket.on('search', function(data){
            console.log("searching: " + data.toString());
            var query = "/" + data.toString() + "/";
            
             // Get chats from mongo collection
            chat.find({ message: { $regex: data, $options: 'i'} }).toArray(function(err, res){
                if(err){
                    throw err;
                }
                console.log(res);
                // Emit the messages
                client.emit('handle_backend_search_result', res);
            });
        });

        // Handle handle_backend_newMessage events
        socket.on('handle_retrive_backend_allMessages_bySession', function(data){

             // Get chat message depends on session name
            chat.find({ name: data}).limit(100).sort({_id:1}).toArray(function(err, res){
                if(err){
                    throw err;
                }

                // send messages to backend admin
                client.emit('handle_retrive_backend_allMessages', res);
            });

        });       



    });
});
