import {
  Codama,
  setInstructionAccountDefaultValuesVisitor,
  publicKeyValueNode,
} from "codama";
import {
  TOKEN_PROGRAM_ID,
  ATA_PROGRAM_ID,
  COMMERCE_PROGRAM_ID,
  USDC_MINT,
  USDT_MINT,
  EVENT_AUTHORITY_PDA,
} from "../constants";

export function setDefaultAccountValues(commerceCodama: Codama): Codama {
  commerceCodama.update(
    setInstructionAccountDefaultValuesVisitor([
      {
        account: "tokenProgram",
        defaultValue: publicKeyValueNode(TOKEN_PROGRAM_ID),
      },
      {
        account: "associatedTokenProgram",
        defaultValue: publicKeyValueNode(ATA_PROGRAM_ID),
      },
      {
        account: "commerceProgram",
        defaultValue: publicKeyValueNode(COMMERCE_PROGRAM_ID),
      },
      {
        account: "usdcMint",
        defaultValue: publicKeyValueNode(USDC_MINT),
      },
      {
        account: "usdtMint",
        defaultValue: publicKeyValueNode(USDT_MINT),
      },
      {
        account: "eventAuthority",
        defaultValue: publicKeyValueNode(EVENT_AUTHORITY_PDA),
      },
    ])
  );
  return commerceCodama;
}