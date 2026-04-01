import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

const SAMPLE_BUG = {
  id: 'BUG-201',
  title: 'Chatbot recommends breathing exercise during active panic disclosure',
  description: 'A user described an active panic attack in detail and the chatbot responded by suggesting a 4-7-8 breathing exercise. The clinical team flagged this because the breathing exercise module is designed for general relaxation, not acute panic intervention. The appropriate response should have been to acknowledge distress and offer grounding techniques or crisis resources.',
  component: 'AI/ML Algorithms',
  reported_by: 'Clinical Team',
  date_reported: '2025-02-08',
  in_released_product: true,
  related_feature: 'CBT thought challenging module',
};

const SAMPLE_PRODUCT_CONTEXT = {
  user_needs: [
    { id: 'UN-002', description: 'User shall receive evidence-based CBT therapeutic exercises including thought challenging, cognitive distortion identification, and alternative thought generation.' },
    { id: 'UN-005', description: 'User shall be connected to crisis resources immediately when expressing distress or suicidal ideation.' },
    { id: 'UN-009', description: 'User shall be able to interact with the chatbot using natural language and receive contextually appropriate therapeutic responses.' },
  ],
  product_requirements: [
    { id: 'PR-003', description: 'The CBT thought challenging module shall guide the user through all required steps in sequence.', traces_to: 'UN-002' },
    { id: 'PR-005', description: 'The crisis detection algorithm shall identify crisis-related language and initiate the crisis escalation protocol within 2 seconds of detection.', traces_to: 'UN-005' },
    { id: 'PR-012', description: 'The sentiment analysis model shall accurately classify user emotional state, accounting for common linguistic patterns including sarcasm, minimization, and indirect expression of distress.', traces_to: 'UN-009' },
  ],
};

const SAMPLE_DEFECT_CRITERIA = {
  must_meet_both: [
    'It is included in the released product (not deprecated or unreleased features)',
    'It is a deviation from the intended function of the core product (fails a User Need or Product Requirement)',
  ],
};

function App() {
  const [keyExists, setKeyExists] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState('');
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);

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

  const handleRunTriage = async () => {
    setRunning(true);
    setReport(null);
    try {
      const result = await invoke('runTriage', {
        bug: SAMPLE_BUG,
        productContext: SAMPLE_PRODUCT_CONTEXT,
        defectCriteria: SAMPLE_DEFECT_CRITERIA,
      });
      setReport(result);
    } catch (e) {
      setReport({ error: e.message });
    } finally {
      setRunning(false);
    }
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

      <h4 style={{ marginBottom: '4px' }}>Run Triage</h4>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Sample bug: {SAMPLE_BUG.id} — {SAMPLE_BUG.title}</p>
      <button onClick={handleRunTriage} disabled={running}>
        {running ? 'Running...' : 'Run Triage'}
      </button>

      {report && (
        <pre style={{ marginTop: '12px', fontSize: '11px', whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '8px' }}>
          {JSON.stringify(report, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;