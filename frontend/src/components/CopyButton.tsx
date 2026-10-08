import React, { useEffect, useState } from "react";

const CopyButton: React.FC<{ value?: string; label?: string }> = ({ value, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!value) return null;

  const copy = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => setCopied(true))
      .catch(() => undefined);
  };

  return (
    <button type="button" className="copy" onClick={copy} aria-label={`${label} ${value}`}>
      {copied ? "copied" : "copy"}
    </button>
  );
};

export default CopyButton;
