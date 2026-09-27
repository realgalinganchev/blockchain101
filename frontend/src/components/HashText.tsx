import React from "react";

interface HashTextProps {
  hash?: string;
  /** hex characters to keep after the leading zeros, before the ellipsis */
  head?: number;
  tail?: number;
}

/** Shortened hash with its proof-of-work leading zeros highlighted. */
const HashText: React.FC<HashTextProps> = ({ hash, head = 6, tail = 4 }) => {
  if (!hash) return <span className="hash">—</span>;
  const hex = hash.replace(/^0x/, "");
  const zeros = (hex.match(/^0*/) ?? [""])[0];
  const rest = hex.slice(zeros.length);
  const shown = rest.length > head + tail ? `${rest.slice(0, head)}…${rest.slice(-tail)}` : rest;
  return (
    <span className="hash" title={hash}>
      <span className="hash-prefix">0x</span>
      {zeros && <span className="hash-zeros">{zeros}</span>}
      {shown}
    </span>
  );
};

export default HashText;
