import { expect } from "chai";
import { ethers } from "hardhat";
import { ConsentAudit } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConsentAudit", function () {
  let consentAudit: ConsentAudit;
  let owner: SignerWithAddress;
  let patient: SignerWithAddress;
  let provider: SignerWithAddress;
  let otherProvider: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const resourceType = "Patient";
  const resourceId = "patient-123";
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("consent-payload"));

  beforeEach(async function () {
    [owner, patient, provider, otherProvider, unauthorized] = await ethers.getSigners();
    
    const ConsentAudit = await ethers.getContractFactory("ConsentAudit");
    consentAudit = await ConsentAudit.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await consentAudit.owner()).to.equal(owner.address);
    });

    it("Should have correct initial stats", async function () {
      const stats = await consentAudit.getStats();
      expect(stats.totalConsents_).to.equal(0);
      expect(stats.totalAccessLogs_).to.equal(0);
      expect(stats.consentExpiryDays_).to.equal(365);
    });
  });

  describe("Consent Management", function () {
    it("Should grant consent successfully", async function () {
      await expect(
        consentAudit.connect(provider).grantConsent(
          patient.address,
          resourceType,
          resourceId,
          payloadHash
        )
      ).to.emit(consentAudit, "ConsentGranted")
        .withArgs(
          patient.address,
          provider.address,
          await consentAudit.consents(0),
          await ethers.provider.getBlockNumber(),
          resourceType,
          resourceId
        );

      const stats = await consentAudit.getStats();
      expect(stats.totalConsents_).to.equal(1);
    });

    it("Should not allow granting consent with invalid parameters", async function () {
      await expect(
        consentAudit.connect(provider).grantConsent(
          ethers.ZeroAddress,
          resourceType,
          resourceId,
          payloadHash
        )
      ).to.be.revertedWith("Invalid patient address");

      await expect(
        consentAudit.connect(provider).grantConsent(
          patient.address,
          "",
          resourceId,
          payloadHash
        )
      ).to.be.revertedWith("Resource type cannot be empty");

      await expect(
        consentAudit.connect(provider).grantConsent(
          patient.address,
          resourceType,
          "",
          payloadHash
        )
      ).to.be.revertedWith("Resource ID cannot be empty");
    });

    it("Should not allow duplicate consent", async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );

      await expect(
        consentAudit.connect(provider).grantConsent(
          patient.address,
          resourceType,
          resourceId,
          payloadHash
        )
      ).to.be.revertedWith("Consent already exists");
    });
  });

  describe("Consent Validation", function () {
    let consentHash: string;

    beforeEach(async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );
      
      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      consentHash = patientConsents[0];
    });

    it("Should validate active consent", async function () {
      const isValid = await consentAudit.checkConsent(
        consentHash,
        resourceType,
        resourceId
      );
      expect(isValid).to.be.true;
    });

    it("Should reject invalid resource type", async function () {
      const isValid = await consentAudit.checkConsent(
        consentHash,
        "Observation",
        resourceId
      );
      expect(isValid).to.be.false;
    });

    it("Should reject invalid resource ID", async function () {
      const isValid = await consentAudit.checkConsent(
        consentHash,
        resourceType,
        "different-id"
      );
      expect(isValid).to.be.false;
    });

    it("Should reject non-existent consent", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const isValid = await consentAudit.checkConsent(
        fakeHash,
        resourceType,
        resourceId
      );
      expect(isValid).to.be.false;
    });
  });

  describe("Access Logging", function () {
    let consentHash: string;

    beforeEach(async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );
      
      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      consentHash = patientConsents[0];
    });

    it("Should log access successfully", async function () {
      await expect(
        consentAudit.connect(provider).logAccess(
          consentHash,
          resourceType,
          resourceId,
          "read"
        )
      ).to.emit(consentAudit, "AccessLogged")
        .withArgs(
          provider.address,
          consentHash,
          await ethers.provider.getBlockNumber(),
          resourceType,
          resourceId,
          "read"
        );

      const stats = await consentAudit.getStats();
      expect(stats.totalAccessLogs_).to.equal(1);
    });

    it("Should not allow unauthorized access logging", async function () {
      await expect(
        consentAudit.connect(unauthorized).logAccess(
          consentHash,
          resourceType,
          resourceId,
          "read"
        )
      ).to.be.revertedWith("Only consent provider can log access");
    });

    it("Should not log access for revoked consent", async function () {
      await consentAudit.connect(patient).revokeConsent(consentHash);

      await expect(
        consentAudit.connect(provider).logAccess(
          consentHash,
          resourceType,
          resourceId,
          "read"
        )
      ).to.be.revertedWith("Consent is not active");
    });
  });

  describe("Consent Revocation", function () {
    let consentHash: string;

    beforeEach(async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );
      
      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      consentHash = patientConsents[0];
    });

    it("Should allow patient to revoke consent", async function () {
      await expect(
        consentAudit.connect(patient).revokeConsent(consentHash)
      ).to.emit(consentAudit, "ConsentRevoked")
        .withArgs(
          patient.address,
          provider.address,
          consentHash,
          await ethers.provider.getBlockNumber()
        );

      const consent = await consentAudit.getConsent(consentHash);
      expect(consent.isRevoked).to.be.true;
      expect(consent.isActive).to.be.false;
    });

    it("Should allow provider to revoke consent", async function () {
      await expect(
        consentAudit.connect(provider).revokeConsent(consentHash)
      ).to.emit(consentAudit, "ConsentRevoked");

      const consent = await consentAudit.getConsent(consentHash);
      expect(consent.isRevoked).to.be.true;
      expect(consent.isActive).to.be.false;
    });

    it("Should not allow unauthorized revocation", async function () {
      await expect(
        consentAudit.connect(unauthorized).revokeConsent(consentHash)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Consent Queries", function () {
    let consentHash: string;

    beforeEach(async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );
      
      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      consentHash = patientConsents[0];
    });

    it("Should return correct consent details", async function () {
      const consent = await consentAudit.getConsent(consentHash);
      expect(consent.patient).to.equal(patient.address);
      expect(consent.provider).to.equal(provider.address);
      expect(consent.resourceType).to.equal(resourceType);
      expect(consent.resourceId).to.equal(resourceId);
      expect(consent.isActive).to.be.true;
      expect(consent.isRevoked).to.be.false;
    });

    it("Should return patient consents", async function () {
      const consents = await consentAudit.getPatientConsents(patient.address);
      expect(consents).to.have.lengthOf(1);
      expect(consents[0]).to.equal(consentHash);
    });

    it("Should return provider consents", async function () {
      const consents = await consentAudit.getProviderConsents(provider.address);
      expect(consents).to.have.lengthOf(1);
      expect(consents[0]).to.equal(consentHash);
    });

    it("Should return access logs", async function () {
      await consentAudit.connect(provider).logAccess(
        consentHash,
        resourceType,
        resourceId,
        "read"
      );

      const logs = await consentAudit.getAccessLogs(consentHash);
      expect(logs).to.have.lengthOf(1);
      expect(logs[0].provider).to.equal(provider.address);
      expect(logs[0].accessType).to.equal("read");
    });
  });

  describe("Consent Expiry", function () {
    it("Should check consent expiry correctly", async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );
      
      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      const consentHash = patientConsents[0];

      const isExpired = await consentAudit.isConsentExpired(consentHash);
      expect(isExpired).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set consent expiry days", async function () {
      await consentAudit.setConsentExpiryDays(180);
      
      const stats = await consentAudit.getStats();
      expect(stats.consentExpiryDays_).to.equal(180);
    });

    it("Should not allow non-owner to set consent expiry days", async function () {
      await expect(
        consentAudit.connect(unauthorized).setConsentExpiryDays(180)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow setting invalid expiry days", async function () {
      await expect(
        consentAudit.setConsentExpiryDays(0)
      ).to.be.revertedWith("Expiry days must be positive");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple consents for same patient", async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        "Patient",
        "patient-1",
        payloadHash
      );

      await consentAudit.connect(provider).grantConsent(
        patient.address,
        "Observation",
        "obs-1",
        payloadHash
      );

      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      expect(patientConsents).to.have.lengthOf(2);

      const stats = await consentAudit.getStats();
      expect(stats.totalConsents_).to.equal(2);
    });

    it("Should handle multiple providers for same patient", async function () {
      await consentAudit.connect(provider).grantConsent(
        patient.address,
        resourceType,
        resourceId,
        payloadHash
      );

      await consentAudit.connect(otherProvider).grantConsent(
        patient.address,
        "Observation",
        "obs-1",
        payloadHash
      );

      const patientConsents = await consentAudit.getPatientConsents(patient.address);
      expect(patientConsents).to.have.lengthOf(2);

      const provider1Consents = await consentAudit.getProviderConsents(provider.address);
      const provider2Consents = await consentAudit.getProviderConsents(otherProvider.address);
      
      expect(provider1Consents).to.have.lengthOf(1);
      expect(provider2Consents).to.have.lengthOf(1);
    });
  });
}); 