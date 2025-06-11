import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EqubGroup, EqubStatus } from './entities/equb-group.entity';
import { Membership } from './entities/membership.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { User } from '../users/user.entity';
import { LoggerService } from '../common/logger/logger.service';
import { Cycle } from './entities/cycle.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { PaymentGatewayService } from 'src/common/payment-gateway.service';

@Injectable()
export class EqubGroupsService {
  constructor(
    @InjectRepository(EqubGroup)
    private readonly equbGroupRepository: Repository<EqubGroup>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly logger: LoggerService,
    @InjectRepository(Cycle) // <-- Inject CycleRepository
    private readonly cycleRepository: Repository<Cycle>,
    @InjectRepository(Transaction) // <-- Inject TransactionRepository
    private readonly transactionRepository: Repository<Transaction>,
    private readonly paymentGatewayService: PaymentGatewayService,
  ) {
    this.logger.setContext(EqubGroupsService.name);
  }

  async createGroup(dto: CreateGroupDto, owner: User): Promise<EqubGroup> {
    // 1. Create and save the new EqubGroup instance
    const newGroup = this.equbGroupRepository.create({
      ...dto,
      owner: owner,
    });
    await this.equbGroupRepository.save(newGroup);
    this.logger.log(
      `New group '${newGroup.name}' created by user ${owner.email}`,
    );

    // 2. Automatically create a membership for the owner
    const ownerMembership = this.membershipRepository.create({
      group: newGroup,
      user: owner,
      payoutOrder: 1,
    });
    await this.membershipRepository.save(ownerMembership);
    this.logger.log(
      `Owner membership created for user ${owner.email} in group '${newGroup.name}'`,
    );

    return newGroup;
  }

  async joinGroup(groupId: string, user: User): Promise<Membership> {
    // 1. Find the group
    const group = await this.equbGroupRepository.findOneBy({ id: groupId });
    if (!group) {
      throw new NotFoundException(`Group with ID "${groupId}" not found.`);
    }

    // Optional: Add business logic checks, e.g., cannot join a group that is not pending
    if (group.status !== EqubStatus.PENDING) {
      throw new ConflictException(`This group is not accepting new members.`);
    }

    // 2. Check if the user is already a member
    const existingMembership = await this.membershipRepository.findOne({
      where: {
        group: { id: groupId },
        user: { id: user.id },
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this group.');
    }

    // 3. Determine the payout order for the new member
    const memberCount = await this.membershipRepository.count({
      where: { group: { id: groupId } },
    });
    const payoutOrder = memberCount + 1;

    // 4. Create and save the new membership
    const newMembership = this.membershipRepository.create({
      group: group,
      user: user,
      payoutOrder: payoutOrder,
    });

    await this.membershipRepository.save(newMembership);
    this.logger.log(
      `User ${user.email} successfully joined group '${group.name}'`,
    );

    return newMembership;
  }

  async makePayment(groupId: string, user: User): Promise<Transaction> {
    // 1. Find the user's membership in the specified group
    const membership = await this.membershipRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
      relations: ['group'],
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this group and cannot make payments.',
      );
    }

    const group = membership.group;

    // 2. Check business rules
    // The group must be active to accept payments
    if (group.status !== EqubStatus.ACTIVE) {
      throw new ConflictException(
        `Payments can only be made to active groups.`,
      );
    }

    // 3. Find the current active cycle for this group
    const activeCycle = await this.cycleRepository.findOne({
      where: { group: { id: groupId }, status: 'active' },
    });

    if (!activeCycle) {
      throw new NotFoundException(
        'There is no active payment cycle for this group.',
      );
    }

    // 4. Check if the user has already paid for this cycle
    const existingTransaction = await this.transactionRepository.findOne({
      where: {
        membership: { id: membership.id },
        cycle: { id: activeCycle.id },
        status: TransactionStatus.SUCCESS,
      },
    });

    if (existingTransaction) {
      throw new ConflictException(
        'You have already made your contribution for the current cycle.',
      );
    }

    // 5. Create and save the new transaction record
    const newTransaction = this.transactionRepository.create({
      membership: membership,
      cycle: activeCycle,
      amount: group.contributionAmount,
      status: TransactionStatus.PENDING,
    });
    await this.transactionRepository.save(newTransaction);
    this.logger.log(
      `Transaction ${newTransaction.id} created with PENDING status.`,
    );

    // 6. Call the external payment gateway
    const paymentResult = await this.paymentGatewayService.processPayment(
      newTransaction.amount,
    );

    // 7. Update the transaction status based on the gateway's response
    newTransaction.status = paymentResult.success
      ? TransactionStatus.SUCCESS
      : TransactionStatus.FAILED;

    await this.transactionRepository.save(newTransaction);
    this.logger.log(
      `Transaction ${newTransaction.id} updated to ${newTransaction.status}.`,
    );

    return newTransaction;
  }

