import { describe, expect, it, vi, beforeEach } from "vitest";

// Interfaces for type safety
interface ClarityResponse<T> {
  ok: boolean;
  value: T | number; // number for error codes
}

interface ItemRecord {
  owner: string;
  registrationTimestamp: number;
  originHash: string;
  serialNumber: string;
  title: string;
  description: string;
  initialCondition: string;
}

interface VersionRecord {
  updatedHash: string;
  updateNotes: string;
  timestamp: number;
  updater: string;
}

interface CategoryRecord {
  category: string;
  tags: string[];
}

interface CollaboratorRecord {
  role: string;
  permissions: string[];
  addedAt: number;
  addedBy: string;
}

interface StatusRecord {
  status: string;
  visibility: boolean;
  lastUpdated: number;
  updater: string;
}

interface WarrantyRecord {
  issuer: string;
  expiry: number;
  terms: string;
  active: boolean;
  issuedAt: number;
}

interface ContractState {
  items: Map<string, ItemRecord>;
  versions: Map<string, VersionRecord>;
  categories: Map<string, CategoryRecord>;
  collaborators: Map<string, CollaboratorRecord>;
  statuses: Map<string, StatusRecord>;
  warranties: Map<string, WarrantyRecord>;
  blockHeight: number;
}

// Mock contract implementation
class ItemRegistryMock {
  private state: ContractState = {
    items: new Map(),
    versions: new Map(),
    categories: new Map(),
    collaborators: new Map(),
    statuses: new Map(),
    warranties: new Map(),
    blockHeight: 100,
  };

  private ERR_ALREADY_REGISTERED = 1;
  private ERR_NOT_OWNER = 2;
  private ERR_INVALID_HASH = 3;
  private ERR_INVALID_INPUT = 4;
  private ERR_NOT_FOUND = 5;
  private ERR_MAX_LENGTH_EXCEEDED = 6;
  private ERR_UNAUTHORIZED = 7;
  private ERR_INVALID_WARRANTY = 8;
  private MAX_TITLE_LEN = 100;
  private MAX_DESC_LEN = 500;
  private MAX_CONDITION_LEN = 200;
  private MAX_CATEGORY_LEN = 50;
  private MAX_TAG_LEN = 20;
  private MAX_TAGS = 10;
  private MAX_NOTES_LEN = 200;
  private MAX_ROLE_LEN = 50;
  private MAX_PERMS = 5;
  private MAX_PERM_LEN = 20;
  private MAX_STATUS_LEN = 20;
  private MAX_WARRANTY_TERMS_LEN = 200;

  private isValidString(s: string, maxLen: number): boolean {
    return s.length > 0 && s.length <= maxLen;
  }

  private isValidHash(h: string): boolean {
    return h.length === 64; // Simulating 32-byte hash as hex string
  }

  private isOwner(itemHash: string, caller: string): boolean {
    const item = this.state.items.get(itemHash);
    return !!item && item.owner === caller;
  }

  registerItem(
    caller: string,
    itemHash: string,
    originHash: string,
    serialNumber: string,
    title: string,
    description: string,
    initialCondition: string
  ): ClarityResponse<boolean> {
    if (this.state.items.has(itemHash)) {
      return { ok: false, value: this.ERR_ALREADY_REGISTERED };
    }
    if (
      !this.isValidHash(itemHash) ||
      !this.isValidHash(originHash) ||
      !this.isValidString(serialNumber, 50) ||
      !this.isValidString(title, this.MAX_TITLE_LEN) ||
      !this.isValidString(description, this.MAX_DESC_LEN) ||
      !this.isValidString(initialCondition, this.MAX_CONDITION_LEN)
    ) {
      return { ok: false, value: this.ERR_INVALID_INPUT };
    }
    this.state.items.set(itemHash, {
      owner: caller,
      registrationTimestamp: this.state.blockHeight,
      originHash,
      serialNumber,
      title,
      description,
      initialCondition,
    });
    return { ok: true, value: true };
  }

  addItemVersion(
    caller: string,
    itemHash: string,
    version: number,
    updatedHash: string,
    updateNotes: string
  ): ClarityResponse<boolean> {
    const item = this.state.items.get(itemHash);
    if (!item) {
      return { ok: false, value: this.ERR_NOT_FOUND };
    }
    if (!this.isOwner(itemHash, caller)) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (!this.isValidHash(updatedHash) || !this.isValidString(updateNotes, this.MAX_NOTES_LEN)) {
      return { ok: false, value: this.ERR_INVALID_INPUT };
    }
    this.state.versions.set(`${itemHash}-${version}`, {
      updatedHash,
      updateNotes,
      timestamp: this.state.blockHeight,
      updater: caller,
    });
    return { ok: true, value: true };
  }

