var server = require('ws').Server
var s = new server({ port: 8000 });

//all connected to the server users 
var users = {};

s.on('connection', function (connection) {
    console.log("user connected");

    //when server gets a message from a connected user 
    connection.on('message', function (message) {

        var data;
        //accepting only JSON messages 
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }

        //switching type of the user message 
        switch (data.type) {
            //when a user tries to login 

            case "login":

                //if anyone is logged in with this username then refuse 
                if (users[data.name]) {
                    sendTo(connection, {
                        type: "login",
                        success: false
                    });
                } else {
                    //save user connection on the server 
                    users[data.name] = connection;
                    connection.name = data.name;
                    console.log("User logged", data.name);
                    sendTo(connection, {
                        type: "login",
                        success: true
                    });
                }

                break;

            case "offer":
                //for ex. UserA wants to call UserB 
                console.log("Sending offer to: ", data.name);

                //if UserB exists then send him offer details 
                var conn = users[data.name];

                if (conn != null) {
                    //setting that UserA connected with UserB 
                    connection.otherName = data.name;

                    sendTo(conn, {
                        type: "offer",
                        offer: data.offer,
                        name: connection.name
                    });
                }

                break;

            case "answer":
                console.log("Sending answer to: ", data.name);
                //for ex. UserB answers UserA 
                var conn = users[data.name];

                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: "answer",
                        answer: data.answer
                    });
                }

                break;

            case "leave":
                console.log("Disconnecting from", data.name);
                var conn = users[data.name];
                conn.otherName = null;

                //notify the other user so he can disconnect his peer connection 
                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    });
                }

                break;

            default:
                sendTo(connection, {
                    type: "error",
                    message: "Command no found: " + data.type
                });

                break;
        }

        // console.log("user connected",data.name);
    });

    function sendTo(connection, message) {
        connection.send(JSON.stringify(message));
    }

    connection.send("Hello...!!! Client");
}); 