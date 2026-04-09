import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import SettingsPanel from './components/SettingsPanel.js';
import TriageReport from './components/TriageReport.js';

function TriagePanel({ onSettings }) {
  const [issueData, setIssueData] = useState(null);
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [productContext, setProductContext] = useState({ userNeeds: [], productRequirements: [] });

  useEffect(() => {
    invoke('getIssueData').then(setIssueData).catch(() => setIssueData({ error: 'Failed to load issue data' }));
    invoke('getProductContext').then(setProductContext);
  }, []);

  const handleRunTriage = async () => {
    setRunning(true);
    setReport(null);
    try {
      const freshIssueData = await invoke('getIssueData');
      setIssueData(freshIssueData);
      if (freshIssueData.error) throw new Error(freshIssueData.error);
      const result = await invoke('runTriage', { bug: freshIssueData });
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
        <h4 style={{ margin: 0 }}>Risk Assessment</h4>
        <button onClick={onSettings} style={{
          fontSize: '12px',
          padding: '4px 10px',
          background: 'none',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          color: '#42526e',
          cursor: 'pointer',
        }}>Settings</button>
      </div>

      {!issueData && <p style={{ fontSize: '12px', color: '#888' }}>Loading issue data...</p>}

      {issueData && !issueData.error && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6b778c', margin: '0 0 2px' }}>{issueData.id}</p>
          <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px', color: '#172b4d' }}>{issueData.title}</p>
          {issueData.description && (
            <p style={{ fontSize: '12px', color: '#42526e', margin: 0, lineHeight: '1.5' }}>{issueData.description}</p>
          )}
        </div>
      )}

      {issueData?.error && (
        <p style={{ fontSize: '12px', color: '#bf2600' }}>{issueData.error}</p>
      )}

      <button
        onClick={handleRunTriage}
        disabled={running}
        style={{
          padding: '6px 14px',
          fontSize: '14px',
          fontWeight: 500,
          background: running ? '#e3e8f0' : '#0052cc',
          color: running ? '#a5adba' : '#fff',
          border: 'none',
          borderRadius: '3px',
          cursor: running ? 'not-allowed' : 'pointer',
        }}
      >
        {running ? 'Running risk assessment...' : 'Run Risk Assessment'}
      </button>

      {running && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b778c', fontStyle: 'italic' }}>
          Running risk assessment pipeline — steps 2 and 3 run in parallel. Usually takes 10–20 seconds...
        </div>
      )}

      {report && <TriageReport report={report} userNeeds={productContext.userNeeds} productRequirements={productContext.productRequirements} />}
    </div>
  );
}

function App() {
  const [view, setView] = useState('triage');

  if (view === 'settings') return <SettingsPanel onBack={() => setView('triage')} />;
  return <TriagePanel onSettings={() => setView('settings')} />;
}

export default App;