  addItemCategory(
    caller: string,
    itemHash: string,
    category: string,
    tags: string[]
  ): ClarityResponse<boolean> {
    const item = this.state.items.get(itemHash);
    if (!item) {
      return { ok: false, value: this.ERR_NOT_FOUND };
    }
    if (!this.isOwner(itemHash, caller)) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (
      !this.isValidString(category, this.MAX_CATEGORY_LEN) ||
      tags.length > this.MAX_TAGS ||
      tags.some(tag => !this.isValidString(tag, this.MAX_TAG_LEN) || tag === "")
    ) {
      return { ok: false, value: this.ERR_INVALID_INPUT };
    }
    this.state.categories.set(itemHash, { category, tags });
    return { ok: true, value: true };
  }

  addCollaborator(
    caller: string,
    itemHash: string,
    collaborator: string,
    role: string,
    permissions: string[]
  ): ClarityResponse<boolean> {
    const item = this.state.items.get(itemHash);
    if (!item) {
      return { ok: false, value: this.ERR_NOT_FOUND };
    }
    if (!this.isOwner(itemHash, caller)) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (
      !this.isValidString(role, this.MAX_ROLE_LEN) ||
      permissions.length > this.MAX_PERMS ||
      permissions.some(perm => !this.isValidString(perm, this.MAX_PERM_LEN) || perm === "")
    ) {
      return { ok: false, value: this.ERR_INVALID_INPUT };
    }
    this.state.collaborators.set(`${itemHash}-${collaborator}`, {
      role,
      permissions,
      addedAt: this.state.blockHeight,
      addedBy: caller,
    });
    return { ok: true, value: true };
  }

  updateItemStatus(
    caller: string,
    itemHash: string,
    status: string,
    visibility: boolean
  ): ClarityResponse<boolean> {
    const item = this.state.items.get(itemHash);
    if (!item) {
      return { ok: false, value: this.ERR_NOT_FOUND };
    }
    if (!this.isOwner(itemHash, caller)) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (!this.isValidString(status, this.MAX_STATUS_LEN)) {
      return { ok: false, value: this.ERR_INVALID_INPUT };
    }
    this.state.statuses.set(itemHash, {
      status,
      visibility,
      lastUpdated: this.state.blockHeight,
      updater: caller,
    });
    return { ok: true, value: true };
  }

  registerWarranty(
    caller: string,
    itemHash: string,
    warrantyId: number,
    expiry: number,
    terms: string
  ): ClarityResponse<boolean> {
    const item = this.state.items.get(itemHash);
    if (!item) {
      return { ok: false, value: this.ERR_NOT_FOUND };
    }
    if (!this.isOwner(itemHash, caller)) {
      return { ok: false, value: this.ERR_NOT_OWNER };
    }
    if (expiry <= this.state.blockHeight || !this.isValidString(terms, this.MAX_WARRANTY_TERMS_LEN)) {
      return { ok: false, value: this.ERR_INVALID_WARRANTY };
    }
    this.state.warranties.set(`${itemHash}-${warrantyId}`, {
      issuer: caller,
      expiry,
      terms,
      active: true,
      issuedAt: this.state.blockHeight,
    });
    return { ok: true, value: true };
  }

  getItemDetails(itemHash: string): ClarityResponse<ItemRecord | null> {
    return { ok: true, value: this.state.items.get(itemHash) ?? null };
  }

  verifyItemOwnership(itemHash: string, owner: string): ClarityResponse<boolean> {
    const item = this.state.items.get(itemHash);
    if (item && item.owner === owner) {
      return { ok: true, value: true };
    }
    return { ok: false, value: this.ERR_NOT_OWNER };
  }

  getItemVersion(itemHash: string, version: number): ClarityResponse<VersionRecord | null> {
    return { ok: true, value: this.state.versions.get(`${itemHash}-${version}`) ?? null };
  }

  getItemCategory(itemHash: string): ClarityResponse<CategoryRecord | null> {
    return { ok: true, value: this.state.categories.get(itemHash) ?? null };
  }

  getCollaboratorDetails(itemHash: string, collaborator: string): ClarityResponse<CollaboratorRecord | null> {
    return { ok: true, value: this.state.collaborators.get(`${itemHash}-${collaborator}`) ?? null };
  }

  getItemStatus(itemHash: string): ClarityResponse<StatusRecord | null> {
    return { ok: true, value: this.state.statuses.get(itemHash) ?? null };
  }

  getWarrantyDetails(itemHash: string, warrantyId: number): ClarityResponse<WarrantyRecord | null> {
    return { ok: true, value: this.state.warranties.get(`${itemHash}-${warrantyId}`) ?? null };
  }
}

