import React from 'react';

const RISK_COLORS = {
  HIGH: { bg: '#ffebe6', border: '#ff5630', text: '#bf2600' },
  MEDIUM: { bg: '#fffae6', border: '#ffab00', text: '#172b4d' },
  LOW: { bg: '#e3fcef', border: '#36b37e', text: '#006644' },
};

const NON_DEFECT_COLOR = { bg: '#f4f5f7', border: '#97a0af', text: '#42526e' };

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px' }}>
      <span style={{ color: '#6b778c', minWidth: '130px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#172b4d' }}>{value}</span>
    </div>
  );
}

function References({ refs }) {
  if (!refs?.length) return null;
  return (
    <div style={{ marginTop: '10px', borderTop: '1px solid #dfe1e6', paddingTop: '10px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b778c', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evidence</p>
      {refs.map((r, i) => (
        <div key={i} style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: '#97a0af', fontWeight: 600, textTransform: 'uppercase', marginRight: '6px' }}>{r.step}</span>
          <span style={{ fontSize: '11px', color: '#6b778c' }}>{r.source}</span>
          <p style={{ fontSize: '11px', color: '#42526e', fontStyle: 'italic', margin: '2px 0 0 0', paddingLeft: '8px', borderLeft: '2px solid #dfe1e6' }}>"{r.quote}"</p>
        </div>
      ))}
    </div>
  );
}

function TriageReport({ report }) {
  if (report.error) {
    return (
      <div style={{ marginTop: '12px', padding: '10px', background: '#ffebe6', border: '1px solid #ff5630', borderRadius: '4px', fontSize: '12px', color: '#bf2600' }}>
        {report.error}
      </div>
    );
  }

  if (report.classification === 'NON-DEFECT') {
    const c = NON_DEFECT_COLOR;
    return (
      <div style={{ marginTop: '12px', padding: '12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px', color: c.text }}>{report.bug_id}</strong>
          <span style={{ fontSize: '11px', background: c.border, color: '#fff', padding: '2px 6px', borderRadius: '3px' }}>NON-DEFECT</span>
        </div>
        <p style={{ fontSize: '12px', color: '#42526e', margin: '0 0 6px' }}>{report.defect_summary}</p>
        <p style={{ fontSize: '11px', color: '#6b778c', margin: 0 }}>{report.disposition}</p>
        <References refs={report.references} />
      </div>
    );
  }

  const ra = report.risk_assessment;
  const c = RISK_COLORS[ra.risk_level] || RISK_COLORS.LOW;

  return (
    <div style={{ marginTop: '12px', padding: '12px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <strong style={{ fontSize: '13px', color: c.text }}>{report.bug_id}</strong>
        <span style={{ fontSize: '11px', background: c.border, color: ra.risk_level === 'MEDIUM' ? '#172b4d' : '#fff', padding: '2px 6px', borderRadius: '3px' }}>
          {ra.risk_level} RISK — {ra.risk_score}
        </span>
      </div>

      <p style={{ fontSize: '12px', color: '#172b4d', margin: '0 0 10px', lineHeight: '1.5' }}>{report.defect_summary}</p>

      <Row label="Disposition" value={report.disposition} />
      <Row label="Failed Requirements" value={report.failed_requirements.join(', ') || 'None'} />
      <Row label="Failed User Needs" value={report.failed_user_needs.join(', ') || 'None'} />

      <div style={{ marginTop: '10px', borderTop: `1px solid ${c.border}`, paddingTop: '10px' }}>
        <Row label="Probability" value={`${ra.probability_score} — ${ra.probability_label}`} />
        <p style={{ fontSize: '11px', color: '#6b778c', margin: '0 0 8px 138px', lineHeight: '1.4' }}>{ra.probability_rationale}</p>
        <Row label="Severity" value={`${ra.severity_score} — ${ra.severity_label}`} />
        <p style={{ fontSize: '11px', color: '#6b778c', margin: '0 0 0 138px', lineHeight: '1.4' }}>{ra.severity_rationale}</p>
      </div>

      <References refs={report.references} />

      <p style={{ fontSize: '10px', color: '#97a0af', margin: '10px 0 0' }}>Generated {new Date(report.generated_at).toLocaleString()}</p>
    </div>
  );
}

export default TriageReport;