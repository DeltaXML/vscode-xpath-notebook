import type { ActivationFunction } from 'vscode-notebook-renderer';
// see: https://stackoverflow.com/questions/62325942/why-im-getting-exports-is-not-defined-on-my-renderer-process
export const activate: ActivationFunction = () => ({
  renderOutputItem(data, element) {
    element.innerText = JSON.stringify(data.json());
  }
});