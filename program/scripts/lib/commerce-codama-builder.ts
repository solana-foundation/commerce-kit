import * as codama from "codama";
import { AnchorIdl, rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import {
  appendAccountDiscriminator,
  setDefaultAccountValues,
  appendPdaDerivers,
  setInstructionAccountDefaultValues,
  appendMOConfigRemainingAccounts,
} from "./updates";

export class CommerceCodamaBuilder {
  private codama: codama.Codama;

  constructor(commerceIdl: AnchorIdl) {
    this.codama = codama.createFromRoot(rootNodeFromAnchor(commerceIdl));
  }

  appendAccountDiscriminator(): this {
    this.codama = appendAccountDiscriminator(this.codama);
    return this;
  }

  setDefaultAccountValues(): this {
    this.codama = setDefaultAccountValues(this.codama);
    return this;
  }

  appendPdaDerivers(): this {
    this.codama = appendPdaDerivers(this.codama);
    return this;
  }

  setInstructionAccountDefaultValues(): this {
    this.codama = setInstructionAccountDefaultValues(this.codama);
    return this;
  }

  appendMOConfigRemainingAccounts(): this {
    this.codama = appendMOConfigRemainingAccounts(this.codama);
    return this;
  }

  build(): codama.Codama {
    return this.codama;
  }
}

export function createCommerceCodamaBuilder(commerceIdl: AnchorIdl): CommerceCodamaBuilder {
  return new CommerceCodamaBuilder(commerceIdl);
}