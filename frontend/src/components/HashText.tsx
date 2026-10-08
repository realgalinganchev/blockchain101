import React from "react";

interface HashTextProps {
  hash?: string;
  /** hex characters to keep after the leading zeros, before the ellipsis */
  head?: number;
  tail?: number;
  /** show the whole value, wrapped, instead of shortening it */
  full?: boolean;
  /** highlight leading zeros; off for addresses, where zeros mean nothing */
  zeros?: boolean;
}

/** Shortened hash with its proof-of-work leading zeros highlighted. */
const HashText: React.FC<HashTextProps> = ({ hash, head = 6, tail = 4, full = false, zeros = true }) => {
  if (!hash) return <span className="hash">—</span>;
  const hex = hash.replace(/^0x/, "");
  const leading = zeros ? (hex.match(/^0*/) ?? [""])[0] : "";
  const rest = hex.slice(leading.length);
  const shown = !full && rest.length > head + tail ? `${rest.slice(0, head)}…${rest.slice(-tail)}` : rest;
  return (
    <span className={`hash${full ? " hash--full" : ""}`} title={full ? undefined : hash}>
      <span className="hash-prefix">0x</span>
      {leading && <span className="hash-zeros">{leading}</span>}
      {shown}
    </span>
  );
};

export default HashText;
