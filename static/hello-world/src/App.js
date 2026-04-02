import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import SettingsPanel from './components/SettingsPanel.js';


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
      const result = await invoke('runTriage', { bug: issueData });
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