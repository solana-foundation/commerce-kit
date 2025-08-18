import {
  Codama,
  bottomUpTransformerVisitor,
  assertIsNode,
  argumentValueNode,
  instructionRemainingAccountsNode,
} from "codama";

export function appendMOConfigRemainingAccounts(commerceCodama: Codama): Codama {
  commerceCodama.update(
    bottomUpTransformerVisitor([
      {
        select: "[instructionNode]initializeMerchantOperatorConfig",
        transform: (node) => {
          assertIsNode(node, "instructionNode");

          return {
            ...node,
            remainingAccounts: [
              instructionRemainingAccountsNode(
                argumentValueNode("acceptedCurrencies"),
                {
                  docs: ["The mint accounts for each accepted currency"],
                  isOptional: false,
                  isSigner: false,
                  isWritable: false,
                }
              ),
            ],
          };
        },
      },
    ])
  );
  return commerceCodama;
}