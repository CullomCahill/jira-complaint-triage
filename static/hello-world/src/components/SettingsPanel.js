import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';

const textareaStyle = {
  width: '100%',
  padding: '6px',
  fontSize: '11px',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
  minHeight: '120px',
  marginBottom: '6px',
};

function ConfigSection({ label, hint, storageKey, saveResolver }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    invoke('getProductContext').then((ctx) => {
      const val = ctx[storageKey];
      if (val && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0)) {
        setText(JSON.stringify(val, null, 2));
        setSaved(true);
      }
    });
  }, [storageKey]);

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
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
        <strong style={{ fontSize: '13px' }}>{label}</strong>
        {saved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
      </div>
      <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px' }}>{hint}</p>
      <textarea
        style={textareaStyle}
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        spellCheck={false}
      />
      {error && <p style={{ color: 'red', fontSize: '12px', margin: '0 0 4px' }}>{error}</p>}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

function SettingsPanel({ onBack }) {
  const [keyExists, setKeyExists] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [keyStatus, setKeyStatus] = useState('');
  const [postComment, setPostComment] = useState(true);

  useEffect(() => {
    invoke('getApiKeyStatus').then(({ exists }) => setKeyExists(exists));
    invoke('getPostCommentSetting').then(({ enabled }) => setPostComment(enabled));
  }, []);

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

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={onBack} style={{ marginRight: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#0052cc' }}>
          &#8592; Back
        </button>
        <h4 style={{ margin: 0 }}>Settings</h4>
      </div>

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

      <hr style={{ margin: '16px 0' }} />

      <ConfigSection
        label="User Needs"
        hint='JSON array of objects with "id" and "description" fields.'
        storageKey="userNeeds"
        saveResolver="saveUserNeeds"
      />

      <ConfigSection
        label="Product Requirements"
        hint='JSON array of objects with "id", "description", and "traces_to" fields.'
        storageKey="productRequirements"
        saveResolver="saveProductRequirements"
      />

      <ConfigSection
        label="Defect Criteria"
        hint='JSON object with a "must_meet_both" array of two strings.'
        storageKey="defectCriteria"
        saveResolver="saveDefectCriteria"
      />
    </div>
  );
}

export default SettingsPanel;