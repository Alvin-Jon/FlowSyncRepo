import { useState } from "react";
import Switch from "react-switch";

const  Toggle = ({state, disabled, callFunction, setParentState}) => {
  const [checked, setChecked] = useState(state || false);

  function handleToggle(checked) {
    setChecked(checked);
    if(setParentState) setParentState(checked);
    if(callFunction) callFunction(checked);
  }

  return (
    <div>
      <Switch
        checked={checked}
        onChange={handleToggle}
        onColor="#0077ff"
        offColor="#ccc"
        handleDiameter={22}
        uncheckedIcon={false}
        checkedIcon={false}
        height={28}
        width={50}
        disabled={disabled}
      />
    </div>
  );
}

export default Toggle;