  /**
   * Starts the Equb group by creating the first cycle and updating the group status.
   * Only the group owner can start the group, and it requires at least two members.
   */
  async startGroup(groupId: string, user: User): Promise<EqubGroup> {
    const group = await this.equbGroupRepository.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });

    if (!group) throw new NotFoundException('Group not found.');
    if (group.owner.id !== user.id)
      throw new ForbiddenException('Only the group owner can start the group.');
    if (group.status !== EqubStatus.PENDING)
      throw new ConflictException('This group has already been started.');

    const memberships = await this.membershipRepository.find({
      where: { group: { id: groupId } },
    });
    if (memberships.length < 2)
      throw new ConflictException(
        'A group needs at least two members to start.',
      );

    // Find the first member in the payout order
    const firstRecipientMembership = await this.membershipRepository.findOne({
      where: { group: { id: groupId }, payoutOrder: 1 },
      relations: ['user'],
    });
    if (!firstRecipientMembership)
      throw new ConflictException(
        'Payout order is not set correctly. Member with order 1 not found.',
      );

    // 1. Create the first cycle
    const firstCycle = this.cycleRepository.create({
      group: group,
      cycleNumber: 1,
      startDate: new Date(),
      // End date logic would depend on group.frequency
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Example: 1 month cycle
      status: 'active',
      payoutRecipient: firstRecipientMembership.user,
    });
    await this.cycleRepository.save(firstCycle);

    // 2. Update the group status to ACTIVE
    group.status = EqubStatus.ACTIVE;
    await this.equbGroupRepository.save(group);

    this.logger.log(
      `Group '${group.name}' has been started by owner ${user.email}. Cycle 1 is active.`,
    );
    return group;
  }

  async processNextCycle(groupId: string, user: User): Promise<Cycle> {
    const group = await this.equbGroupRepository.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });
    if (!group) throw new NotFoundException('Group not found.');
    if (group.owner.id !== user.id)
      throw new ForbiddenException('Only the group owner can process cycles.');

    // 1. Find the current active cycle
    const activeCycle = await this.cycleRepository.findOne({
      where: { group: { id: groupId }, status: 'active' },
      relations: ['payoutRecipient'],
    });
    if (!activeCycle)
      throw new NotFoundException('No active cycle found to process.');

    // 2. Verify all members have paid for this cycle
    const totalMembers = await this.membershipRepository.count({
      where: { group: { id: groupId } },
    });
    const successfulTransactions = await this.transactionRepository.count({
      where: {
        cycle: { id: activeCycle.id },
        status: TransactionStatus.SUCCESS,
      },
    });

    if (successfulTransactions < totalMembers) {
      throw new ConflictException(
        `Cannot process cycle. ${totalMembers - successfulTransactions} member(s) have not paid yet.`,
      );
    }

    // 3. Complete the current cycle
    activeCycle.status = 'completed';
    await this.cycleRepository.save(activeCycle);
    this.logger.log(
      `Cycle ${activeCycle.cycleNumber} for group '${group.name}' completed. Payout to ${activeCycle.payoutRecipient.email}.`,
    );

    // 4. Determine the next recipient
    const currentRecipientMembership =
      await this.membershipRepository.findOneBy({
        group: { id: groupId },
        user: { id: activeCycle.payoutRecipient.id },
      });

    if (!currentRecipientMembership) {
      throw new ConflictException(
        'Current payout recipient membership not found.',
      );
    }

    const nextPayoutOrder =
      (currentRecipientMembership.payoutOrder % totalMembers) + 1;
    const nextRecipientMembership = await this.membershipRepository.findOne({
      where: { group: { id: groupId }, payoutOrder: nextPayoutOrder },
      relations: ['user'],
    });

    // 5. Create and save the new cycle
    const newCycle = this.cycleRepository.create({
      group: group,
      cycleNumber: activeCycle.cycleNumber + 1,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Example: 1 month cycle
      status: 'active',
      payoutRecipient: nextRecipientMembership?.user,
    });
    await this.cycleRepository.save(newCycle);
    this.logger.log(
      `Cycle ${newCycle.cycleNumber} started. Next payout to ${nextRecipientMembership?.user.email}.`,
    );

    return newCycle;
  }
}
