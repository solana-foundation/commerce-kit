import {
  Codama,
  setInstructionAccountDefaultValuesVisitor,
} from "codama";
import {
  createAtaPdaValueNode,
  createMerchantPdaValueNode,
  createOperatorPdaValueNode,
  createMerchantOperatorConfigPdaValueNode,
  createPaymentPdaValueNode,
} from "../pda-helpers";

export function setInstructionAccountDefaultValues(commerceCodama: Codama): Codama {
  commerceCodama.update(
    setInstructionAccountDefaultValuesVisitor([
      // For createOperator instruction
      {
        instruction: "createOperator",
        account: "operator",
        defaultValue: createOperatorPdaValueNode("authority"),
      },

      // For updateOperatorAuthority instruction
      {
        instruction: "updateOperatorAuthority",
        account: "operator",
        defaultValue: createOperatorPdaValueNode("authority"),
      },

      // For initializeMerchantOperatorConfig instruction
      {
        instruction: "initializeMerchantOperatorConfig",
        account: "config",
        defaultValue: createMerchantOperatorConfigPdaValueNode(
          "merchant",
          "operator"
        ),
      },

      // For initializeMerchant instruction
      {
        instruction: "initializeMerchant",
        account: "merchant",
        defaultValue: createMerchantPdaValueNode("authority"),
      },

      // For updateMerchantAuthority instruction
      {
        instruction: "updateMerchantAuthority",
        account: "merchant",
        defaultValue: createMerchantPdaValueNode("authority"),
      },

      // For updateMerchantSettlementWallet instruction
      {
        instruction: "updateMerchantSettlementWallet",
        account: "merchant",
        defaultValue: createMerchantPdaValueNode("authority"),
      },

      // For makePayment instruction - derive payment PDA and ATAs
      {
        instruction: "makePayment",
        account: "payment",
        defaultValue: createPaymentPdaValueNode(
          "merchantOperatorConfig",
          "buyer",
          "mint"
        ),
      },
      {
        instruction: "makePayment",
        account: "buyerAta",
        defaultValue: createAtaPdaValueNode("buyer", "mint"),
      },
      {
        instruction: "makePayment",
        account: "merchantEscrowAta",
        defaultValue: createAtaPdaValueNode("merchant", "mint"),
      },
      {
        instruction: "makePayment",
        account: "operator",
        defaultValue: createOperatorPdaValueNode("operatorAuthority"),
      },

      // For refundPayment instruction
      {
        instruction: "refundPayment",
        account: "operator",
        defaultValue: createOperatorPdaValueNode("operatorAuthority"),
      },
      {
        instruction: "refundPayment",
        account: "buyerAta",
        defaultValue: createAtaPdaValueNode("buyer", "mint"),
      },
      {
        instruction: "refundPayment",
        account: "merchantEscrowAta",
        defaultValue: createAtaPdaValueNode("merchant", "mint"),
      },

      // For clearPayment instruction
      {
        instruction: "clearPayment",
        account: "operator",
        defaultValue: createOperatorPdaValueNode("operatorAuthority"),
      },
      {
        instruction: "clearPayment",
        account: "merchantEscrowAta",
        defaultValue: createAtaPdaValueNode("merchant", "mint"),
      },
      {
        instruction: "clearPayment",
        account: "operatorSettlementAta",
        defaultValue: createAtaPdaValueNode("operatorAuthority", "mint"),
      },

      // For closePayment instruction
      {
        instruction: "closePayment",
        account: "operator",
        defaultValue: createOperatorPdaValueNode("operatorAuthority"),
      },
    ])
  );
  return commerceCodama;
}