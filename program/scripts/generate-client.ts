import path from "path";
import * as renderers from "@codama/renderers";
import { preserveConfigFiles } from './lib/utils';
import { createCommerceCodama } from './lib/codama-config';

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

// Create and configure the codama instance
const commerceCodama = createCommerceCodama(commerceIdl);

// Preserve configuration files during generation
const configPreserver = preserveConfigFiles(typescriptClientsDir, rustClientsDir);

// Generate Rust client
commerceCodama.accept(
  renderers.renderRustVisitor(path.join(rustClientsDir, "src", "generated"), {
    formatCode: true,
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