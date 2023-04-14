import React, { useEffect, useRef, useState } from 'react';
import './DropDown.css';

const DropDown = ({ menu }) => {
  const [open, setOpen] = useState(false);
  const clientsContainerRef = useRef(null);

  const handleOpen = () => {
      console.log("Trying to open")
      console.log(menu)
    setOpen(!open);
  };

  useEffect(() => {
    if (open) {
      clientsContainerRef.current.style.height = `120px`;
    } else {
      clientsContainerRef.current.style.height = '0px';
    }
  }, [open]);

  return (
    <div>
      <div className="path-selector">
        <div className="btn btn-path-selector" onClick={handleOpen}>
          select client
        </div>

        {/* {!open && <div className="message-box">Chosen Client</div>} */}
      </div>
        <div
          className="clients-container show-container"
          ref={clientsContainerRef}
        >
          <ul className="clients" >
            {menu.map((client) => {
              return <li onClick={handleOpen}>{client.name}</li>;
            })}
          </ul>
        </div>
      </div>
  );
};

export default DropDown;
