import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';
import ClientButton from './components/ClientButton';

function Hello() {
  const [contentPath, setContentPath] = useState(
    'Please select a folder with Content/Ibox ...'
  );
  const [vopPath, setVopPath] = useState(
    'Please select a path with the VOP ...'
  );
  const [xmlData, setXmlData] = useState(null);
  const [alnaVersion, setAlnaVersion] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [validationActive, setValidationActive] = useState(false)
  const [errorMessage, setErrorMessage] = useState("No Error Mesage")

  // THIS IS WHERE I AM DEFINING WHAT HAPPENS ON RETURN
  window.electron.ipcRenderer.once('get-clients', (arg) => {
    // eslint-disable-next-line no-console
    console.log('Got the clients');
    console.log(arg);
    setClients(arg);
    console.log('Set Clients to arg');
    console.log(clients);
  });

  useEffect(() => {
    console.log('Running use Effect');
    window.electron.ipcRenderer.sendMessage('get-clients');
    console.log(clients);
  }, []);

  // THIS IS WHERE I AM DEFINING WHAT HAPPENS ON RETURN
  window.electron.ipcRenderer.once('open-dialog-content', (arg) => {
    // console.log(arg);
    setContentPath(arg);
  });

  window.electron.ipcRenderer.once('open-dialog-vop', (arg) => {
    // console.log(arg);
    setVopPath(arg);
  });

  window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

  const handleSelectContentFolder = () => {
    // THIS IS WHERE I AM CALLING AN ACTION WHICH IS DEFINED IN MAIN.TS
    window.electron.ipcRenderer.sendMessage('open-dialog-content');
  };

  const handleSelectVopFolder = () => {
    // THIS IS WHERE I AM CALLING AN ACTION WHICH IS DEFINED IN MAIN.TS
    window.electron.ipcRenderer.sendMessage('open-dialog-vop');
  };

  const selectClient = (id) => {
    console.log('Client selected: ' + id);
    console.log(clients);
    for (const client of clients) {
      if (client.id === id) {
        setSelectedClient(client);
      }
    }
  };


// HELPER TO CHECK IF OBJECT IS EMPTY
const isObjEmpty = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object
}

const handleValidate = () => {
      window.electron.ipcRenderer.sendMessage('error-message', errorMessage);

  if (isObjEmpty(selectedClient)) {
    console.log("No client selected")
    setErrorMessage("No Client Selected")
  } else if (contentPath === 'Please select a folder with Content/Ibox ...') { 
    console.log("No Content/Inbox path selected")
    setErrorMessage("No Content/Inpox folder path selected")
   }
 else if (vopPath === 'Please select a path with the VOP ...') {
  console.log("No VOP path selected")
  setErrorMessage("No VOP folder path selected")
} else {
  console.log('Validating input');
  setErrorMessage("Validating Input")
}
}

  return (
    <div>
      <div className="clients">
        <div>Choose Client:</div>
        {clients.map((client) => {
          return (
            <ClientButton
              key={client.id}
              id={client.id}
              name={client.name}
              alnaVersion={client.alnaVersion}
              selectClient={selectClient}
              active={selectedClient.id}
            />
          );
        })}
      </div>
      <div className="path-selector">
        <div className="btn-path-selector" onClick={handleSelectContentFolder}>
          <p>Select Content/Inbox Path:</p>
        </div>
        <div className="btn-path">{contentPath}</div>
      </div>
      <div className="path-selector">
        <div className="btn-path-selector" onClick={handleSelectVopFolder}>
          Select VOP Path:
        </div>
        <div className="btn-path">{vopPath}</div>
      </div>
      <div className="btn-validate" onClick={handleValidate}>Validate</div>
      <div className="validation-form">
        {errorMessage}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
