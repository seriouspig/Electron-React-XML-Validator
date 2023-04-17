import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useState } from 'react';
import DropDown from './components/DropDown';
import { ImCheckmark, ImCross } from 'react-icons/im';

function Hello() {
  const [contentPath, setContentPath] = useState(
    'Please select a folder with Content/Ibox ...'
  );
  const [vopPath, setVopPath] = useState(
    'Please select a path with the VOP ...'
  );
  const [dbPath, setDbPath] = useState(
    'Please select a path with the database ...'
  );
  const [xmlData, setXmlData] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [packageName, setPackageName] = useState('');
  const [dopName, setDopName] = useState('');
  const [mergeStatus, setMergeStatus] = useState('');
  const [dbStatus, setDbStatus] = useState('');
  const [dbAddStatus, setDbAddStatus] = useState('');

  window.electron.ipcRenderer.once('get-clients', (arg) => {
    setClients(arg);
  });

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('get-clients');
  }, []);

  window.electron.ipcRenderer.once('open-dialog-content', (arg) => {
    setContentPath(arg);
    reset()
  });

  window.electron.ipcRenderer.once('open-dialog-vop', (arg) => {
    setVopPath(arg);
    reset()
  });

  window.electron.ipcRenderer.once('open-dialog-database', (arg) => {
    setDbPath(arg);
  });

  window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

  const handleSelectContentFolder = () => {
    window.electron.ipcRenderer.sendMessage('open-dialog-content');
  };

  const handleSelectVopFolder = () => {
    window.electron.ipcRenderer.sendMessage('open-dialog-vop');
  };

  const handleSelectDatabase = () => {
    window.electron.ipcRenderer.sendMessage('open-dialog-database');
    setDbAddStatus('');
  };

  const selectClient = (id) => {
    reset();
    for (const client of clients) {
      if (client.id === id) {
        setSelectedClient(client);
      }
    }
  };

  const isObjEmpty = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  };

  const handleValidate = () => {
    setMergeStatus('');
    if (isObjEmpty(selectedClient)) {
      setErrorMessage('No Client Selected');
    } else if (contentPath === 'Please select a folder with Content/Ibox ...') {
      setErrorMessage('No Content/Inpox folder path selected');
    } else if (contentPath === 'Not a valid content / inbox ...') {
      setErrorMessage('Not a valid content / inbox ...');
    } else if (vopPath === 'Please select a path with the VOP ...') {
      setErrorMessage('No VOP folder path selected');
    } else if (vopPath === 'Not a valid VOP, no xml file detected ...') {
      setErrorMessage('Not a valid VOP, no xml file detected ...');
    } else {
      setErrorMessage('Validating Input');
      window.electron.ipcRenderer.sendMessage('validate-xml', [
        vopPath,
        contentPath,
      ]);
      window.electron.ipcRenderer.sendMessage('get-package-name', vopPath);
    }
  };

  window.electron.ipcRenderer.once('validate-xml', (arg) => {
    setXmlData(arg);
  });

  window.electron.ipcRenderer.once('get-package-name', (arg) => {
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
    setMergeStatus('Merging...');
    window.electron.ipcRenderer.sendMessage('merge', [vopPath, contentPath]);
  };

  window.electron.ipcRenderer.once('merge', (arg) => {
    setMergeStatus(arg);
    window.electron.ipcRenderer.sendMessage('check-database', vopPath);
  });

  window.electron.ipcRenderer.once('check-database', (arg) => {
    setDbStatus(arg);
  });

  const handleAddDatabase = () => {
    setDbAddStatus('Adding database to inbox volume...');
    window.electron.ipcRenderer.sendMessage('add-database', [dbPath, vopPath]);
  };

  window.electron.ipcRenderer.once('add-database', (arg) => {
    setDbAddStatus(arg);
  });

  const reset = () => {
    setErrorMessage(null);
    setMergeStatus('');
  };

  return (
    <div className="container">
      <DropDown
        menu={clients}
        selectClient={selectClient}
        selectedClient={selectedClient}
      />
      <div className="path-selector">
        <div
          className="btn btn-path-selector"
          onClick={handleSelectContentFolder}
        >
          Select Content/Inbox Path:
        </div>
        <div className="btn-path">{contentPath}</div>
      </div>
      <div className="path-selector">
        <div className="btn btn-path-selector" onClick={handleSelectVopFolder}>
          Select VOP Path:
        </div>
        <div className="btn-path">{vopPath}</div>
      </div>
      <div className="path-selector">
        <div className="btn btn-path-selector" onClick={handleValidate}>
          Validate
        </div>
        {errorMessage !== 'Validating Input' && (
          <div className="message-box">{errorMessage}</div>
        )}
      </div>

      <div className="validation-form">
        {errorMessage === 'Validating Input' && (
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
              <div className="cell first">Volume</div>
              <div className="cell">Metadata YML</div>
              <div className="cell">Version</div>
              <div className="cell">VOP YML</div>
              <div className="cell">VOP XML</div>
              <div className="cell">Pass</div>
              <div className="cell">Size</div>
              <div className="cell">Install Time</div>
            </div>
            {xmlData.map((value) => {
              return (
                <div
                  className={
                    'table-columns ' + (checkPass(value) ? 'pass' : 'fail')
                  }
                >
                  <div className="cell first">
                    {value.packageName.substring(
                      value.packageName.indexOf('_') + 1
                    )}
                  </div>
                  <div className="cell">{value.ymlContent}</div>
                  <div className="cell">{value.version}</div>
                  <div className="cell">{value.ymlVersion}</div>
                  <div className="cell">{value.xmlVersion}</div>
                  <div className="cell">
                    {checkPass(value) ? (
                      <ImCheckmark className="pass-icon" />
                    ) : (
                      <ImCross className="fail-icon" />
                    )}
                  </div>
                  <div className="cell">{value.size} Mb</div>
                  <div className="cell"> {value.installTime / 60} mins </div>
                </div>
              );
            })}
          </div>
        )}
        {checkMergeReady() && errorMessage === 'Validating Input' && (
          <div className="path-selector">
            <div className="btn btn-merge" onClick={handleMerge}>
              Merge
            </div>
            <div className="message-box merge-status">
              <div>{mergeStatus}</div>
              {mergeStatus === 'Merge Successfull !!!' && (
                <div>Database: {dbStatus}</div>
              )}
            </div>
          </div>
        )}

        {mergeStatus === 'Merge Successfull !!!' && (
          <div className="path-selector">
            <div
              className="btn btn-path-selector"
              onClick={handleSelectDatabase}
            >
              Select database to add:
            </div>
            <div className="btn-path">{dbPath}</div>
          </div>
        )}
        {dbPath.length > 0 &&
          dbPath[0].endsWith('.sql') &&
          errorMessage === 'Validating Input' && (
            <div className="path-selector">
              <div
                className="btn btn-path-selector"
                onClick={handleAddDatabase}
              >
                Add database
              </div>
              <div className="message-box">{dbAddStatus}</div>
            </div>
          )}
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
