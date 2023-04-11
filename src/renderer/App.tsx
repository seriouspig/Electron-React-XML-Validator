import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';
import ClientButton from './components/ClientButton';
import { getRandomValues } from 'crypto';
import { validateHeaderValue } from 'http';

function Hello() {
  const [contentPath, setContentPath] = useState(
    'Please select a folder with Content/Ibox ...'
  );
  const [vopPath, setVopPath] = useState(
    'Please select a path with the VOP ...'
  );
  const [xmlData, setXmlData] = useState([]);
  const [alnaVersion, setAlnaVersion] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [validationActive, setValidationActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isVopValid, setIsVopValid] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [dopName, setDopName] = useState('');
  const [mergeStatus, setMergeStatus] = useState('Not merging');
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
    setErrorMessage(null);
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
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  };

  const handleValidate = () => {
    window.electron.ipcRenderer.sendMessage('error-message', errorMessage);

    if (isObjEmpty(selectedClient)) {
      console.log('No client selected');
      setErrorMessage('No Client Selected');
    } else if (contentPath === 'Please select a folder with Content/Ibox ...') {
      console.log('No Content/Inbox path selected');
      setErrorMessage('No Content/Inpox folder path selected');
    } else if (vopPath === 'Please select a path with the VOP ...') {
      console.log('No VOP path selected');
      setErrorMessage('No VOP folder path selected');
    } else if (vopPath === 'Not a valid VOP, no xml file detected ...') {
      console.log('Not a valid VOP, no xml file detected ...');
      setErrorMessage('Not a valid VOP, no xml file detected ...');
    } else {
      console.log('Validating input');
      setErrorMessage('Validating Input');
      window.electron.ipcRenderer.sendMessage('validate-xml', [
        vopPath,
        contentPath,
      ]);
      window.electron.ipcRenderer.sendMessage('get-package-name', vopPath);
    }
  };

  // THIS IS WHERE I AM DEFINING WHAT HAPPENS ON RETURN
  window.electron.ipcRenderer.once('validate-xml', (arg) => {
    // eslint-disable-next-line no-console
    console.log('Got the XML object');
    // console.log(arg);
    // setClients(arg);
    console.log('Set XML object to arg');
    setXmlData(arg);
    console.log(xmlData);
    // console.log(clients);
  });

  // THIS IS WHERE I AM DEFINING WHAT HAPPENS ON RETURN
  window.electron.ipcRenderer.once('get-package-name', (arg) => {
    console.log('Got the Package name');
    console.log(arg);
    setPackageName(arg.packageName);
    setDopName(arg.dopName);
  });

  const checkPass = (value) => {
    const result = [value.ymlContent, value.version, value.ymlVersion].every(
      (val) => {
        return val === '-' || val === value.xmlVersion;
      }
    );
    return result;
  };

  const checkMergeReady = () => {
    let result = false;

    if (xmlData.length > 0) {
      for (const value in xmlData) {
        if (xmlData.every((value) => checkPass(value))) {
          result = true;
        }
      }
    } else {
      result = false;
    }

    return result;
  };

  // Merge

  const handleMerge = () => {
    console.log('Merging content/inbox to vop');
    window.electron.ipcRenderer.sendMessage('merge', [vopPath, contentPath]);
  };

  window.electron.ipcRenderer.once('merge', (arg) => {
    // console.log(arg);
    setMergeStatus(arg);
  });

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
      <div className="btn-validate" onClick={handleValidate}>
        Validate
      </div>
      <div className="validation-form">
        {errorMessage === 'Validating Input' ? (
          <div className="validation-table">
            <div className="client-info">
              <div>Client: {selectedClient.name}</div>
              <div>Alna Version: {selectedClient.alnaVersion} </div>
            </div>
            <div className="package-info">
              <div>Package Name: {packageName}</div>
              <div>File: {dopName} </div>
            </div>
            <div className="table-columns header">
              <div>Volume</div>
              <div>Metadata YML</div>
              <div>Version</div>
              <div>VOP YML</div>
              <div>VOP XML</div>
              <div>Pass</div>
              <div>Size</div>
              <div>Install Time</div>
            </div>
            {xmlData.map((value) => {
              return (
                <div
                  className={
                    'table-columns ' + (checkPass(value) ? 'pass' : 'fail')
                  }
                >
                  <div>{value.packageName}</div>
                  <div>{value.ymlContent}</div>
                  <div>{value.version}</div>
                  <div>{value.ymlVersion}</div>
                  <div>{value.xmlVersion}</div>
                  <div>{checkPass(value) ? 'Pass' : 'Fail'}</div>
                  <div>{value.size} Mb</div>
                  <div> {value.installTime / 60} mins </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>{errorMessage}</div>
        )}
        <div>{mergeStatus}</div>
      </div>
      {checkMergeReady() && errorMessage === 'Validating Input' && (
        <div className="btn-merge" onClick={handleMerge}>
          Merge
        </div>
      )}
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
