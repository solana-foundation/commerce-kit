import {
  Codama,
  addPdasVisitor,
  constantPdaSeedNode,
  variablePdaSeedNode,
  publicKeyTypeNode,
  stringTypeNode,
  stringValueNode,
  numberTypeNode,
} from "codama";
import {
  MERCHANT_SEED,
  OPERATOR_SEED,
  MERCHANT_OPERATOR_CONFIG_SEED,
  PAYMENT_SEED,
  EVENT_AUTHORITY_SEED,
} from "../constants";

export function appendPdaDerivers(commerceCodama: Codama): Codama {
  commerceCodama.update(
    addPdasVisitor({
      commerceProgram: [
        {
          name: "merchant",
          seeds: [
            constantPdaSeedNode(
              stringTypeNode("utf8"),
              stringValueNode(MERCHANT_SEED)
            ),
            variablePdaSeedNode("owner", publicKeyTypeNode()),
          ],
        },
        {
          name: "operator",
          seeds: [
            constantPdaSeedNode(
              stringTypeNode("utf8"),
              stringValueNode(OPERATOR_SEED)
            ),
            variablePdaSeedNode("owner", publicKeyTypeNode()),
          ],
        },
        {
          name: "merchantOperatorConfig",
          seeds: [
            constantPdaSeedNode(
              stringTypeNode("utf8"),
              stringValueNode(MERCHANT_OPERATOR_CONFIG_SEED)
            ),
            variablePdaSeedNode("merchant", publicKeyTypeNode()),
            variablePdaSeedNode("operator", publicKeyTypeNode()),
            variablePdaSeedNode("version", numberTypeNode("u32")),
          ],
        },
        {
          name: "payment",
          seeds: [
            constantPdaSeedNode(
              stringTypeNode("utf8"),
              stringValueNode(PAYMENT_SEED)
            ),
            variablePdaSeedNode("merchantOperatorConfig", publicKeyTypeNode()),
            variablePdaSeedNode("buyer", publicKeyTypeNode()),
            variablePdaSeedNode("mint", publicKeyTypeNode()),
            variablePdaSeedNode("orderId", numberTypeNode("u32")),
          ],
        },
        {
          name: "eventAuthority",
          seeds: [
            constantPdaSeedNode(
              stringTypeNode("utf8"),
              stringValueNode(EVENT_AUTHORITY_SEED)
            ),
          ],
        },
      ],
    })
  );
  return commerceCodama;
}