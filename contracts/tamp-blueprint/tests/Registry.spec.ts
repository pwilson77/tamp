import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Registry } from '../build/Registry/Registry_Registry';
import '@ton/test-utils';

describe('Registry', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let registry: SandboxContract<Registry>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        registry = blockchain.openContract(await Registry.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await registry.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: registry.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and registry are ready to use
    });
});
