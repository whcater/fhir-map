import { DataDomain, LogicDto, ThirdPartyDto } from '../types/metadata';
import { MappingConfig } from '../types/mapping';

export interface DataDomainRelation {
  id: string;
  sourceDomainId: string;
  targetDomainId: string;
  relationType: 'extends' | 'composes' | 'references';
  mappingConfig: MappingConfig;
  description?: string;
}

export class DomainRelationService {
  private relations: DataDomainRelation[] = [];

  // 创建数据域关联
  createRelation(relation: Omit<DataDomainRelation, 'id'>): DataDomainRelation {
    const newRelation: DataDomainRelation = {
      ...relation,
      id: this.generateId()
    };
    this.relations.push(newRelation);
    return newRelation;
  }

  // 获取数据域关联
  getRelation(id: string): DataDomainRelation | undefined {
    return this.relations.find(r => r.id === id);
  }

  // 获取数据域的所有关联
  getDomainRelations(domainId: string): DataDomainRelation[] {
    return this.relations.filter(
      r => r.sourceDomainId === domainId || r.targetDomainId === domainId
    );
  }

  // 更新数据域关联
  updateRelation(id: string, updates: Partial<DataDomainRelation>): DataDomainRelation | undefined {
    const index = this.relations.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    this.relations[index] = {
      ...this.relations[index],
      ...updates
    };

    return this.relations[index];
  }

  // 删除数据域关联
  deleteRelation(id: string): boolean {
    const index = this.relations.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.relations.splice(index, 1);
    return true;
  }

  // 验证数据域关联
  validateRelation(relation: DataDomainRelation): string[] {
    const errors: string[] = [];

    // 验证源数据域和目标数据域是否存在
    if (!this.validateDomainExists(relation.sourceDomainId)) {
      errors.push(`源数据域 ${relation.sourceDomainId} 不存在`);
    }
    if (!this.validateDomainExists(relation.targetDomainId)) {
      errors.push(`目标数据域 ${relation.targetDomainId} 不存在`);
    }

    // 验证映射配置
    if (!this.validateMappingConfig(relation.mappingConfig)) {
      errors.push('映射配置无效');
    }

    // 验证关系类型
    if (!['extends', 'composes', 'references'].includes(relation.relationType)) {
      errors.push('无效的关系类型');
    }

    return errors;
  }

  // 获取数据域的继承链
  getInheritanceChain(domainId: string): string[] {
    const chain: string[] = [domainId];
    let currentId = domainId;

    while (true) {
      const relation = this.relations.find(
        r => r.targetDomainId === currentId && r.relationType === 'extends'
      );
      
      if (!relation) break;
      
      chain.push(relation.sourceDomainId);
      currentId = relation.sourceDomainId;
    }

    return chain;
  }

  // 获取数据域的组件
  getComposedDomains(domainId: string): string[] {
    return this.relations
      .filter(r => r.sourceDomainId === domainId && r.relationType === 'composes')
      .map(r => r.targetDomainId);
  }

  // 获取数据域的引用
  getReferencedDomains(domainId: string): string[] {
    return this.relations
      .filter(r => r.sourceDomainId === domainId && r.relationType === 'references')
      .map(r => r.targetDomainId);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private validateDomainExists(domainId: string): boolean {
    // TODO: 实现数据域存在性验证
    return true;
  }

  private validateMappingConfig(config: MappingConfig): boolean {
    // TODO: 实现映射配置验证
    return true;
  }
} 