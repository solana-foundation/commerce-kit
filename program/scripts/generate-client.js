const codama = require("codama");
const anchorIdl = require("@codama/nodes-from-anchor");
const path = require("path");
const renderers = require("@codama/renderers");
const fs = require("fs");

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ATA_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const COMMERCE_PROGRAM_ID = 'commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';


// Event Authority PDA (computed from seeds: ["event_authority"] and program ID)
const EVENT_AUTHORITY_PDA = '3VSJP7faqLk6MbCaNtMYc2Y8S8hMXRsZ5cBcwh1fjMH1';

const projectRoot = path.join(__dirname, "..");
const idlDir = path.join(projectRoot, "idl");
const commerceIdl = require(path.join(idlDir, "commerce_program.json"));
const rustClientsDir = path.join(__dirname, "..", "clients", "rust");
const typescriptClientsDir = path.join(
  __dirname,
  "..",
  "clients",
  "typescript",
);

function preserveConfigFiles() {
  const filesToPreserve = ['package.json', 'tsconfig.json', '.npmignore', 'bun.lockb', 'Cargo.toml'];
  const preservedFiles = new Map();

  filesToPreserve.forEach(filename => {
    const filePath = path.join(typescriptClientsDir, filename);
    const tempPath = path.join(typescriptClientsDir, `${filename}.temp`);

    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, tempPath);
      preservedFiles.set(filename, tempPath);
    }
  });

  const rustCargoPath = path.join(rustClientsDir, 'Cargo.toml');
  const rustCargoTempPath = path.join(rustClientsDir, 'Cargo.toml.temp');

  if (fs.existsSync(rustCargoPath)) {
    fs.copyFileSync(rustCargoPath, rustCargoTempPath);
    preservedFiles.set('rust_cargo', rustCargoTempPath);
  }

  return {
    restore: () => {
      preservedFiles.forEach((tempPath, filename) => {
        if (filename === 'rust_cargo') {
          const filePath = path.join(rustClientsDir, 'Cargo.toml');
          if (fs.existsSync(tempPath)) {
            fs.copyFileSync(tempPath, filePath);
            fs.unlinkSync(tempPath);
          }
        } else {
          const filePath = path.join(typescriptClientsDir, filename);
          if (fs.existsSync(tempPath)) {
            fs.copyFileSync(tempPath, filePath);
            fs.unlinkSync(tempPath);
          }
        }
      });
    }
  };
}

const commerceCodama = codama.createFromRoot(anchorIdl.rootNodeFromAnchor(commerceIdl));
commerceCodama.update(
  codama.bottomUpTransformerVisitor([
    // add 1 byte discriminator for accounts
    {
      select: "[accountNode]",
      transform: (node) => {
        codama.assertIsNode(node, "accountNode");

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
      },
    },
  ]),
);

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

const { constantPdaSeedNode, variablePdaSeedNode, publicKeyTypeNode, stringTypeNode, stringValueNode, numberTypeNode, publicKeyValueNode } = codama;
// Add PDA derivers
commerceCodama.update(
  codama.addPdasVisitor({
    commerceProgram: [
      {
        name: 'merchant',
        seeds: [
          constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('merchant')),
          variablePdaSeedNode('owner', publicKeyTypeNode()),
        ],
      },
      {
        name: 'operator',
        seeds: [
          constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('operator')),
          variablePdaSeedNode('owner', publicKeyTypeNode()),
        ],
      },
      {
        name: 'merchantOperatorConfig',
        seeds: [
          constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('merchant_operator_config')),
          variablePdaSeedNode('merchant', publicKeyTypeNode()),
          variablePdaSeedNode('operator', publicKeyTypeNode()),
          variablePdaSeedNode('version', numberTypeNode('u32')),
        ],
      },
      {
        name: 'payment',
        seeds: [
          constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('payment')),
          variablePdaSeedNode('merchantOperatorConfig', publicKeyTypeNode()),
          variablePdaSeedNode('buyer', publicKeyTypeNode()),
          variablePdaSeedNode('mint', publicKeyTypeNode()),
          variablePdaSeedNode('orderId', numberTypeNode('u32')),
        ],
      },
      {
        name: 'eventAuthority',
        seeds: [
          constantPdaSeedNode(stringTypeNode('utf8'), stringValueNode('event_authority')),
        ],
      },
    ],
  }),
);

// Import additional helpers for ATA derivation
const { pdaValueNode, pdaSeedValueNode, accountValueNode, pdaNode } = codama;

// Helper function to create ATA PDA value node
const createAtaPdaValueNode = (ownerAccount, mintAccount) => {
  return pdaValueNode(
    pdaNode({
      name: 'associatedTokenAccount',
      seeds: [
        variablePdaSeedNode('owner', publicKeyTypeNode()),
        constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode(TOKEN_PROGRAM_ID)),
        variablePdaSeedNode('mint', publicKeyTypeNode()),
      ],
      programId: ATA_PROGRAM_ID,
    }),
    [
      pdaSeedValueNode('owner', accountValueNode(ownerAccount)),
      pdaSeedValueNode('mint', accountValueNode(mintAccount)),
    ]
  );
};

// Add a visitor to automatically derive ATAs in instructions
commerceCodama.update(
  codama.setInstructionAccountDefaultValuesVisitor([
    // For initializeMerchant instruction
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
    // For makePayment instruction - derive buyer and merchant ATAs
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
    // note: we cannot derive merchantSettlementAta because the settlement wallet is not in the instruction accounts

    // For refundPayment instruction
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
      account: 'buyerAta',
      defaultValue: createAtaPdaValueNode('buyer', 'mint')
    },
    {
      instruction: 'chargebackPayment',
      account: 'merchantEscrowAta',
      defaultValue: createAtaPdaValueNode('merchant', 'mint')
    }
  ])
);

const configPreserver = preserveConfigFiles();

commerceCodama.accept(
  renderers.renderRustVisitor(path.join(rustClientsDir, "src", "generated"), {
    formatCode: true,
    crateFolder: rustClientsDir,
    deleteFolderBeforeRendering: false,
  }),
);

commerceCodama.accept(
  renderers.renderJavaScriptVisitor(
    path.join(typescriptClientsDir, "src", "generated"),
    {
      formatCode: true,
      crateFolder: typescriptClientsDir,
      deleteFolderBeforeRendering: false,
    },
  ),
);

// Restore configuration files after generation
configPreserver.restore();
