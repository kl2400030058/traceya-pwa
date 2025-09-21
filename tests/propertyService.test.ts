import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { propertyService } from '../services/propertyService';
import { db } from '../lib/db';
import { auditLogService } from '../services/auditLogService';

// Mock the auditLogService
vi.mock('../services/auditLogService', () => ({
  auditLogService: {
    logAction: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('PropertyService', () => {
  beforeEach(async () => {
    // Clear the properties table before each test
    await db.properties.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const sampleProperty = {
    name: 'Test Property',
    description: 'A test property for unit tests',
    type: 'residential' as const,
    status: 'active' as const,
    location: {
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      coordinates: {
        lat: 40.7128,
        lon: -74.0060
      }
    },
    area: {
      value: 2000,
      unit: 'sqft' as const
    },
    owner: {
      id: 'test-owner-id',
      name: 'Test Owner',
      contactInfo: 'test@example.com'
    }
  };

  describe('createProperty', () => {
    it('should create a new property', async () => {
      const property = await propertyService.createProperty(sampleProperty);

      expect(property).toBeDefined();
      expect(property.id).toBeDefined();
      expect(property.propertyId).toBeDefined();
      expect(property.name).toBe(sampleProperty.name);
      expect(property.type).toBe(sampleProperty.type);
      expect(property.createdAt).toBeDefined();
      expect(property.updatedAt).toBeDefined();

      // Verify audit log was created
      expect(auditLogService.logAction).toHaveBeenCalledWith('create', 'property', {
        propertyId: property.propertyId,
        name: property.name
      });
    });
  });

  describe('getPropertyById', () => {
    it('should get a property by ID', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const property = await propertyService.getPropertyById(created.id!);

      expect(property).toBeDefined();
      expect(property!.id).toBe(created.id);
      expect(property!.name).toBe(sampleProperty.name);
    });

    it('should return null for non-existent ID', async () => {
      const property = await propertyService.getPropertyById(999);
      expect(property).toBeNull();
    });
  });

  describe('getPropertyByPropertyId', () => {
    it('should get a property by propertyId', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const property = await propertyService.getPropertyByPropertyId(created.propertyId);

      expect(property).toBeDefined();
      expect(property!.propertyId).toBe(created.propertyId);
      expect(property!.name).toBe(sampleProperty.name);
    });

    it('should return null for non-existent propertyId', async () => {
      const property = await propertyService.getPropertyByPropertyId('non-existent-id');
      expect(property).toBeNull();
    });
  });

  describe('getAllProperties', () => {
    it('should get all properties', async () => {
      await propertyService.createProperty(sampleProperty);
      await propertyService.createProperty({
        ...sampleProperty,
        name: 'Second Property'
      });

      const properties = await propertyService.getAllProperties();
      expect(properties).toHaveLength(2);
    });

    it('should respect limit and offset', async () => {
      await propertyService.createProperty(sampleProperty);
      await propertyService.createProperty({
        ...sampleProperty,
        name: 'Second Property'
      });
      await propertyService.createProperty({
        ...sampleProperty,
        name: 'Third Property'
      });

      const properties = await propertyService.getAllProperties(1, 1);
      expect(properties).toHaveLength(1);
      expect(properties[0].name).toBe('Second Property');
    });
  });

  describe('getPropertiesByOwner', () => {
    it('should get properties by owner ID', async () => {
      await propertyService.createProperty(sampleProperty);
      await propertyService.createProperty({
        ...sampleProperty,
        owner: {
          id: 'different-owner',
          name: 'Different Owner'
        }
      });

      const properties = await propertyService.getPropertiesByOwner('test-owner-id');
      expect(properties).toHaveLength(1);
      expect(properties[0].owner.id).toBe('test-owner-id');
    });
  });

  describe('updateProperty', () => {
    it('should update a property', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const updates = {
        name: 'Updated Property',
        status: 'inactive' as const
      };

      const updated = await propertyService.updateProperty(created.id!, updates);

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Property');
      expect(updated!.status).toBe('inactive');
      expect(updated!.updatedAt).toBeGreaterThan(created.updatedAt);

      // Verify audit log was created
      expect(auditLogService.logAction).toHaveBeenCalledWith('update', 'property', {
        propertyId: created.propertyId,
        name: created.name,
        updates
      });
    });

    it('should return null for non-existent ID', async () => {
      const updated = await propertyService.updateProperty(999, { name: 'Updated' });
      expect(updated).toBeNull();
    });
  });

  describe('deleteProperty', () => {
    it('should delete a property', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const result = await propertyService.deleteProperty(created.id!);

      expect(result).toBe(true);

      const property = await propertyService.getPropertyById(created.id!);
      expect(property).toBeNull();

      // Verify audit log was created
      expect(auditLogService.logAction).toHaveBeenCalledWith('delete', 'property', {
        propertyId: created.propertyId,
        name: created.name
      });
    });

    it('should return false for non-existent ID', async () => {
      const result = await propertyService.deleteProperty(999);
      expect(result).toBe(false);
    });
  });

  describe('searchProperties', () => {
    beforeEach(async () => {
      await propertyService.createProperty(sampleProperty);
      await propertyService.createProperty({
        ...sampleProperty,
        name: 'Commercial Building',
        type: 'commercial',
        location: {
          ...sampleProperty.location,
          city: 'New York',
          state: 'NY',
          country: 'USA'
        }
      });
    });

    it('should search properties by name', async () => {
      const results = await propertyService.searchProperties({ name: 'Commercial' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Commercial Building');
    });

    it('should search properties by type', async () => {
      const results = await propertyService.searchProperties({ type: 'residential' });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('residential');
    });

    it('should search properties by location', async () => {
      const results = await propertyService.searchProperties({ city: 'New York' });
      expect(results).toHaveLength(1);
      expect(results[0].location.city).toBe('New York');
    });

    it('should combine multiple search criteria', async () => {
      const results = await propertyService.searchProperties({
        type: 'commercial',
        country: 'USA'
      });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('commercial');
      expect(results[0].location.country).toBe('USA');
    });
  });

  describe('addPropertyDocument', () => {
    it('should add a document to a property', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const document = {
        type: 'deed' as const,
        issueDate: Date.now(),
        verificationStatus: 'verified' as const
      };

      const updated = await propertyService.addPropertyDocument(created.id!, document);

      expect(updated).toBeDefined();
      expect(updated!.documents).toHaveLength(1);
      expect(updated!.documents![0].type).toBe('deed');
      expect(updated!.documents![0].id).toBeDefined();

      // Verify audit log was created
      expect(auditLogService.logAction).toHaveBeenCalledWith('add_document', 'property', {
        propertyId: created.propertyId,
        name: created.name,
        documentId: updated!.documents![0].id,
        documentType: 'deed'
      });
    });

    it('should return null for non-existent ID', async () => {
      const document = {
        type: 'deed' as const,
        issueDate: Date.now(),
        verificationStatus: 'verified' as const
      };
      const updated = await propertyService.addPropertyDocument(999, document);
      expect(updated).toBeNull();
    });
  });

  describe('removePropertyDocument', () => {
    it('should remove a document from a property', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const document = {
        type: 'deed' as const,
        issueDate: Date.now(),
        verificationStatus: 'verified' as const
      };

      const withDocument = await propertyService.addPropertyDocument(created.id!, document);
      const documentId = withDocument!.documents![0].id;

      const updated = await propertyService.removePropertyDocument(created.id!, documentId);

      expect(updated).toBeDefined();
      expect(updated!.documents).toHaveLength(0);

      // Verify audit log was created
      expect(auditLogService.logAction).toHaveBeenCalledWith('remove_document', 'property', {
        propertyId: created.propertyId,
        name: created.name,
        documentId,
        documentType: 'deed'
      });
    });

    it('should return null for non-existent ID', async () => {
      const updated = await propertyService.removePropertyDocument(999, 'doc-id');
      expect(updated).toBeNull();
    });

    it('should return property unchanged if document not found', async () => {
      const created = await propertyService.createProperty(sampleProperty);
      const updated = await propertyService.removePropertyDocument(created.id!, 'non-existent-doc');
      expect(updated).toEqual(created);
    });
  });
});