import { sha256 } from "ethereum-cryptography/sha256";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";

// the possible colors that the hash could represent
const COLORS: string[] = ["red", "green", "blue", "yellow", "pink", "orange"];

// given a hash, return the color that created the hash
function findColor(hash: string): string | undefined {
  const rainbowTable = COLORS.map((c) => sha256(utf8ToBytes(c)));
  const hashBytes = utf8ToBytes(hash);

  for (let i = 0; i < rainbowTable.length; i++) {
    if (toHex(rainbowTable[i]) === toHex(hashBytes)) {
      return COLORS[i];
    }
  }
}

export default findColor;
