import Table from "./Table";
import React, { Component } from "react";
import "./App.css";
import { w3cwebsocket as W3CWebsocket } from "websocket";

const client = new W3CWebsocket("ws://127.0.0.1:8000");
var userId = "";
var rowNumber = 5;
export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { registered: false };
  }

  setRegistered(value) {
    this.setState({
      registered: value,
    });
  }

  login(event) {
    var login = document.getElementById("loginInput").value;
    var password = document.getElementById("passwordInput").value;
    if (
      login !== "" ||
      login !== null ||
      password !== "" ||
      password !== null
    ) {
      client.send(
        JSON.stringify({
          event: event,
          login: login,
          password: password,
          user: userId,
        })
      );
    } else {
      alert("Пожалуйста, заполните поля логин и пароль!");
    }
  }

  componentDidMount() {
    client.onopen = () => {};

    client.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log(data);

      switch (data.event) {
        case "connection":
          userId = data.id;
          rowNumber = data.rowNumber;
          break;
        case "onChangeField":
          this.changeField(
            data.indexField,
            true,
            "readOnlyInput input",
            data.value
          );
          break;
        case "onLeaveField":
          this.changeField(
            data.indexField,
            false,
            "basicInput input",
            data.value
          );
          break;
        case "registered":
          if(data.error !== null){
            alert(`Ошибка! ${data.error}`);
          }
          this.setRegistered(data.registered);
          break;
        default:
          break;
      }
    };
  }

  changeField(indexField, readOnly, className, value) {
    document.getElementById(indexField).readOnly = readOnly;
    document.getElementById(indexField).className = className;
    document.getElementById(indexField).value = value;
  }

  onChangeFieldState(event, indexField, value) {
    client.send(
      JSON.stringify({
        event: event,
        indexField: indexField,
        value: value,
        user: userId,
      })
    );
  }

  render() {
    return (
      <div className="app">
        {this.state.registered ? (
          <Table
            rowNumber={5}
            columnNumber={5}
            onChangeField={this.onChangeFieldState}
            onLeaveField={this.onChangeFieldState}
          />
        ) : (
          <div>
            <p>login:</p>
            <input id="loginInput" type="text"></input>

            <p>password:</p>
            <input id="passwordInput" type="password"></input>
            <br />
            <br />
            <button
              onClick={() => {
                this.login("register");
              }}
            >
              register
            </button>
            <button
            onClick={() => {
              this.login("login");
            }}
            >login</button>
          </div>
        )}
      </div>
    );
  }
}
