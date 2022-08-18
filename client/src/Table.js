import Input from "./Input";
import "./App.css";
import { Component } from "react";
var startIndex = 0;
export default class Table extends Component {
  render() {
    return (
      <table>
        <tbody>
          {Array.from({ length: this.props.rowNumber }).map(() => (
            <tr key={startIndex}>
              {Array.from({ length: this.props.columnNumber }).map(
                () => (
                  <td key={startIndex++}>
                    <Input
                      indexField={startIndex}
                      readOnlyField={this.props.readOnlyField}
                      onChangeField={this.props.onChangeField}
                      onLeaveField={this.props.onLeaveField}
                    />
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
