import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

function App() {
  const [keyExists, setKeyExists] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    invoke('getApiKeyStatus').then(({ exists }) => setKeyExists(exists));
  }, []);

  const handleSaveTestKey = async () => {
    setStatus('Saving...');
    await invoke('saveApiKey', { apiKey: 'test-key-12345' });
    const { exists } = await invoke('getApiKeyStatus');
    setKeyExists(exists);
    setStatus('Done.');
  };

  return (
    <div style={{ padding: '16px' }}>
      <h4>Task 1: Storage Test</h4>
      <p>API key saved: {keyExists === null ? 'checking...' : keyExists ? 'YES' : 'NO'}</p>
      <button onClick={handleSaveTestKey}>Save test key</button>
      {status && <p>{status}</p>}
    </div>
  );
}

export default App;
