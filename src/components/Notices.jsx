/** 轻提示：本地不可写、同步失败等，短暂出现后自动消失。 */
export default function Notices({ notices }) {
  if (!notices.length) return null;
  return (
    <div className="notices" role="status" aria-live="polite">
      {notices.map((n) => (
        <p key={n.id} className="notice">
          {n.text}
        </p>
      ))}
    </div>
  );
}
