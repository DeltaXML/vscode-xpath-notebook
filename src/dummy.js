
		class GlobalVariables {
			variables = {};
			setVariable = (name, value) => {
				this.variables[name] = value;
			}
			getVariables = () => {
				return this.variables;
			}
			getVariable = (name) => {
				return this.variables[name];
			}
		}

const variables = {};
const setVariable = (name, value) => {
  variables[name] = value;
}
const getVariables = () => {
  return variables;
}
const getVariable = (name) => {
  return variables[name];
}
let prevResult = [];