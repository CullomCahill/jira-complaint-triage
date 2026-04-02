import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import SettingsPanel from './components/SettingsPanel.js';

// Hardcoded product context — replaced by Forge Storage in Task 13
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

function TriagePanel({ onSettings }) {
  const [issueData, setIssueData] = useState(null);
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    invoke('getIssueData').then(setIssueData).catch(() => setIssueData({ error: 'Failed to load issue data' }));
  }, []);

  const handleRunTriage = async () => {
    if (!issueData || issueData.error) return;
    setRunning(true);
    setReport(null);
    try {
      const result = await invoke('runTriage', {
        bug: issueData,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0 }}>Complaint Triage</h4>
        <button onClick={onSettings} style={{ fontSize: '12px' }}>Settings</button>
      </div>

      <h4 style={{ marginBottom: '8px', fontSize: '13px' }}>Current Issue</h4>
      {!issueData && <p style={{ fontSize: '12px', color: '#888' }}>Loading issue data...</p>}
      {issueData && (
        <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '8px', marginBottom: '12px' }}>
          {JSON.stringify(issueData, null, 2)}
        </pre>
      )}

      <button onClick={handleRunTriage} disabled={running || !issueData || !!issueData?.error}>
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

function App() {
  const [view, setView] = useState('triage');

  if (view === 'settings') return <SettingsPanel onBack={() => setView('triage')} />;
  return <TriagePanel onSettings={() => setView('settings')} />;
}

export default App;