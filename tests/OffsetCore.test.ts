import { describe, it, expect, beforeEach } from "vitest";
import { bufferCV, stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TRIP_HASH = 101;
const ERR_INVALID_EMISSIONS = 102;
const ERR_INVALID_PROJECT_ID = 103;
const ERR_INVALID_PAYMENT = 104;
const ERR_PROJECT_NOT_REGISTERED = 105;
const ERR_OFFSET_ALREADY_EXISTS = 106;
const ERR_OFFSET_NOT_FOUND = 107;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_INVALID_MIN_OFFSET = 110;
const ERR_INVALID_MAX_OFFSET = 111;
const ERR_MAX_OFFSETS_EXCEEDED = 114;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_INVALID_OFFSET_TYPE = 115;
const ERR_INVALID_VERIFICATION_LEVEL = 116;
const ERR_INVALID_LOCATION = 117;
const ERR_INVALID_CURRENCY = 118;
const ERR_INVALID_DURATION = 124;
const ERR_INVALID_CATEGORY = 125;
const ERR_NFT_MINT_FAILED = 122;

interface Offset {
  traveler: string;
  tripHash: Buffer;
  emissions: number;
  projectId: number;
  paymentAmount: number;
  timestamp: number;
  offsetType: string;
  verificationLevel: number;
  location: string;
  currency: string;
  status: boolean;
  minOffset: number;
  maxOffset: number;
  duration: number;
  category: string;
}

interface OffsetUpdate {
  updateEmissions: number;
  updatePaymentAmount: number;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class OffsetCoreMock {
  state: {
    nextOffsetId: number;
    maxOffsets: number;
    offsetFee: number;
    authorityContract: string | null;
    nftContract: string | null;
    projectRegistryContract: string | null;
    offsets: Map<number, Offset>;
    offsetUpdates: Map<number, OffsetUpdate>;
    offsetsByHash: Map<string, number>;
  } = {
    nextOffsetId: 0,
    maxOffsets: 10000,
    offsetFee: 500,
    authorityContract: null,
    nftContract: null,
    projectRegistryContract: null,
    offsets: new Map(),
    offsetUpdates: new Map(),
    offsetsByHash: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];
  mintCalls: Array<{ recipient: string; id: number; emissions: number }> = [];
  projectChecks: Map<number, number> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextOffsetId: 0,
      maxOffsets: 10000,
      offsetFee: 500,
      authorityContract: null,
      nftContract: null,
      projectRegistryContract: null,
      offsets: new Map(),
      offsetUpdates: new Map(),
      offsetsByHash: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
    this.mintCalls = [];
    this.projectChecks = new Map();
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setNftContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.nftContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setProjectRegistryContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.projectRegistryContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setOffsetFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.offsetFee = newFee;
    return { ok: true, value: true };
  }

  offsetTrip(
    tripHash: Buffer,
    emissions: number,
    projectId: number,
    paymentAmount: number,
    offsetType: string,
    verificationLevel: number,
    location: string,
    currency: string,
    minOffset: number,
    maxOffset: number,
    duration: number,
    category: string
  ): Result<number> {
    if (this.state.nextOffsetId >= this.state.maxOffsets) return { ok: false, value: ERR_MAX_OFFSETS_EXCEEDED };
    if (tripHash.length !== 32) return { ok: false, value: ERR_INVALID_TRIP_HASH };
    if (emissions <= 0) return { ok: false, value: ERR_INVALID_EMISSIONS };
    if (projectId <= 0) return { ok: false, value: ERR_INVALID_PROJECT_ID };
    if (paymentAmount <= 0) return { ok: false, value: ERR_INVALID_PAYMENT };
    if (!["flight", "drive", "hotel"].includes(offsetType)) return { ok: false, value: ERR_INVALID_OFFSET_TYPE };
    if (verificationLevel > 3) return { ok: false, value: ERR_INVALID_VERIFICATION_LEVEL };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["STX", "sSTX"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (minOffset <= 0) return { ok: false, value: ERR_INVALID_MIN_OFFSET };
    if (maxOffset <= 0) return { ok: false, value: ERR_INVALID_MAX_OFFSET };
    if (duration <= 0) return { ok: false, value: ERR_INVALID_DURATION };
    if (!["carbon", "renewable", "reforest"].includes(category)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (this.state.offsetsByHash.has(tripHash.toString("hex"))) return { ok: false, value: ERR_OFFSET_ALREADY_EXISTS };
    if (!this.state.projectRegistryContract) return { ok: false, value: ERR_PROJECT_NOT_REGISTERED };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    if (!this.state.nftContract) return { ok: false, value: ERR_NFT_MINT_FAILED };
    if (!this.projectChecks.has(projectId) || (this.projectChecks.get(projectId) ?? 0) < 0) return { ok: false, value: ERR_PROJECT_NOT_REGISTERED };

    this.stxTransfers.push({ amount: this.state.offsetFee, from: this.caller, to: this.state.authorityContract });
    this.mintCalls.push({ recipient: this.caller, id: this.state.nextOffsetId, emissions });

    const id = this.state.nextOffsetId;
    const offset: Offset = {
      traveler: this.caller,
      tripHash,
      emissions,
      projectId,
      paymentAmount,
      timestamp: this.blockHeight,
      offsetType,
      verificationLevel,
      location,
      currency,
      status: true,
      minOffset,
      maxOffset,
      duration,
      category,
    };
    this.state.offsets.set(id, offset);
    this.state.offsetsByHash.set(tripHash.toString("hex"), id);
    this.state.nextOffsetId++;
    return { ok: true, value: id };
  }

  getOffset(id: number): Offset | null {
    return this.state.offsets.get(id) || null;
  }

  updateOffset(id: number, updateEmissions: number, updatePaymentAmount: number): Result<boolean> {
    const offset = this.state.offsets.get(id);
    if (!offset) return { ok: false, value: false };
    if (offset.traveler !== this.caller) return { ok: false, value: false };
    if (updateEmissions <= 0) return { ok: false, value: false };
    if (updatePaymentAmount <= 0) return { ok: false, value: false };

    const updated: Offset = {
      ...offset,
      emissions: updateEmissions,
      paymentAmount: updatePaymentAmount,
      timestamp: this.blockHeight,
    };
    this.state.offsets.set(id, updated);
    this.state.offsetUpdates.set(id, {
      updateEmissions,
      updatePaymentAmount,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  checkOffsetStatus(id: number): Result<boolean> {
    const offset = this.state.offsets.get(id);
    if (!offset) return { ok: false, value: false };
    return { ok: true, value: offset.status };
  }

  getOffsetCount(): Result<number> {
    return { ok: true, value: this.state.nextOffsetId };
  }

  allocateFundsToProject(offsetId: number, projectId: number): Result<boolean> {
    const offset = this.state.offsets.get(offsetId);
    if (!offset) return { ok: false, value: false };
    if (offset.projectId !== projectId) return { ok: false, value: false };
    if (this.caller !== this.state.authorityContract) return { ok: false, value: false };
    this.stxTransfers.push({ amount: offset.paymentAmount, from: this.caller, to: offset.traveler });
    return { ok: true, value: true };
  }
}

describe("OffsetCore", () => {
  let contract: OffsetCoreMock;

  beforeEach(() => {
    contract = new OffsetCoreMock();
    contract.reset();
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });

  it("creates an offset successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    const result = contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const offset = contract.getOffset(0);
    expect(offset?.emissions).toBe(100);
    expect(offset?.projectId).toBe(1);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
    expect(contract.mintCalls).toEqual([{ recipient: "ST1TEST", id: 0, emissions: 100 }]);
  });

  it("rejects duplicate trip hash", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    const result = contract.offsetTrip(
      tripHash,
      200,
      2,
      1000,
      "drive",
      1,
      "RoadY",
      "sSTX",
      100,
      300,
      14,
      "renewable"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_OFFSET_ALREADY_EXISTS);
  });

  it("rejects invalid emissions", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    const result = contract.offsetTrip(
      tripHash,
      0,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_EMISSIONS);
  });

  it("updates an offset successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    const result = contract.updateOffset(0, 150, 750);
    expect(result.ok).toBe(true);
    const offset = contract.getOffset(0);
    expect(offset?.emissions).toBe(150);
    expect(offset?.paymentAmount).toBe(750);
    const update = contract.state.offsetUpdates.get(0);
    expect(update?.updateEmissions).toBe(150);
    expect(update?.updatePaymentAmount).toBe(750);
  });

  it("rejects update for non-existent offset", () => {
    const result = contract.updateOffset(99, 150, 750);
    expect(result.ok).toBe(false);
  });

  it("rejects update by non-traveler", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    contract.caller = "ST3FAKE";
    const result = contract.updateOffset(0, 150, 750);
    expect(result.ok).toBe(false);
  });

  it("checks offset status correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    const result = contract.checkOffsetStatus(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
  });

  it("returns correct offset count", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash1 = Buffer.alloc(32, "trip1");
    const tripHash2 = Buffer.alloc(32, "trip2");
    contract.offsetTrip(
      tripHash1,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    contract.offsetTrip(
      tripHash2,
      200,
      1,
      1000,
      "drive",
      1,
      "RoadY",
      "sSTX",
      100,
      300,
      14,
      "renewable"
    );
    const result = contract.getOffsetCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("allocates funds to project successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    contract.caller = "ST2TEST";
    const result = contract.allocateFundsToProject(0, 1);
    expect(result.ok).toBe(true);
    expect(contract.stxTransfers[1]).toEqual({ amount: 500, from: "ST2TEST", to: "ST1TEST" });
  });

  it("rejects allocation by non-authority", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.setNftContract("ST3NFT");
    contract.setProjectRegistryContract("ST4REG");
    contract.projectChecks.set(1, 1);
    const tripHash = Buffer.alloc(32, "testtrip");
    contract.offsetTrip(
      tripHash,
      100,
      1,
      500,
      "flight",
      2,
      "AirportX",
      "STX",
      50,
      200,
      7,
      "carbon"
    );
    const result = contract.allocateFundsToProject(0, 1);
    expect(result.ok).toBe(false);
  });
});