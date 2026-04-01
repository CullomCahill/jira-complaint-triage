import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

function App() {
  const [keyExists, setKeyExists] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState('');
  const [testResult, setTestResult] = useState('');
  const [classifyResult, setClassifyResult] = useState(null);

  useEffect(() => {
    invoke('getApiKeyStatus').then(({ exists }) => setKeyExists(exists));
  }, []);

  const handleDelete = async () => {
    setStatus('Removing...');
    await invoke('deleteApiKey');
    setKeyExists(false);
    setStatus('API key removed.');
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setStatus('Please enter an API key.');
      return;
    }
    setStatus('Saving...');
    await invoke('saveApiKey', { apiKey: inputValue.trim() });
    setInputValue('');
    setKeyExists(true);
    setStatus('API key saved.');
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <h4 style={{ marginBottom: '8px' }}>Anthropic API Key</h4>

      {keyExists === null && <p>Checking...</p>}

      {keyExists === true && (
        <p style={{ color: 'green' }}>
          &#10003; API key is saved.{' '}
          <button onClick={handleDelete} style={{ marginLeft: '8px', color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Remove
          </button>
        </p>
      )}

      {keyExists === false && (
        <p style={{ color: '#888' }}>No API key saved yet.</p>
      )}

      <input
        type="password"
        placeholder="sk-ant-..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ width: '100%', padding: '6px', marginBottom: '8px', boxSizing: 'border-box' }}
      />
      <button onClick={handleSave}>Save API Key</button>

      {status && <p style={{ marginTop: '8px', fontSize: '13px' }}>{status}</p>}

      <hr style={{ margin: '16px 0' }} />
      <h4 style={{ marginBottom: '8px' }}>Task 3: API Test</h4>
      <button onClick={async () => {
        setTestResult('Calling Anthropic...');
        try {
          const { response } = await invoke('testAnthropicCall');
          setTestResult(response);
        } catch (e) {
          setTestResult(`Error: ${e.message}`);
        }
      }}>Test Anthropic Call</button>
      {testResult && <p style={{ marginTop: '8px', fontSize: '13px' }}>{testResult}</p>}

      <hr style={{ margin: '16px 0' }} />
      <h4 style={{ marginBottom: '8px' }}>Task 4: Defect Classification</h4>
      <button onClick={async () => {
        setClassifyResult({ status: 'Running classification...' });
        try {
          const result = await invoke('testDefectClassification');
          setClassifyResult(result);
        } catch (e) {
          setClassifyResult({ error: e.message });
        }
      }}>Run Defect Classification (BUG-201)</button>
      {classifyResult && (
        <pre style={{ marginTop: '8px', fontSize: '11px', whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '8px' }}>
          {JSON.stringify(classifyResult, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;
