import React from 'react';

// ADS palette — stable hex values matching Atlassian Design System tokens
const RISK_COLORS = {
  HIGH:   { bg: '#ffebe6', border: '#de350b', text: '#bf2600', badgeText: '#fff' },
  MEDIUM: { bg: '#fffae6', border: '#ff991f', text: '#974f0c', badgeText: '#172b4d' },
  LOW:    { bg: '#e3fcef', border: '#00875a', text: '#006644', badgeText: '#fff' },
};

const NON_DEFECT_COLOR = { bg: '#f4f5f7', border: '#97a0af', text: '#42526e', badgeText: '#fff' };

// Score → pill color (1 = best/green, 5 = worst/red)
const SCORE_PILL = {
  1: { bg: '#00875a', text: '#fff' },
  2: { bg: '#36b37e', text: '#fff' },
  3: { bg: '#ffab00', text: '#172b4d' },
  4: { bg: '#ff991f', text: '#172b4d' },
  5: { bg: '#de350b', text: '#fff' },
};

function ScorePill({ score, label }) {
  const c = SCORE_PILL[score] || { bg: '#97a0af', text: '#fff' };
  return (
    <span style={{
      display: 'inline-block',
      background: c.bg,
      color: c.text,
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: '10px',
      lineHeight: '1.8',
      whiteSpace: 'nowrap',
    }}>
      {score} — {label}
    </span>
  );
}

function Label({ children }) {
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 700,
      color: '#6b778c',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      minWidth: '130px',
      flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'baseline' }}>
      <Label>{label}</Label>
      <span style={{ fontSize: '12px', color: '#172b4d', lineHeight: '1.5' }}>{value}</span>
    </div>
  );
}

function ScoreRow({ label, score, scoreLabel, rationale }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Label>{label}</Label>
        <ScorePill score={score} label={scoreLabel} />
      </div>
      <p style={{
        fontSize: '11px',
        color: '#6b778c',
        margin: 0,
        paddingLeft: '138px',
        lineHeight: '1.5',
      }}>
        {rationale}
      </p>
    </div>
  );
}

function References({ refs }) {
  if (!refs?.length) return null;

  // Deduplicate by source + quote, merging step labels
  const seen = new Map();
  for (const r of refs) {
    const key = `${r.source}|||${r.quote}`;
    if (seen.has(key)) {
      seen.get(key).steps.push(r.step);
    } else {
      seen.set(key, { source: r.source, quote: r.quote, steps: [r.step] });
    }
  }
  const deduped = Array.from(seen.values());

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #dfe1e6', paddingTop: '12px' }}>
      <p style={{
        fontSize: '10px',
        fontWeight: 700,
        color: '#6b778c',
        margin: '0 0 8px',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
      }}>
        Evidence
      </p>
      {deduped.map((r, i) => (
        <div key={i} style={{
          marginBottom: '6px',
          padding: '8px 10px',
          background: '#f4f5f7',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'wrap' }}>
            {r.steps.map(s => (
              <span key={s} style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#fff',
                background: '#6b778c',
                padding: '1px 5px',
                borderRadius: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {s}
              </span>
            ))}
            <span style={{ fontSize: '11px', color: '#6b778c' }}>{r.source}</span>
          </div>
          <p style={{
            fontSize: '11px',
            color: '#42526e',
            fontStyle: 'italic',
            margin: 0,
            paddingLeft: '10px',
            borderLeft: '3px solid #dfe1e6',
            lineHeight: '1.5',
          }}>
            "{r.quote}"
          </p>
        </div>
      ))}
    </div>
  );
}

function FailedItems({ ids, items, idKey, descKey }) {
  if (!ids?.length) return <span style={{ fontSize: '12px', color: '#172b4d' }}>None</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {ids.map(id => {
        const match = items?.find(item => item[idKey] === id);
        return (
          <span key={id} style={{ fontSize: '12px', color: '#172b4d', lineHeight: '1.5' }}>
            <strong>{id}</strong>{match ? ` — ${match[descKey]}` : ''}
          </span>
        );
      })}
    </div>
  );
}

function TriageReport({ report, userNeeds = [], productRequirements = [] }) {
  if (report.error) {
    return (
      <div style={{
        marginTop: '12px',
        padding: '10px 12px',
        background: '#ffebe6',
        border: '1px solid #de350b',
        borderRadius: '3px',
        fontSize: '12px',
        color: '#bf2600',
      }}>
        {report.error}
      </div>
    );
  }

  if (report.classification === 'NON-DEFECT') {
    const c = NON_DEFECT_COLOR;
    return (
      <div style={{ marginTop: '12px', padding: '14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <strong style={{ fontSize: '12px', color: c.text }}>{report.bug_id}</strong>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: c.border,
            color: c.badgeText,
            padding: '3px 10px',
            borderRadius: '3px',
            letterSpacing: '0.3px',
          }}>
            NON-DEFECT
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#42526e', margin: '0 0 6px', lineHeight: '1.5' }}>{report.defect_summary}</p>
        <p style={{ fontSize: '11px', color: '#6b778c', margin: 0, fontStyle: 'italic' }}>{report.disposition}</p>
        <References refs={report.references} />
        <p style={{ fontSize: '10px', color: '#97a0af', margin: '10px 0 0' }}>
          Generated {new Date(report.generated_at).toLocaleString()}
        </p>
      </div>
    );
  }

  const ra = report.risk_assessment;
  const c = RISK_COLORS[ra.risk_level] || RISK_COLORS.LOW;

  return (
    <div style={{ marginTop: '12px', padding: '14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '3px' }}>

      {/* Header: bug ID + prominent risk badge */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: c.text, fontWeight: 600, margin: '0 0 6px', opacity: 0.8 }}>{report.bug_id}</p>
        <span style={{
          display: 'inline-block',
          background: c.border,
          color: c.badgeText,
          fontSize: '14px',
          fontWeight: 700,
          padding: '5px 16px',
          borderRadius: '3px',
          letterSpacing: '0.5px',
        }}>
          {ra.risk_level} RISK — Score: {ra.risk_score}
        </span>
      </div>

      {/* Summary */}
      <p style={{ fontSize: '12px', color: '#172b4d', margin: '0 0 12px', lineHeight: '1.6' }}>{report.defect_summary}</p>

      {/* Key/value rows */}
      <div style={{ marginBottom: '10px' }}>
        <Row label="Disposition" value={report.disposition} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
          <Label>Failed Requirements</Label>
          <FailedItems ids={report.failed_requirements} items={productRequirements} idKey="id" descKey="description" />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
          <Label>Failed User Needs</Label>
          <FailedItems ids={report.failed_user_needs} items={userNeeds} idKey="id" descKey="description" />
        </div>
      </div>

      {/* Probability + Severity with score pills */}
      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '10px' }}>
        <ScoreRow
          label="Probability"
          score={ra.probability_score}
          scoreLabel={ra.probability_label}
          rationale={ra.probability_rationale}
        />
        <ScoreRow
          label="Severity"
          score={ra.severity_score}
          scoreLabel={ra.severity_label}
          rationale={ra.severity_rationale}
        />
      </div>

      <References refs={report.references} />

      <p style={{ fontSize: '10px', color: '#97a0af', margin: '10px 0 0' }}>
        Generated {new Date(report.generated_at).toLocaleString()}
      </p>
    </div>
  );
}

export default TriageReport;
