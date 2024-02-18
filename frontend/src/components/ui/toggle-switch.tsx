import React, { useState } from 'react';

interface ToggleSwitchProps {
  isToggled: boolean;
  setIsToggled: React.Dispatch<React.SetStateAction<boolean>>;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isToggled, setIsToggled, label }) => {
  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  return (
    <>
      <style jsx>{`
        .toggle__dot {
          transition: all 0.3s ease-in-out;
        }
        .toggle__line {
          transition: background 0.3s ease-in-out;
        }
        input:checked ~ .toggle__dot {
          left: calc(100% - 1.5rem);
        }
      `}</style>
      <div className="flex items-center">
        <label htmlFor="toggle" className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              id="toggle"
              className="hidden"
              checked={isToggled}
              onChange={handleToggle}
            />
            <div className={`toggle__line w-10 h-6 ${isToggled ? 'bg-aquamarine' : 'bg-gray-400'} rounded-full shadow-inner`}></div>
            <div className={`toggle__dot absolute w-6 h-6 bg-white rounded-full shadow inset-y-0 left-0 ${isToggled ? 'left-full' : 'left-0'}`}></div>
          </div>
          {label && <span className={`ml-3 text-gray-${isToggled ? 400 : 700}`}>{label}</span>}
        </label>
      </div>
    </>
  );
};

export default ToggleSwitch;
