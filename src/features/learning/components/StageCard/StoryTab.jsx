export default function StoryTab({ stageTitle, story = [], facts = [] }) {
  return (
    <div className="tab-story">
      <h3 className="tab-heading-story">The Story of {stageTitle}</h3>
      <div className="story-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {story.map((node, i) => (
          <div key={i} className="story-node" style={{
            background: 'var(--bg-elevated)',
            borderLeft: '4px solid var(--blue)',
            padding: '16px',
            borderRadius: '0 12px 12px 0'
          }}>
            <p style={{ fontWeight: '700', marginBottom: '8px' }}>{node.label || `Chapter ${i + 1}`}</p>
            <p className="text-body">{node.detail}</p>
            {facts[i] && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                💡 Fact: {facts[i]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
