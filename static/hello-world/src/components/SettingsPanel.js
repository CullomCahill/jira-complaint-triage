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

function ConfigSection({ label, hint, storageKey, saveResolver, onDirtyChange }) {
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

  const handleChange = (e) => {
    setText(e.target.value);
    setSaved(false);
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
    onDirtyChange(storageKey, false);
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
        onChange={handleChange}
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
  const [dirtyMap, setDirtyMap] = useState({});
  const [confirmingBack, setConfirmingBack] = useState(false);
  const [productInfo, setProductInfo] = useState({ name: '', type: '', description: '' });
  const [productInfoSaved, setProductInfoSaved] = useState(false);

  const isDirty = Object.values(dirtyMap).some(Boolean) || inputValue.trim().length > 0 || dirtyMap['productInfo'];

  useEffect(() => {
    invoke('getApiKeyStatus').then(({ exists }) => setKeyExists(exists));
    invoke('getPostCommentSetting').then(({ enabled }) => setPostComment(enabled));
    invoke('getProductInfo').then(setProductInfo);
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

  const handleBack = () => {
    if (isDirty) { setConfirmingBack(true); } else { onBack(); }
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={handleBack} style={{ marginRight: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#0052cc' }}>
          &#8592; Back
        </button>
        <h4 style={{ margin: 0 }}>Settings</h4>
      </div>

      {confirmingBack && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#fffae6', border: '1px solid #ffab00', borderRadius: '4px', fontSize: '12px' }}>
          <strong>You have unsaved changes.</strong> Go back anyway?
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={onBack}>Leave without saving</button>
            <button onClick={() => setConfirmingBack(false)}>Stay</button>
          </div>
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

      <hr style={{ margin: '16px 0' }} />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px' }}>Product Info</strong>
          {productInfoSaved && <span style={{ marginLeft: '8px', color: 'green', fontSize: '12px' }}>&#10003; saved</span>}
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

      <ConfigSection
        label="User Needs"
        hint='JSON array of objects with "id" and "description" fields.'
        storageKey="userNeeds"
        saveResolver="saveUserNeeds"
        onDirtyChange={handleDirtyChange}
      />

      <ConfigSection
        label="Product Requirements"
        hint='JSON array of objects with "id", "description", and "traces_to" fields.'
        storageKey="productRequirements"
        saveResolver="saveProductRequirements"
        onDirtyChange={handleDirtyChange}
      />

      <ConfigSection
        label="Defect Criteria"
        hint='JSON object with a "must_meet_both" array of two strings.'
        storageKey="defectCriteria"
        saveResolver="saveDefectCriteria"
        onDirtyChange={handleDirtyChange}
      />
    </div>
  );
}

export default SettingsPanel;