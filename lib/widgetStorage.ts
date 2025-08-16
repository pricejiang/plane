// Step 6: Widget Storage System
// Manages widget metadata with element lifecycle synchronization and undo/redo support

import { 
  WidgetMetadata, 
  WidgetStorage, 
  WidgetStorageSnapshot, 
  WidgetType,
  WidgetError,
  WidgetErrorCode 
} from '../types/widgets';

export class WidgetStorageManager implements WidgetStorage {
  private widgets = new Map<string, WidgetMetadata>();
  private snapshots: WidgetStorageSnapshot[] = [];
  private maxSnapshotHistory = 50;
  private currentSnapshotId = 0;

  // =============================================================================
  // CORE STORAGE OPERATIONS
  // =============================================================================

  set(elementId: string, metadata: WidgetMetadata): void {
    try {
      this.validateMetadata(metadata);
      
      // Ensure elementId matches metadata
      if (metadata.elementId !== elementId) {
        metadata.elementId = elementId;
      }
      
      // Update timestamp
      metadata.updatedAt = Date.now();
      
      // Save snapshot before modification
      this.saveSnapshot('update', elementId);
      
      // Store the metadata
      this.widgets.set(elementId, { ...metadata });
      
      console.log(`Widget metadata set for element ${elementId}:`, metadata.type);
    } catch (error) {
      throw new WidgetError(
        `Failed to set widget metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        WidgetErrorCode.STORAGE_ERROR,
        elementId,
        metadata.type
      );
    }
  }

  get(elementId: string): WidgetMetadata | undefined {
    return this.widgets.get(elementId);
  }

  has(elementId: string): boolean {
    return this.widgets.has(elementId);
  }

  delete(elementId: string): boolean {
    if (!this.widgets.has(elementId)) {
      return false;
    }
    
    // Save snapshot before deletion
    this.saveSnapshot('delete', elementId);
    
    const deleted = this.widgets.delete(elementId);
    console.log(`Widget metadata deleted for element ${elementId}`);
    
    return deleted;
  }

  clear(): void {
    this.saveSnapshot('clear');
    this.widgets.clear();
    console.log('All widget metadata cleared');
  }

  // =============================================================================
  // LIFECYCLE OPERATIONS
  // =============================================================================

  duplicate(sourceId: string, targetId: string): boolean {
    const sourceMetadata = this.widgets.get(sourceId);
    if (!sourceMetadata) {
      return false;
    }
    
    try {
      // Create new metadata with updated elementId and timestamp
      const newMetadata: WidgetMetadata = {
        ...sourceMetadata,
        elementId: targetId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      this.saveSnapshot('duplicate', targetId);
      this.widgets.set(targetId, newMetadata);
      
      console.log(`Widget metadata duplicated from ${sourceId} to ${targetId}`);
      return true;
    } catch (error) {
      console.error(`Failed to duplicate widget metadata:`, error);
      return false;
    }
  }

  update(elementId: string, updates: Partial<WidgetMetadata>): boolean {
    const existing = this.widgets.get(elementId);
    if (!existing) {
      return false;
    }
    
    try {
      const updatedMetadata = {
        ...existing,
        ...updates,
        elementId, // Ensure elementId doesn't change
        updatedAt: Date.now()
      } as WidgetMetadata;
      
      this.validateMetadata(updatedMetadata);
      
      this.saveSnapshot('update', elementId);
      this.widgets.set(elementId, updatedMetadata);
      
      console.log(`Widget metadata updated for element ${elementId}`);
      return true;
    } catch (error) {
      console.error(`Failed to update widget metadata:`, error);
      return false;
    }
  }

  // =============================================================================
  // QUERY OPERATIONS
  // =============================================================================

  getAll(): Map<string, WidgetMetadata> {
    return new Map(this.widgets);
  }

  getByType(type: WidgetType): Map<string, WidgetMetadata> {
    const filtered = new Map<string, WidgetMetadata>();
    
    this.widgets.forEach((metadata, elementId) => {
      if (metadata.type === type) {
        filtered.set(elementId, metadata);
      }
    });
    
    return filtered;
  }

  count(): number {
    return this.widgets.size;
  }

  // =============================================================================
  // HISTORY AND UNDO/REDO
  // =============================================================================

  saveSnapshot(operation: WidgetStorageSnapshot['operation'] = 'update', elementId?: string): string {
    const snapshotId = `snapshot-${++this.currentSnapshotId}-${Date.now()}`;
    
    const snapshot: WidgetStorageSnapshot = {
      id: snapshotId,
      timestamp: Date.now(),
      data: new Map(this.widgets), // Deep copy of current state
      operation,
      elementId
    };
    
    this.snapshots.push(snapshot);
    
    // Limit snapshot history
    if (this.snapshots.length > this.maxSnapshotHistory) {
      this.snapshots.shift();
    }
    
    return snapshotId;
  }

  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      console.warn(`Snapshot ${snapshotId} not found`);
      return false;
    }
    
    try {
      // Restore the widget data from snapshot
      this.widgets.clear();
      snapshot.data.forEach((metadata, elementId) => {
        this.widgets.set(elementId, { ...metadata });
      });
      
      console.log(`Restored to snapshot ${snapshotId} (${snapshot.operation})`);
      return true;
    } catch (error) {
      console.error(`Failed to restore snapshot:`, error);
      return false;
    }
  }

  getHistory(): WidgetStorageSnapshot[] {
    return [...this.snapshots];
  }

  // =============================================================================
  // ELEMENT LIFECYCLE SYNCHRONIZATION
  // =============================================================================

  /**
   * Sync with Excalidraw element changes
   */
  syncWithElementUpdate(elementId: string, elementData: any): void {
    const metadata = this.widgets.get(elementId);
    if (!metadata) return;
    
    // Update metadata with element changes that might affect the widget
    const updates: Partial<WidgetMetadata> = {
      updatedAt: Date.now()
    };
    
    // If element text changed, try to re-extract widget config
    if (elementData.text && elementData.text !== metadata.title) {
      updates.title = elementData.text;
    }
    
    this.update(elementId, updates);
  }

  /**
   * Clean up widgets for deleted elements
   */
  cleanupDeletedElements(existingElementIds: string[]): number {
    const existingSet = new Set(existingElementIds);
    const toDelete: string[] = [];
    
    this.widgets.forEach((metadata, elementId) => {
      if (!existingSet.has(elementId)) {
        toDelete.push(elementId);
      }
    });
    
    for (const elementId of toDelete) {
      this.delete(elementId);
    }
    
    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} orphaned widget metadata entries`);
    }
    
    return toDelete.length;
  }

