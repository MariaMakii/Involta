import "./App.css";
import { Component } from "react";

export default class Input extends Component {
  render() {
    return (
      <div>
        <input
          id={this.props.indexField}
          type="text"
          className="basicInput input"
          onChange={(e) => {
            this.props.onChangeField("onChangeField", this.props.indexField, e.target.value);
          }}
          onBlur={(e) => {
            this.props.onLeaveField("onLeaveField", this.props.indexField, e.target.value);
          }}
        ></input>
      </div>
    );
  }
}
