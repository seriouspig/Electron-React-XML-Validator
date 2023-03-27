import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';
import ClientButton from './components/ClientButton';

function Hello() {
  const [contentPath, setContentPath] = useState("Please select a folder with Content/Ibox ...")
  const [inboxPath, setInboxPath] = useState("Please select a path with the VOP ...")
  const [xmlData, setXmlData] = useState(null);
  const [alnaVersion, setAlnaVersion] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});

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
    setContentPath('HEEEELLLOOO');
    // getClients();
    window.electron.ipcRenderer.sendMessage('get-clients');
    console.log(clients);
  }, []);


  // THIS IS WHERE I AM DEFINING WHAT HAPPENS ON RETURN
  window.electron.ipcRenderer.once('open-dialog', (arg) => {
    // eslint-disable-next-line no-console
    console.log('Window opened');
    console.log(arg);
    setContentPath(arg);
    
    console.log('Window again');
  });

  window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

  const handleSelectContentFolder = () => {
    // THIS IS WHERE I AM CALLING AN ACTION WHICH IS DEFINED IN MAIN.TS
    window.electron.ipcRenderer.sendMessage('open-dialog');
  };

    const handleSelectVopFolder = () => {
      // THIS IS WHERE I AM CALLING AN ACTION WHICH IS DEFINED IN MAIN.TS
      window.electron.ipcRenderer.sendMessage('open-dialog');
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
        <div className="btn-path">{inboxPath}</div>
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
