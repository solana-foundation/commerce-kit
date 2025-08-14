import * as codama from "codama";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import {
  TOKEN_PROGRAM_ID,
  ATA_PROGRAM_ID,
  COMMERCE_PROGRAM_ID,
  USDC_MINT,
  USDT_MINT,
  EVENT_AUTHORITY_PDA,
  MERCHANT_SEED,
  OPERATOR_SEED,
  MERCHANT_OPERATOR_CONFIG_SEED,
  PAYMENT_SEED,
  EVENT_AUTHORITY_SEED,
} from './constants';
import {
  createAtaPdaValueNode,
  createMerchantPdaValueNode,
  createOperatorPdaValueNode,
  createMerchantOperatorConfigPdaValueNode,
  createPaymentPdaValueNode,
} from './pda-helpers';

const { constantPdaSeedNode, variablePdaSeedNode, publicKeyTypeNode, stringTypeNode, stringValueNode, numberTypeNode, publicKeyValueNode, argumentValueNode, instructionRemainingAccountsNode } = codama;

export function createCommerceCodama(commerceIdl: any): codama.Codama {
  const commerceCodama = codama.createFromRoot(rootNodeFromAnchor(commerceIdl));

  // Add 1 byte discriminator for accounts
  commerceCodama.update(
    codama.bottomUpTransformerVisitor([
      {
        select: "[accountNode]",
        transform: (node) => {
          codama.assertIsNode(node, "accountNode");

          // Check if the data is a struct type
          if (codama.isNode(node.data, "structTypeNode")) {
            return {
              ...node,
              data: {
                ...node.data,
                fields: [
                  codama.structFieldTypeNode({
                    name: "discriminator",
                    type: codama.numberTypeNode("u8"),
                  }),
                  ...node.data.fields,
                ],
              },
            };
          }

          return node;
        },
      },
    ]),
  );

  // Set default values for common accounts
  commerceCodama.update(
    codama.setInstructionAccountDefaultValuesVisitor([
      {
        account: 'tokenProgram',
        defaultValue: codama.publicKeyValueNode(TOKEN_PROGRAM_ID)
      },
      {
        account: 'associatedTokenProgram',
        defaultValue: codama.publicKeyValueNode(ATA_PROGRAM_ID)
      },
      {
        account: 'commerceProgram',
        defaultValue: codama.publicKeyValueNode(COMMERCE_PROGRAM_ID)
      },
      {
        account: 'usdcMint',
        defaultValue: codama.publicKeyValueNode(USDC_MINT)
      },
      {
        account: 'usdtMint',
        defaultValue: codama.publicKeyValueNode(USDT_MINT)
      },
      {
        account: 'eventAuthority',
        defaultValue: codama.publicKeyValueNode(EVENT_AUTHORITY_PDA)
      }
    ]),
  );

  // Add PDA derivers
  commerceCodama.update(
    codama.addPdasVisitor({
      commerceProgram: [
        {
          name: 'merchant',
          seeds: [
            constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(MERCHANT_SEED)),
            variablePdaSeedNode('owner', publicKeyTypeNode()),
          ],
        },
        {
          name: 'operator',
          seeds: [
            constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(OPERATOR_SEED)),
            variablePdaSeedNode('owner', publicKeyTypeNode()),
          ],
        },
        {
          name: 'merchantOperatorConfig',
          seeds: [
            constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(MERCHANT_OPERATOR_CONFIG_SEED)),
            variablePdaSeedNode('merchant', publicKeyTypeNode()),
            variablePdaSeedNode('operator', publicKeyTypeNode()),
            variablePdaSeedNode('version', numberTypeNode('u32')),
          ],
        },
        {
          name: 'payment',
          seeds: [
            constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(PAYMENT_SEED)),
            variablePdaSeedNode('merchantOperatorConfig', publicKeyTypeNode()),
            variablePdaSeedNode('buyer', publicKeyTypeNode()),
            variablePdaSeedNode('mint', publicKeyTypeNode()),
            variablePdaSeedNode('orderId', numberTypeNode('u32')),
          ],
        },
        {
          name: 'eventAuthority',
          seeds: [
            constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(EVENT_AUTHORITY_SEED)),
          ],
        },
      ],
    }),
  );

  // Add instruction-specific default values
  commerceCodama.update(
    codama.setInstructionAccountDefaultValuesVisitor([
      // For createOperator instruction
      {
        instruction: 'createOperator',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('authority')
      },

      // For updateOperatorAuthority instruction
      {
        instruction: 'updateOperatorAuthority',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('authority')
      },

      // For initializeMerchantOperatorConfig instruction
      {
        instruction: 'initializeMerchantOperatorConfig',
        account: 'config',
        defaultValue: createMerchantOperatorConfigPdaValueNode('merchant', 'operator')
      },

      // For initializeMerchant instruction
      {
        instruction: 'initializeMerchant',
        account: 'merchant',
        defaultValue: createMerchantPdaValueNode('authority')
      },
      {
        instruction: 'initializeMerchant',
        account: 'settlementUsdcAta',
        defaultValue: createAtaPdaValueNode('settlementWallet', 'usdcMint')
      },
      {
        instruction: 'initializeMerchant',
        account: 'settlementUsdtAta',
        defaultValue: createAtaPdaValueNode('settlementWallet', 'usdtMint')
      },
      {
        instruction: 'initializeMerchant',
        account: 'escrowUsdcAta',
        defaultValue: createAtaPdaValueNode('merchant', 'usdcMint')
      },
      {
        instruction: 'initializeMerchant',
        account: 'escrowUsdtAta',
        defaultValue: createAtaPdaValueNode('merchant', 'usdtMint')
      },

      // For updateMerchantAuthority instruction
      {
        instruction: 'updateMerchantAuthority',
        account: 'merchant',
        defaultValue: createMerchantPdaValueNode('authority')
      },

      // For updateMerchantSettlementWallet instruction
      {
        instruction: 'updateMerchantSettlementWallet',
        account: 'merchant',
        defaultValue: createMerchantPdaValueNode('authority')
      },
      {
        instruction: 'updateMerchantSettlementWallet',
        account: 'settlementUsdcAta',
        defaultValue: createAtaPdaValueNode('newSettlementWallet', 'usdcMint')
      },
      {
        instruction: 'updateMerchantSettlementWallet',
        account: 'settlementUsdtAta',
        defaultValue: createAtaPdaValueNode('newSettlementWallet', 'usdtMint')
      },

      // For makePayment instruction - derive payment PDA and ATAs
      {
        instruction: 'makePayment',
        account: 'payment',
        defaultValue: createPaymentPdaValueNode('merchantOperatorConfig', 'buyer', 'mint')
      },
      {
        instruction: 'makePayment',
        account: 'buyerAta',
        defaultValue: createAtaPdaValueNode('buyer', 'mint')
      },
      {
        instruction: 'makePayment',
        account: 'merchantEscrowAta',
        defaultValue: createAtaPdaValueNode('merchant', 'mint')
      },
      {
        instruction: 'makePayment',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('operatorAuthority')
      },

      // note: we cannot derive merchantSettlementAta because the settlement wallet is not in the instruction accounts

      // For refundPayment instruction
      {
        instruction: 'refundPayment',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('operatorAuthority')
      },
      {
        instruction: 'refundPayment',
        account: 'buyerAta',
        defaultValue: createAtaPdaValueNode('buyer', 'mint')
      },
      {
        instruction: 'refundPayment',
        account: 'merchantEscrowAta',
        defaultValue: createAtaPdaValueNode('merchant', 'mint')
      },

      // For clearPayment instruction
      {
        instruction: 'clearPayment',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('operatorAuthority')
      },
      {
        instruction: 'clearPayment',
        account: 'merchantEscrowAta',
        defaultValue: createAtaPdaValueNode('merchant', 'mint')
      },
      {
        instruction: 'clearPayment',
        account: 'operatorSettlementAta',
        defaultValue: createAtaPdaValueNode('operatorAuthority', 'mint')
      },

      // note: we cannot derive merchantSettlementAta because the settlement wallet is not in the instruction accounts

      // For chargebackPayment instruction
      {
        instruction: 'chargebackPayment',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('operatorAuthority')
      },
      {
        instruction: 'chargebackPayment',
        account: 'buyerAta',
        defaultValue: createAtaPdaValueNode('buyer', 'mint')
      },
      {
        instruction: 'chargebackPayment',
        account: 'merchantEscrowAta',
        defaultValue: createAtaPdaValueNode('merchant', 'mint')
      },

      // For closePayment instruction
      {
        instruction: 'closePayment',
        account: 'operator',
        defaultValue: createOperatorPdaValueNode('operatorAuthority')
      }
    ])
  );

  // Add remaining accounts for initializeMerchantOperatorConfig instruction
  commerceCodama.update(
    codama.bottomUpTransformerVisitor([
      {
        select: "[instructionNode]initializeMerchantOperatorConfig",
        transform: (node) => {
          codama.assertIsNode(node, "instructionNode");
          
          // Add remaining accounts that point to the acceptedCurrencies argument
          return {
            ...node,
            remainingAccounts: [
              instructionRemainingAccountsNode(
                argumentValueNode('acceptedCurrencies'),
                {
                  docs: ['The mint accounts for each accepted currency'],
                  isOptional: false,
                  isSigner: false,
                  isWritable: false,
                }
              )
            ]
          };
        },
      },
    ]),
  );

  return commerceCodama;
}