import * as codama from "codama";
import {
  TOKEN_PROGRAM_ID,
  ATA_PROGRAM_ID,
  COMMERCE_PROGRAM_ID,
  MERCHANT_SEED,
  OPERATOR_SEED,
  MERCHANT_OPERATOR_CONFIG_SEED,
  PAYMENT_SEED,
} from './constants';

const {
  constantPdaSeedNode,
  variablePdaSeedNode,
  publicKeyTypeNode,
  stringTypeNode,
  stringValueNode,
  numberTypeNode,
  publicKeyValueNode,
  pdaValueNode,
  pdaSeedValueNode,
  accountValueNode,
  pdaNode,
  argumentValueNode,
} = codama;

interface PdaConfig {
  name: string;
  seeds: codama.PdaSeedNode[];
  programId: string;
  seedValues: codama.PdaSeedValueNode[];
}

// Generic PDA value node creator
export function createPdaValueNode(config: PdaConfig): codama.PdaValueNode {
  const { name, seeds, programId, seedValues } = config;
  
  return pdaValueNode(
    pdaNode({
      name,
      seeds,
      programId,
    }),
    seedValues
  );
}

// Helper function to create ATA PDA value node
export function createAtaPdaValueNode(ownerAccount: string, mintAccount: string): codama.PdaValueNode {
  return createPdaValueNode({
    name: 'associatedTokenAccount',
    seeds: [
      variablePdaSeedNode('owner', publicKeyTypeNode()),
      constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode(TOKEN_PROGRAM_ID)),
      variablePdaSeedNode('mint', publicKeyTypeNode()),
    ],
    programId: ATA_PROGRAM_ID,
    seedValues: [
      pdaSeedValueNode('owner', accountValueNode(ownerAccount)),
      pdaSeedValueNode('mint', accountValueNode(mintAccount)),
    ]
  });
}

// Helper function to create merchant PDA value node
export function createMerchantPdaValueNode(ownerAccount: string): codama.PdaValueNode {
  return createPdaValueNode({
    name: 'merchant',
    seeds: [
      constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(MERCHANT_SEED)),
      variablePdaSeedNode('owner', publicKeyTypeNode()),
    ],
    programId: COMMERCE_PROGRAM_ID,
    seedValues: [
      pdaSeedValueNode('owner', accountValueNode(ownerAccount)),
    ]
  });
}

// Helper function to create operator PDA value node
export function createOperatorPdaValueNode(ownerAccount: string): codama.PdaValueNode {
  return createPdaValueNode({
    name: 'operator',
    seeds: [
      constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(OPERATOR_SEED)),
      variablePdaSeedNode('owner', publicKeyTypeNode()),
    ],
    programId: COMMERCE_PROGRAM_ID,
    seedValues: [
      pdaSeedValueNode('owner', accountValueNode(ownerAccount)),
    ]
  });
}

// Helper function to create merchantOperatorConfig PDA value node
export function createMerchantOperatorConfigPdaValueNode(merchantAccount: string, operatorAccount: string): codama.PdaValueNode {
  return createPdaValueNode({
    name: 'merchantOperatorConfig',
    seeds: [
      constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(MERCHANT_OPERATOR_CONFIG_SEED)),
      variablePdaSeedNode('merchant', publicKeyTypeNode()),
      variablePdaSeedNode('operator', publicKeyTypeNode()),
      variablePdaSeedNode('version', numberTypeNode('u32')),
    ],
    programId: COMMERCE_PROGRAM_ID,
    seedValues: [
      pdaSeedValueNode('merchant', accountValueNode(merchantAccount)),
      pdaSeedValueNode('operator', accountValueNode(operatorAccount)),
      pdaSeedValueNode('version', argumentValueNode('version')),
    ]
  });
}

// Helper function to create payment PDA value node
export function createPaymentPdaValueNode(
  merchantOperatorConfigAccount: string, 
  buyerAccount: string, 
  mintAccount: string
): codama.PdaValueNode {
  return createPdaValueNode({
    name: 'payment',
    seeds: [
      constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode(PAYMENT_SEED)),
      variablePdaSeedNode('merchantOperatorConfig', publicKeyTypeNode()),
      variablePdaSeedNode('buyer', publicKeyTypeNode()),
      variablePdaSeedNode('mint', publicKeyTypeNode()),
      variablePdaSeedNode('orderId', numberTypeNode('u32')),
    ],
    programId: COMMERCE_PROGRAM_ID,
    seedValues: [
      pdaSeedValueNode('merchantOperatorConfig', accountValueNode(merchantOperatorConfigAccount)),
      pdaSeedValueNode('buyer', accountValueNode(buyerAccount)),
      pdaSeedValueNode('mint', accountValueNode(mintAccount)),
      pdaSeedValueNode('orderId', argumentValueNode('orderId')),
    ]
  });
}