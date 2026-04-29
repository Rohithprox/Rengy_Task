export default function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}