  // =============================================================================
  // SERIALIZATION AND EXPORT
  // =============================================================================

  serialize(): string {
    try {
      const data = {
        version: '1.0.0',
        widgets: Object.fromEntries(this.widgets),
        snapshots: this.snapshots.slice(-10), // Only include recent snapshots
        metadata: {
          createdAt: Date.now(),
          totalWidgets: this.widgets.size,
          supportedTypes: Object.values(WidgetType)
        }
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      throw new WidgetError(
        'Failed to serialize widget storage',
        WidgetErrorCode.SERIALIZATION_ERROR
      );
    }
  }

  deserialize(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      // Validate format
      if (!parsed.version || !parsed.widgets) {
        throw new Error('Invalid serialization format');
      }
      
      // Clear current data
      this.clear();
      
      // Restore widgets
      for (const [elementId, metadata] of Object.entries(parsed.widgets)) {
        this.widgets.set(elementId, metadata as WidgetMetadata);
      }
      
      // Restore snapshots if available
      if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
        this.snapshots = parsed.snapshots;
      }
      
      console.log(`Deserialized ${this.widgets.size} widgets from storage`);
      return true;
    } catch (error) {
      console.error('Failed to deserialize widget storage:', error);
      return false;
    }
  }

  // =============================================================================
  // VALIDATION AND UTILITIES
  // =============================================================================

  private validateMetadata(metadata: WidgetMetadata): void {
    if (!metadata.elementId) {
      throw new Error('Widget metadata must have an elementId');
    }
    
    if (!metadata.type || !Object.values(WidgetType).includes(metadata.type)) {
      throw new Error(`Invalid widget type: ${metadata.type}`);
    }
    
    if (!metadata.createdAt || metadata.createdAt <= 0) {
      throw new Error('Widget metadata must have a valid createdAt timestamp');
    }
    
    if (!metadata.version) {
      throw new Error('Widget metadata must have a version');
    }
    
    // Type-specific validation
    switch (metadata.type) {
      case WidgetType.MAP:
        this.validateMapMetadata(metadata as any);
        break;
      case WidgetType.VIDEO:
        this.validateVideoMetadata(metadata as any);
        break;
      // Add other validations as needed
    }
  }

  private validateMapMetadata(metadata: any): void {
    if (!metadata.config?.center?.latitude || !metadata.config?.center?.longitude) {
      throw new Error('Map widget must have center coordinates');
    }
    
    if (typeof metadata.config.zoom !== 'number' || metadata.config.zoom < 1 || metadata.config.zoom > 20) {
      throw new Error('Map widget must have valid zoom level (1-20)');
    }
  }

  private validateVideoMetadata(metadata: any): void {
    if (!metadata.config?.url) {
      throw new Error('Video widget must have a URL');
    }
    
    try {
      new URL(metadata.config.url);
    } catch {
      throw new Error('Video widget must have a valid URL');
    }
  }

  // =============================================================================
  // STATISTICS AND MONITORING
  // =============================================================================

  getStatistics() {
    const stats = {
      totalWidgets: this.widgets.size,
      widgetsByType: {} as Record<WidgetType, number>,
      averageAge: 0,
      oldestWidget: null as WidgetMetadata | null,
      newestWidget: null as WidgetMetadata | null,
      snapshotCount: this.snapshots.length,
      memoryUsage: this.estimateMemoryUsage()
    };
    
    // Calculate widget type distribution
    for (const type of Object.values(WidgetType)) {
      stats.widgetsByType[type] = 0;
    }
    
    let totalAge = 0;
    let oldestTime = Date.now();
    let newestTime = 0;
    
    this.widgets.forEach((metadata) => {
      if (stats.widgetsByType[metadata.type] !== undefined) {
        stats.widgetsByType[metadata.type]++;
      }
      
      const age = Date.now() - metadata.createdAt;
      totalAge += age;
      
      if (metadata.createdAt < oldestTime) {
        oldestTime = metadata.createdAt;
        stats.oldestWidget = metadata;
      }
      
      if (metadata.createdAt > newestTime) {
        newestTime = metadata.createdAt;
        stats.newestWidget = metadata;
      }
    });
    
    if (this.widgets.size > 0) {
      stats.averageAge = totalAge / this.widgets.size;
    }
    
    return stats;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    const serialized = this.serialize();
    return serialized.length * 2; // UTF-16 encoding approximation
  }
}

// Singleton instance
let widgetStorageInstance: WidgetStorageManager | null = null;

export function getWidgetStorage(): WidgetStorageManager {
  if (!widgetStorageInstance) {
    widgetStorageInstance = new WidgetStorageManager();
  }
  return widgetStorageInstance;
}

export function resetWidgetStorage(): void {
  widgetStorageInstance = null;
}