import path from "path";
import * as renderers from "@codama/renderers";
import { preserveConfigFiles } from './lib/utils';
import { createCommerceCodamaBuilder } from './lib/commerce-codama-builder';
import { renderVisitor as renderRustVisitor } from '@codama/renderers-rust';

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

// Create and configure the codama instance using the builder pattern
const commerceCodama = createCommerceCodamaBuilder(commerceIdl)
  .appendAccountDiscriminator()
  .setDefaultAccountValues()
  .appendPdaDerivers()
  .setInstructionAccountDefaultValues()
  .appendMOConfigRemainingAccounts()
  .build();

// Preserve configuration files during generation
const configPreserver = preserveConfigFiles(typescriptClientsDir, rustClientsDir);

// Generate Rust client
commerceCodama.accept(
  renderRustVisitor(path.join(rustClientsDir, "src", "generated"), {
    formatCode: false,
    crateFolder: rustClientsDir,
    deleteFolderBeforeRendering: false,
  }),
);

// Generate TypeScript client
commerceCodama.accept(
  renderers.renderJavaScriptVisitor(
    path.join(typescriptClientsDir, "src", "generated"),
    {
      formatCode: true,
      deleteFolderBeforeRendering: false,
    },
  ),
);

// Restore configuration files after generation
configPreserver.restore();