// Test setup
const accounts = {
  deployer: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  owner: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  unauthorized: "ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA",
};

describe("ItemRegistry Contract", () => {
  let contract: ItemRegistryMock;

  beforeEach(() => {
    contract = new ItemRegistryMock();
    vi.resetAllMocks();
  });

  const validItemHash = "a".repeat(64);
  const validOriginHash = "b".repeat(64);
  const validSerialNumber = "SN12345";
  const validTitle = "Used Laptop";
  const validDescription = "High-performance laptop, slightly used.";
  const validCondition = "Good condition, minor scratches.";

  it("should register a new item successfully", () => {
    const result = contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    expect(result).toEqual({ ok: true, value: true });

    const item = contract.getItemDetails(validItemHash);
    expect(item).toEqual({
      ok: true,
      value: expect.objectContaining({
        owner: accounts.owner,
        serialNumber: validSerialNumber,
        title: validTitle,
        description: validDescription,
        initialCondition: validCondition,
      }),
    });
  });

  it("should prevent duplicate item registration", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    expect(result).toEqual({ ok: false, value: 1 });
  });

  it("should reject invalid inputs for item registration", () => {
    const result = contract.registerItem(
      accounts.owner,
      "invalid", // Invalid hash
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    expect(result).toEqual({ ok: false, value: 4 });
  });

  it("should add a new item version successfully", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.addItemVersion(
      accounts.owner,
      validItemHash,
      1,
      validOriginHash,
      "Repaired screen"
    );
    expect(result).toEqual({ ok: true, value: true });

    const version = contract.getItemVersion(validItemHash, 1);
    expect(version).toEqual({
      ok: true,
      value: expect.objectContaining({
        updateNotes: "Repaired screen",
        updater: accounts.owner,
      }),
    });
  });

  it("should prevent non-owner from adding item version", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.addItemVersion(
      accounts.unauthorized,
      validItemHash,
      1,
      validOriginHash,
      "Repaired screen"
    );
    expect(result).toEqual({ ok: false, value: 2 });
  });

  it("should add item category successfully", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.addItemCategory(
      accounts.owner,
      validItemHash,
      "Electronics",
      ["laptop", "used"]
    );
    expect(result).toEqual({ ok: true, value: true });

    const category = contract.getItemCategory(validItemHash);
    expect(category).toEqual({
      ok: true,
      value: { category: "Electronics", tags: ["laptop", "used"] },
    });
  });

  it("should add collaborator successfully", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.addCollaborator(
      accounts.owner,
      validItemHash,
      accounts.deployer,
      "Inspector",
      ["verify", "report"]
    );
    expect(result).toEqual({ ok: true, value: true });

    const collaborator = contract.getCollaboratorDetails(validItemHash, accounts.deployer);
    expect(collaborator).toEqual({
      ok: true,
      value: expect.objectContaining({
        role: "Inspector",
        permissions: ["verify", "report"],
        addedBy: accounts.owner,
      }),
    });
  });

  it("should update item status successfully", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.updateItemStatus(
      accounts.owner,
      validItemHash,
      "available",
      true
    );
    expect(result).toEqual({ ok: true, value: true });

    const status = contract.getItemStatus(validItemHash);
    expect(status).toEqual({
      ok: true,
      value: expect.objectContaining({
        status: "available",
        visibility: true,
        updater: accounts.owner,
      }),
    });
  });

  it("should register warranty successfully", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.registerWarranty(
      accounts.owner,
      validItemHash,
      1,
      200,
      "1-year warranty"
    );
    expect(result).toEqual({ ok: true, value: true });

    const warranty = contract.getWarrantyDetails(validItemHash, 1);
    expect(warranty).toEqual({
      ok: true,
      value: expect.objectContaining({
        issuer: accounts.owner,
        terms: "1-year warranty",
        active: true,
      }),
    });
  });

  it("should prevent invalid warranty registration", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.registerWarranty(
      accounts.owner,
      validItemHash,
      1,
      50, // Invalid: expiry in past
      "1-year warranty"
    );
    expect(result).toEqual({ ok: false, value: 8 });
  });

  it("should verify item ownership correctly", () => {
    contract.registerItem(
      accounts.owner,
      validItemHash,
      validOriginHash,
      validSerialNumber,
      validTitle,
      validDescription,
      validCondition
    );
    const result = contract.verifyItemOwnership(validItemHash, accounts.owner);
    expect(result).toEqual({ ok: true, value: true });

    const invalidResult = contract.verifyItemOwnership(validItemHash, accounts.unauthorized);
    expect(invalidResult).toEqual({ ok: false, value: 2 });
  });
});