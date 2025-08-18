import {
  Codama,
  bottomUpTransformerVisitor,
  assertIsNode,
  isNode,
  structFieldTypeNode,
  numberTypeNode,
  arrayTypeNode,
  definedTypeLinkNode,
  prefixedCountNode,
  publicKeyTypeNode,
  enumTypeNode,
  enumStructVariantTypeNode,
  constantDiscriminatorNode,
  constantValueNode,
  numberValueNode,
} from "codama";

export function appendMOConfigFields(commerceCodama: Codama): Codama {
  commerceCodama.update(
    bottomUpTransformerVisitor([
      {
        // Update the policyData enum to use proper discriminators
        select: "[definedTypeNode]policyData",
        transform: (node) => {
          assertIsNode(node, "definedTypeNode");

          // Check if it's already an enum
          if (isNode(node.type, "enumTypeNode")) {
            console.log("node.type", node.type);
            // Update the enum variants to have explicit discriminators
            const updatedNode = {
              ...node,
              type: {
                ...node.type,
                variants: node.type.variants.map((variant, index) => {
                  if (variant.name === "refund" || variant.name === "Refund") {
                    return {
                      ...variant,
                      discriminator: constantDiscriminatorNode(
                        constantValueNode(numberTypeNode("u8"), numberValueNode(0))
                      ),
                    };
                  } else if (variant.name === "settlement" || variant.name === "Settlement") {
                    return {
                      ...variant,
                      discriminator: constantDiscriminatorNode(
                        constantValueNode(numberTypeNode("u8"), numberValueNode(1))
                      ),
                    };
                  }
                  return variant;
                }),
              },
              
            };
            console.log("updatedNode", updatedNode.type);
            return updatedNode;
          }


          return node;
        },
      },
      {
        // Update merchant operator config fields
        select: "[accountNode]merchantOperatorConfig",
        transform: (node) => {
          assertIsNode(node, "accountNode");

          if (isNode(node.data, "structTypeNode")) {
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                fields: [
                  ...node.data.fields,
                  structFieldTypeNode({
                    name: "policies",
                    type: arrayTypeNode(
                      definedTypeLinkNode("policyData"),
                      prefixedCountNode(numberTypeNode("u32"))
                    ),
                  }),
                  structFieldTypeNode({
                    name: "acceptedCurrencies",
                    type: arrayTypeNode(
                      publicKeyTypeNode(),
                      prefixedCountNode(numberTypeNode("u32"))
                    ),
                  })
                ],
              },
            };

            return updatedNode;
          }

          return node;
        }
      }
    ])
  )
  return commerceCodama;
}
