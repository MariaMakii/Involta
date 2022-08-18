const webSocketsServerPort = 8000;
const webSocketServer = require("websocket").server;
const http = require("http");
const { Client } = require("pg");
const clients = {};

var pgClient = new Client({
  host: "localhost",
  user: "postgres",
  database: "postgres",
  password: "123",
  port: 5432,
});
pgClient.connect();
createUsersTable();

const rowNumber = 5;
var stateChangesArray = Array.from({ length: rowNumber ** 2 }, (_, i) => "");

const server = http.createServer();
const wsServer = new webSocketServer({
  httpServer: server,
});

server.listen(webSocketsServerPort);
console.log("Server started on port 8000");

function createUsersTable() {
  pgClient.query(
    `CREATE TABLE IF NOT EXISTS users (
    "login" VARCHAR(15) NOT NULL,
    "password" VARCHAR(15) NOT NULL,
    PRIMARY KEY ("login"));`,
    (err, res) => {
      if (err) {
        console.log("ERROR CREATING TABLE", err);
      } else {
        console.log(res);
        return res;
      }
    }
  );
}

function registerUser(login, password, userId) {
  pgClient.query(
    `select exists(SELECT 1 FROM users WHERE login = '${login}');`,
    (err, res) => {
      if (err) {
        console.log("ERROR LOGIN NOT UNIQUE", err);
      } else {
        if (res.rows[0].exists) {
          clients[userId].sendUTF(
            JSON.stringify({
              event: "registered",
              registered: false,
              login: login,
              password: password,
              error: "Логин уже занят!",
            })
          );
        } else {
          pgClient.query(
            `INSERT INTO users ("login", "password")
             VALUES ('${login}', '${password}');`,
            (err, res) => {
              if (err) {
                console.log("ERROR REGISTRATION", err);
              } else {
                console.log("REGISTRATION", res);

                clients[userId].sendUTF(
                  JSON.stringify({
                    event: "registered",
                    registered: true,
                    login: login,
                    password: password,
                    error: null,
                  })
                );
                sendState(userId);
              }
            }
          );
        }
      }
    }
  );
}

function writeState(message) {
  var parsedMessage = JSON.parse(message);
  var index = parsedMessage.indexField;
  stateChangesArray[index] = message;
}

function sendState(key) {
  for (var i = 0; i < stateChangesArray.length; i++) {
    if (stateChangesArray[i] !== "") {
      clients[key].sendUTF(stateChangesArray[i]);
    }
  }
}

function logUserIfExists(login, password, userId) {
  pgClient.query(
    `select exists(SELECT 1 FROM users WHERE login = '${login}' AND password = '${password}');`,
    (err, res) => {
      if (err) {
        console.log("ERROR LOGIN", err);
      } else {
        var error = !res.rows[0].exists
          ? "Неверно введен логин или пароль!"
          : null;
        clients[userId].sendUTF(
          JSON.stringify({
            event: "registered",
            registered: res.rows[0].exists,
            login: login,
            password: password,
            error: error,
          })
        );
        if (res.rows[0].exists) {
          sendState(userId);
        }
      }
    }
  );
}

const getID = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return s4() + s4() + "-" + s4();
};

wsServer.on("request", function (request) {
  var userID = getID();

  const connection = request.accept(null, request.origin);
  clients[userID] = connection;
  console.log("Connected user", userID);

  clients[userID].sendUTF(
    JSON.stringify({
      event: "connection",
      id: userID,
    })
  );

  connection.on("message", function (message) {
    var parsedMessage = JSON.parse(message.utf8Data);
    var user = parsedMessage.user;

    switch (parsedMessage.event) {
      case "register":
        var login = parsedMessage.login;
        var password = parsedMessage.password;
        registerUser(login, password, user);
        break;

      case "login":
        var login = parsedMessage.login;
        var password = parsedMessage.password;
        logUserIfExists(login, password, user);
        break;

      default:
        writeState(message.utf8Data);
        for (key in clients) {
          if (key !== user) {
            clients[key].sendUTF(message.utf8Data);
          }
        }
        break;
    }
  });
});
