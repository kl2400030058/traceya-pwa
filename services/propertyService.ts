// Property Service
import { db } from '../lib/db';
import { Property } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { auditLogService } from './auditlogservice';

export class PropertyService {
  async createProperty(propertyData: Omit<Property, 'id' | 'propertyId' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    const property: Property = {
      ...propertyData,
      propertyId: `PROP-${uuidv4().substring(0, 8)}`,
      createdAt: now,
      updatedAt: now
    };

    const id = await db.properties.add(property);
    const createdProperty = await this.getPropertyById(id);

    // Log the action
    await auditLogService.logAction('create', 'property', {
      propertyId: property.propertyId,
      name: property.name
    });

    return createdProperty;
  }

  async getPropertyById(id: number) {
    return await db.properties.get(id) || null;
  }

  async getPropertyByPropertyId(propertyId: string) {
    return await db.properties.where('propertyId').equals(propertyId).first() || null;
  }

  async getAllProperties(limit?: number, offset?: number) {
    let query = db.properties.toCollection();
    
    if (offset) {
      query = query.offset(offset);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query.toArray();
  }

  async getPropertiesByOwner(ownerId: string) {
    return await db.properties.where('owner.id').equals(ownerId).toArray();
  }

  async updateProperty(id: number, updates: Partial<Property>) {
    const property = await this.getPropertyById(id);
    
    if (!property) {
      return null;
    }
    
    const updatedProperty = {
      ...property,
      ...updates,
      updatedAt: Date.now()
    };
    
    await db.properties.update(id, updatedProperty);
    
    // Log the action
    await auditLogService.logAction('update', 'property', {
      propertyId: property.propertyId,
      name: property.name,
      updates
    });
    
    return await this.getPropertyById(id);
  }

  async deleteProperty(id: number) {
    const property = await this.getPropertyById(id);
    
    if (!property) {
      return false;
    }
    
    await db.properties.delete(id);
    
    // Log the action
    await auditLogService.logAction('delete', 'property', {
      propertyId: property.propertyId,
      name: property.name
    });
    
    return true;
  }

  async searchProperties(criteria: {
    name?: string;
    type?: string;
    status?: string;
    city?: string;
    state?: string;
    country?: string;
  }) {
    let collection = db.properties.toCollection();
    
    // Filter by each criterion
    const results = await collection.toArray();
    
    return results.filter(property => {
      let match = true;
      
      if (criteria.name && !property.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        match = false;
      }
      
      if (criteria.type && property.type !== criteria.type) {
        match = false;
      }
      
      if (criteria.status && property.status !== criteria.status) {
        match = false;
      }
      
      if (criteria.city && property.location.city !== criteria.city) {
        match = false;
      }
      
      if (criteria.state && property.location.state !== criteria.state) {
        match = false;
      }
      
      if (criteria.country && property.location.country !== criteria.country) {
        match = false;
      }
      
      return match;
    });
  }

  async addPropertyDocument(id: number, document: {
    type: 'deed' | 'title' | 'survey' | 'tax' | 'permit' | 'other';
    fileUrl?: string;
    fileHash?: string;
    issueDate: number;
    expiryDate?: number;
    verificationStatus: 'verified' | 'pending' | 'rejected';
  }) {
    const property = await this.getPropertyById(id);
    
    if (!property) {
      return null;
    }
    
    const documentId = uuidv4();
    const documents = property.documents || [];
    
    const newDocument = {
      id: documentId,
      ...document
    };
    
    const updatedProperty = await this.updateProperty(id, {
      documents: [...documents, newDocument],
      updatedAt: Date.now()
    });
    
    // Log the action
    await auditLogService.logAction('add_document', 'property', {
      propertyId: property.propertyId,
      name: property.name,
      documentId,
      documentType: document.type
    });
    
    return updatedProperty;
  }

  async removePropertyDocument(id: number, documentId: string) {
    const property = await this.getPropertyById(id);
    
    if (!property) {
      return null;
    }
    
    const documents = property.documents || [];
    const documentToRemove = documents.find(doc => doc.id === documentId);
    
    if (!documentToRemove) {
      return property;
    }
    
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    
    const updatedProperty = await this.updateProperty(id, {
      documents: updatedDocuments,
      updatedAt: Date.now()
    });
    
    // Log the action
    await auditLogService.logAction('remove_document', 'property', {
      propertyId: property.propertyId,
      name: property.name,
      documentId,
      documentType: documentToRemove.type
    });
    
    return updatedProperty;
  }
}

export const propertyService = new PropertyService();