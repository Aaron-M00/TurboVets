import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private readonly orgs: Repository<Organization>,
  ) {}

  findById(id: string) {
    return this.orgs.findOne({ where: { id } });
  }

  async accessibleOrgIds(rootId: string): Promise<string[]> {
    const children = await this.orgs.find({ where: { parentId: rootId } });
    return [rootId, ...children.map((c) => c.id)];
  }

  findByIds(ids: string[]) {
    return ids.length ? this.orgs.find({ where: { id: In(ids) } }) : Promise.resolve([]);
  }
}
