import React, { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@forge/bridge';

const PRIVACY_POLICY_URL = 'https://cahillconsultinggroup.com/privacy.html';

const textareaStyle = {
  width: '100%',
  padding: '6px',
  fontSize: '11px',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
  minHeight: '120px',
  marginBottom: '6px',
};

function ConfigSection({ label, hint, storageKey, saveResolver, onDirtyChange, registerSave }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const handleSaveRef = useRef(null);

  useEffect(() => {
    invoke('getProductContext').then((ctx) => {
      const val = ctx[storageKey];
      if (val && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0)) {
        setText(JSON.stringify(val, null, 2));
        setSaved(true);
      }
    });
  }, [storageKey]);

  useEffect(() => {
    if (registerSave) registerSave(storageKey, () => handleSaveRef.current?.());
  }, [storageKey, registerSave]);

  const handleChange = (e) => {
    setText(e.target.value);
    setSaved(false);
    setDirty(true);
    onDirtyChange(storageKey, true);
  };

  const handleSave = async () => {
    setError('');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError('Invalid JSON — check your formatting.');
      return;
    }
    await invoke(saveResolver, { [storageKey]: parsed });
    setSaved(true);
    setDirty(false);
    onDirtyChange(storageKey, false);
  };

  handleSaveRef.current = handleSave;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <strong style={{ fontSize: '13px' }}>{label}</strong>
        {saved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
        {dirty && !saved && <span style={{ marginLeft: '8px', color: '#ff991f', fontSize: '12px' }}>&#9679; unsaved</span>}
      </div>
      <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px' }}>{hint}</p>
      <textarea
        style={textareaStyle}
        value={text}
        onChange={handleChange}
        spellCheck={false}
      />
      {error && <p style={{ color: 'red', fontSize: '12px', margin: '0 0 4px' }}>{error}</p>}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}


const DEFAULT_PROBABILITY_SCALE = [
  { label: 'Remote',    description: 'unlikely to occur' },
  { label: 'Low',       description: 'could occur but rare' },
  { label: 'Moderate',  description: 'may occur occasionally' },
  { label: 'High',      description: 'likely to occur' },
  { label: 'Very High', description: 'almost certain to occur' },
];

const DEFAULT_SEVERITY_SCALE = [
  { label: 'Negligible', description: 'no impact on therapeutic experience' },
  { label: 'Minor',      description: 'slight inconvenience, user can continue' },
  { label: 'Moderate',   description: 'disrupts session but user can recover' },
  { label: 'Major',      description: 'prevents therapeutic function or causes distress' },
  { label: 'Critical',   description: 'potential for clinical harm or safety event' },
];

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
const RISK_LEVEL_COLORS = {
  LOW:    { bg: '#e3fcef', border: '#00875a', text: '#006644' },
  MEDIUM: { bg: '#fffae6', border: '#ff991f', text: '#974f0c' },
  HIGH:   { bg: '#ffebe6', border: '#de350b', text: '#bf2600' },
};
const DEFAULT_RISK_MATRIX = {
  1: { 1: 'LOW',    2: 'LOW',    3: 'LOW',    4: 'LOW',    5: 'LOW'    },
  2: { 1: 'LOW',    2: 'LOW',    3: 'MEDIUM', 4: 'MEDIUM', 5: 'HIGH'   },
  3: { 1: 'LOW',    2: 'MEDIUM', 3: 'MEDIUM', 4: 'HIGH',   5: 'HIGH'   },
  4: { 1: 'MEDIUM', 2: 'HIGH',   3: 'HIGH',   4: 'HIGH',   5: 'HIGH'   },
  5: { 1: 'HIGH',   2: 'HIGH',   3: 'HIGH',   4: 'HIGH',   5: 'HIGH'   },
};

function RiskMatrixEditor({ matrix, probabilityScale, severityScale, onMatrixChange, onDirtyChange, onSave, saved, dirty }) {
  const cycleLevel = (sev, prob) => {
    const current = matrix?.[sev]?.[prob] ?? matrix?.[String(sev)]?.[String(prob)] ?? DEFAULT_RISK_MATRIX[sev][prob];
    const idx = RISK_LEVELS.indexOf(current);
    const next = RISK_LEVELS[(idx + 1) % RISK_LEVELS.length];
    onMatrixChange({ ...matrix, [sev]: { ...(matrix?.[sev] ?? {}), [prob]: next } });
    onDirtyChange('riskMatrix', true);
  };

  const handleReset = () => {
    onMatrixChange(DEFAULT_RISK_MATRIX);
    onDirtyChange('riskMatrix', true);
  };

  const getCell = (sev, prob) =>
    matrix?.[sev]?.[prob] ?? matrix?.[String(sev)]?.[String(prob)] ?? DEFAULT_RISK_MATRIX[sev][prob];

  const CELL = 52;
  const probCols = [1, 2, 3, 4, 5];
  const sevRows  = [5, 4, 3, 2, 1];

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <strong style={{ fontSize: '13px' }}>Risk Matrix</strong>
        {saved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
        {dirty && !saved && <span style={{ marginLeft: '8px', color: '#ff991f', fontSize: '12px' }}>&#9679; unsaved</span>}
      </div>
      <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px' }}>
        Click any cell to cycle its risk level. Rows = Severity (5 top, 1 bottom). Columns = Probability (1 left, 5 right).
      </p>

      {/* Probability column headers */}
      <div style={{ display: 'flex', marginLeft: `${CELL + 4}px`, marginBottom: '2px' }}>
        {probCols.map(p => (
          <div key={p} style={{ width: `${CELL}px`, textAlign: 'center', fontSize: '10px', color: '#6b778c', fontWeight: 700, lineHeight: '1.2' }}>
            P{p}
            {probabilityScale?.[p - 1]?.label && (
              <div style={{ fontWeight: 400, fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {probabilityScale[p - 1].label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {sevRows.map(sev => (
        <div key={sev} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          {/* Severity row label */}
          <div style={{ width: `${CELL}px`, flexShrink: 0, textAlign: 'right', paddingRight: '4px', fontSize: '10px', color: '#6b778c', fontWeight: 700, lineHeight: '1.2' }}>
            S{sev}
            {severityScale?.[sev - 1]?.label && (
              <div style={{ fontWeight: 400, fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: `${CELL - 4}px` }}>
                {severityScale[sev - 1].label}
              </div>
            )}
          </div>
          {/* Cells */}
          {probCols.map(prob => {
            const level = getCell(sev, prob);
            const c = RISK_LEVEL_COLORS[level] ?? RISK_LEVEL_COLORS.LOW;
            return (
              <button
                key={prob}
                onClick={() => cycleLevel(sev, prob)}
                title={`S${sev} × P${prob}: ${level}`}
                style={{
                  width: `${CELL}px`, height: `${CELL}px`, marginRight: '2px',
                  background: c.bg, border: `2px solid ${c.border}`, color: c.text,
                  fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                  borderRadius: '2px', padding: '2px', textAlign: 'center',
                  lineHeight: '1.3', userSelect: 'none',
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={onSave}>Save Risk Matrix</button>
        <button
          onClick={handleReset}
          style={{ color: '#6b778c', background: 'none', border: '1px solid #dfe1e6', borderRadius: '3px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
        >
          Reset to ISO Default
        </button>
      </div>
    </div>
  );
}

function ScaleEditor({ label, hint, scaleKey, saveResolver, initialScale, onDirtyChange, registerSave }) {
  const [scale, setScale] = useState(initialScale);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const handleSaveRef = useRef(null);

  useEffect(() => { setScale(initialScale); }, [initialScale]);

  useEffect(() => {
    if (registerSave) registerSave(scaleKey, () => handleSaveRef.current?.());
  }, [scaleKey, registerSave]);

  const handleChange = (index, field, value) => {
    setScale(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    setSaved(false);
    setDirty(true);
    onDirtyChange(scaleKey, true);
  };

  const handleSave = async () => {
    await invoke(saveResolver, { scale });
    setSaved(true);
    setDirty(false);
    onDirtyChange(scaleKey, false);
  };

  handleSaveRef.current = handleSave;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <strong style={{ fontSize: '13px' }}>{label}</strong>
        {saved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
        {dirty && !saved && <span style={{ marginLeft: '8px', color: '#ff991f', fontSize: '12px' }}>&#9679; unsaved</span>}
      </div>
      <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px' }}>{hint}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ width: '24px', textAlign: 'left', fontSize: '10px', color: '#6b778c', fontWeight: 700, paddingBottom: '4px' }}>#</th>
            <th style={{ width: '90px', textAlign: 'left', fontSize: '10px', color: '#6b778c', fontWeight: 700, paddingBottom: '4px', paddingLeft: '6px' }}>Label</th>
            <th style={{ textAlign: 'left', fontSize: '10px', color: '#6b778c', fontWeight: 700, paddingBottom: '4px', paddingLeft: '6px' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {scale.map((item, i) => (
            <tr key={i}>
              <td style={{ verticalAlign: 'middle', color: '#6b778c', fontWeight: 700, paddingRight: '4px' }}>{i + 1}</td>
              <td style={{ paddingRight: '6px', paddingBottom: '4px' }}>
                <input
                  type="text"
                  value={item.label}
                  onChange={e => handleChange(i, 'label', e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </td>
              <td style={{ paddingBottom: '4px' }}>
                <input
                  type="text"
                  value={item.description}
                  onChange={e => handleChange(i, 'description', e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSave} style={{ marginTop: '6px' }}>Save {label}</button>
    </div>
  );
}

function DataHandlingModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '6px', padding: '20px 24px',
          maxWidth: '460px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          fontSize: '13px', lineHeight: '1.6', color: '#172b4d',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <strong style={{ fontSize: '14px' }}>How is my data handled?</strong>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b778c', lineHeight: 1, padding: '0 2px' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '12px', color: '#6b778c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stays on Atlassian Forge</p>
        <p style={{ margin: '0 0 12px' }}>
          All your configuration — product requirements, user needs, risk matrix, probability/severity scales, product info, and additional context — is stored in{' '}
          <strong>Atlassian Forge's Key-Value Store</strong> and never leaves Atlassian's infrastructure. Your API key is stored as an encrypted secret within the same platform.
        </p>

        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '12px', color: '#6b778c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sent to Anthropic during a triage run</p>
        <p style={{ margin: '0 0 12px' }}>
          When you run a triage, the <strong>Jira issue content</strong> (title, description, comments) and your <strong>product context</strong> (requirements, user needs, product info, additional context) are assembled into a prompt and sent to{' '}
          <strong>Anthropic's API</strong> to generate the risk assessment. This app does not store that data — it is processed and discarded once the result is returned.
        </p>

        <p style={{ margin: '0 0 16px', color: '#6b778c', fontSize: '12px' }}>
          This app runs entirely on Atlassian's Forge serverless platform. There are no third-party servers involved — data goes Forge &rarr; Anthropic API &rarr; back to Forge, and that's it.
        </p>

        <a
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0052cc', fontSize: '12px', textDecoration: 'none' }}
        >
          View our full Privacy Policy &rarr;
        </a>
      </div>
    </div>
  );
}

function ApiKeyStorageModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '6px', padding: '20px 24px',
          maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          fontSize: '13px', lineHeight: '1.6', color: '#172b4d',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <strong style={{ fontSize: '14px' }}>How is my API key stored?</strong>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b778c', lineHeight: 1, padding: '0 2px' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <p style={{ margin: '0 0 10px' }}>
          Your API key is stored as an <strong>encrypted secret</strong> using{' '}
          <strong>Atlassian Forge's built-in secret storage</strong> (<code style={{ fontSize: '11px', background: '#f4f5f7', padding: '1px 4px', borderRadius: '3px' }}>kvs.setSecret</code>).
        </p>
        <p style={{ margin: '0 0 10px' }}>
          It lives entirely within Atlassian's infrastructure — no server run by this app ever stores or touches your key. It is only ever sent directly from Atlassian's servers to Anthropic's API when you run a triage, using an encrypted HTTPS connection.
        </p>
        <p style={{ margin: '0 0 16px', color: '#6b778c', fontSize: '12px' }}>
          Atlassian Forge secrets are encrypted at rest and in transit, scoped to your Jira site, and are never accessible to other apps or users.
        </p>
        <a
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0052cc', fontSize: '12px', textDecoration: 'none' }}
        >
          View our full Privacy Policy &rarr;
        </a>
      </div>
    </div>
  );
}

function SettingsPanel({ onBack }) {
  const [keyExists, setKeyExists] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [keyStatus, setKeyStatus] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [postComment, setPostComment] = useState(true);
  const [dirtyMap, setDirtyMap] = useState({});
  const [confirmingBack, setConfirmingBack] = useState(false);
  const [productInfo, setProductInfo] = useState({ name: '', type: '', description: '' });
  const [productInfoSaved, setProductInfoSaved] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [additionalContextSaved, setAdditionalContextSaved] = useState(false);
  const [probabilityScale, setProbabilityScale] = useState(DEFAULT_PROBABILITY_SCALE);
  const [severityScale, setSeverityScale] = useState(DEFAULT_SEVERITY_SCALE);
  const [riskMatrix, setRiskMatrix] = useState(DEFAULT_RISK_MATRIX);
  const [riskMatrixSaved, setRiskMatrixSaved] = useState(false);

  const FIELD_LABELS = {
    userNeeds: 'User Needs',
    productRequirements: 'Product Requirements',
    riskMatrix: 'Risk Matrix',
    productInfo: 'Product Info',
    additionalContext: 'Additional Context',
    probabilityScale: 'Probability Scale',
    severityScale: 'Severity Scale',
  };

  const dirtyFields = [
    ...Object.entries(dirtyMap).filter(([, v]) => v).map(([k]) => FIELD_LABELS[k] || k),
    ...(inputValue.trim().length > 0 ? ['API Key'] : []),
  ];

  const isDirty = dirtyFields.length > 0;

  useEffect(() => {
    invoke('getApiKeyStatus').then(({ exists }) => setKeyExists(exists));
    invoke('getPostCommentSetting').then(({ enabled }) => setPostComment(enabled));
    invoke('getProductInfo').then(setProductInfo);
    invoke('getProductContext').then(({ additionalContext: ctx }) => {
      if (ctx) { setAdditionalContext(ctx); setAdditionalContextSaved(true); }
    });
    invoke('getScales').then(({ probabilityScale: ps, severityScale: ss }) => {
      if (ps) setProbabilityScale(ps);
      if (ss) setSeverityScale(ss);
    });
    invoke('getRiskMatrix').then(m => { if (m) setRiskMatrix(m); });
  }, []);

  const handleDirtyChange = (key, dirty) => {
    setDirtyMap(prev => ({ ...prev, [key]: dirty }));
  };

  const handleProductInfoChange = (field, value) => {
    setProductInfo(prev => ({ ...prev, [field]: value }));
    setProductInfoSaved(false);
    setDirtyMap(prev => ({ ...prev, productInfo: true }));
  };

  const handleSaveProductInfo = async () => {
    await invoke('saveProductInfo', productInfo);
    setProductInfoSaved(true);
    setDirtyMap(prev => ({ ...prev, productInfo: false }));
  };

  const handleSaveAdditionalContext = async () => {
    await invoke('saveAdditionalContext', { additionalContext });
    setAdditionalContextSaved(true);
    setDirtyMap(prev => ({ ...prev, additionalContext: false }));
  };

  const handleSaveRiskMatrix = async () => {
    await invoke('saveRiskMatrix', { matrix: riskMatrix });
    setRiskMatrixSaved(true);
    setDirtyMap(prev => ({ ...prev, riskMatrix: false }));
  };

  const handlePostCommentToggle = async (e) => {
    const enabled = e.target.checked;
    setPostComment(enabled);
    await invoke('savePostCommentSetting', { enabled });
  };

  const handleSaveKey = async () => {
    if (!inputValue.trim()) { setKeyStatus('Please enter an API key.'); return; }
    setKeyStatus('Saving...');
    await invoke('saveApiKey', { apiKey: inputValue.trim() });
    setInputValue('');
    setKeyExists(true);
    setKeyStatus('API key saved.');
  };

  const handleDeleteKey = async () => {
    await invoke('deleteApiKey');
    setKeyExists(false);
    setKeyStatus('API key removed.');
  };

  const saveHandlersRef = useRef({});
  const registerSaveHandler = useCallback((key, fn) => {
    saveHandlersRef.current[key] = fn;
  }, []);

  const [saveAllError, setSaveAllError] = useState('');

  const handleSaveAll = async () => {
    setSaveAllError('');
    const tasks = [];
    if (dirtyMap.productInfo) tasks.push(handleSaveProductInfo());
    if (dirtyMap.additionalContext) tasks.push(handleSaveAdditionalContext());
    if (dirtyMap.riskMatrix) tasks.push(handleSaveRiskMatrix());
    if (inputValue.trim()) tasks.push(handleSaveKey());
    for (const [key, fn] of Object.entries(saveHandlersRef.current)) {
      if (dirtyMap[key]) tasks.push(fn());
    }
    try {
      await Promise.all(tasks);
      onBack();
    } catch {
      setSaveAllError('Some changes could not be saved. Please try again.');
    }
  };

  const handleBack = () => {
    if (isDirty) { setConfirmingBack(true); } else { onBack(); }
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      {showApiKeyModal && <ApiKeyStorageModal onClose={() => setShowApiKeyModal(false)} />}
      {showDataModal && <DataHandlingModal onClose={() => setShowDataModal(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={handleBack} style={{ marginRight: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#0052cc' }}>
          &#8592; Back
        </button>
        <h4 style={{ margin: 0, flex: 1 }}>Settings</h4>
        <button
          onClick={() => setShowDataModal(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c', fontSize: '11px', textDecoration: 'underline', padding: 0 }}
        >
          How is my data handled?
        </button>
      </div>

      {confirmingBack && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#fffae6', border: '1px solid #ffab00', borderRadius: '4px', fontSize: '12px' }}>
          <strong>Unsaved changes in: </strong>{dirtyFields.join(', ')}
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={onBack}>Leave without saving</button>
            <button onClick={() => setConfirmingBack(false)}>Keep editing</button>
            <button onClick={handleSaveAll} style={{ fontWeight: 600 }}>Save all changes</button>
          </div>
          {saveAllError && <p style={{ color: 'red', fontSize: '12px', margin: '6px 0 0' }}>{saveAllError}</p>}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <strong style={{ fontSize: '13px' }}>Behaviour</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <input
            type="checkbox"
            id="postComment"
            checked={postComment}
            onChange={handlePostCommentToggle}
          />
          <label htmlFor="postComment" style={{ fontSize: '12px', color: '#172b4d' }}>
            Auto-post risk assessment as a Jira comment after each run
          </label>
        </div>
      </div>

      <hr style={{ margin: '0 0 16px' }} />

      <strong style={{ fontSize: '13px' }}>Anthropic API Key</strong>
      {keyExists === true && (
        <p style={{ color: 'green', fontSize: '12px' }}>
          &#10003; API key is saved.{' '}
          <button onClick={handleDeleteKey} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px' }}>
            Remove
          </button>
        </p>
      )}
      {keyExists === false && <p style={{ color: '#888', fontSize: '12px' }}>No API key saved yet.</p>}
      <input
        type="password"
        placeholder="sk-ant-..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ width: '100%', padding: '6px', marginBottom: '6px', boxSizing: 'border-box' }}
      />
      <button onClick={handleSaveKey}>Save API Key</button>
      {keyStatus && <p style={{ fontSize: '12px', marginTop: '6px' }}>{keyStatus}</p>}
      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6b778c' }}>
        <button
          onClick={() => setShowApiKeyModal(true)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0052cc', fontSize: '11px', textDecoration: 'underline' }}
        >
          How is my API key stored?
        </button>
      </p>

      <hr style={{ margin: '16px 0' }} />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px' }}>Product Info</strong>
          {productInfoSaved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
          {dirtyMap.productInfo && !productInfoSaved && <span style={{ marginLeft: '8px', color: '#ff991f', fontSize: '12px' }}>&#9679; unsaved</span>}
        </div>
        <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px' }}>Used to personalise the risk assessment prompts to your product.</p>
        {[
          { field: 'name', label: 'Product Name', placeholder: 'e.g. MindBridge' },
          { field: 'type', label: 'Product Type', placeholder: 'e.g. regulated mental health Software as Medical Device (SaMD)' },
          { field: 'description', label: 'Product Description', placeholder: 'e.g. a CBT-based therapeutic chatbot' },
        ].map(({ field, label, placeholder }) => (
          <div key={field} style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#6b778c', display: 'block', marginBottom: '2px' }}>{label}</label>
            <input
              type="text"
              value={productInfo[field] || ''}
              placeholder={placeholder}
              onChange={(e) => handleProductInfoChange(field, e.target.value)}
              style={{ width: '100%', padding: '6px', fontSize: '12px', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <button onClick={handleSaveProductInfo} style={{ marginTop: '4px' }}>Save Product Info</button>
      </div>

      <hr style={{ margin: '0 0 16px' }} />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <strong style={{ fontSize: '13px' }}>Additional Context</strong>
          {additionalContextSaved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
          {dirtyMap.additionalContext && !additionalContextSaved && <span style={{ marginLeft: '8px', color: '#ff991f', fontSize: '12px' }}>&#9679; unsaved</span>}
        </div>
        <p style={{ fontSize: '11px', color: '#666', margin: '0 0 6px' }}>
          Free-form context injected into every prompt. Use this for anything product-specific that isn't captured by the structured fields above — regulatory context, risk tolerance guidance, known edge cases, etc.
        </p>
        <textarea
          style={textareaStyle}
          value={additionalContext}
          placeholder="e.g. This product is a Class IIa medical device regulated under EU MDR. Severity scores should account for the vulnerability of the patient population..."
          onChange={(e) => { setAdditionalContext(e.target.value); setAdditionalContextSaved(false); setDirtyMap(prev => ({ ...prev, additionalContext: true })); }}
          spellCheck={false}
        />
        <button onClick={handleSaveAdditionalContext}>Save Additional Context</button>
      </div>

      <ConfigSection
        label="User Needs"
        hint='JSON array of objects with "id" and "description" fields.'
        storageKey="userNeeds"
        saveResolver="saveUserNeeds"
        onDirtyChange={handleDirtyChange}
        registerSave={registerSaveHandler}
      />

      <ConfigSection
        label="Product Requirements"
        hint='JSON array of objects with "id", "description", and "traces_to" fields.'
        storageKey="productRequirements"
        saveResolver="saveProductRequirements"
        onDirtyChange={handleDirtyChange}
        registerSave={registerSaveHandler}
      />

      <hr style={{ margin: '0 0 16px' }} />

      <ScaleEditor
        label="Probability Scale"
        hint="Labels and descriptions for each probability level (1 = lowest, 5 = highest)."
        scaleKey="probabilityScale"
        saveResolver="saveProbabilityScale"
        initialScale={probabilityScale}
        onDirtyChange={handleDirtyChange}
        registerSave={registerSaveHandler}
      />

      <ScaleEditor
        label="Severity Scale"
        hint="Labels and descriptions for each severity level (1 = lowest, 5 = highest)."
        scaleKey="severityScale"
        saveResolver="saveSeverityScale"
        initialScale={severityScale}
        onDirtyChange={handleDirtyChange}
        registerSave={registerSaveHandler}
      />

      <hr style={{ margin: '0 0 16px' }} />

      <RiskMatrixEditor
        matrix={riskMatrix}
        probabilityScale={probabilityScale}
        severityScale={severityScale}
        onMatrixChange={(m) => { setRiskMatrix(m); setRiskMatrixSaved(false); }}
        onDirtyChange={handleDirtyChange}
        onSave={handleSaveRiskMatrix}
        saved={riskMatrixSaved}
        dirty={!!dirtyMap.riskMatrix}
      />
    </div>
  );
}

export default SettingsPanel;