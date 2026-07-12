/** Wraps a control — shows a tooltip bubble on hover. */
export default function HoverTip({ tip, children, block = false }) {
  if (!tip) return children

  return (
    <span
      className="ns-hover-tip"
      style={{ position: "relative", display: block ? "block" : "inline-block" }}
    >
      {children}
      <span className="ns-hover-tip__bubble" role="tooltip">
        {tip}
      </span>
      <style>{`
        .ns-hover-tip__bubble {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          z-index: 50;
          left: 50%;
          bottom: calc(100% + 8px);
          transform: translateX(-50%);
          width: max-content;
          max-width: 240px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #0a1628;
          color: #e8f4ff;
          font-size: 0.72rem;
          font-weight: 500;
          line-height: 1.45;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
          pointer-events: none;
          transition: opacity 0.15s ease, visibility 0.15s ease;
        }
        .ns-hover-tip__bubble::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #0a1628;
        }
        .ns-hover-tip:hover .ns-hover-tip__bubble,
        .ns-hover-tip:focus-within .ns-hover-tip__bubble {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </span>
  )
}
