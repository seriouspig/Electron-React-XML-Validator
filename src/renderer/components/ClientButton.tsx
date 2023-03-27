import React, { useState } from 'react';
import './ClientButton.css';

const ClientButton = (props) => {
  const [isActive, setIsActive] = useState(false);

  const toggleClass = () => {
    setIsActive(!isActive);
  };

  return (
    <div
      className={
        props.active === props.id ? 'btn btn-client active' : 'btn btn-client'
      }
      onClick={() => props.selectClient(props.id)}
    >
      <div>{props.name}</div>
      <div>{props.alnaVersion}</div>
    </div>
  );
};

export default ClientButton;
