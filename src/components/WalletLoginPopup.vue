<template>
    <v-popup @closed="$emit('closed')">
        <template #description>
            <h2>连接钱包</h2>
            <div class="wallet-options">
                <button @click="connectPolkadot">连接 Polkadot 扩展</button>
                <button @click="connectMetamask">连接 MetaMask</button>
            </div>
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </template>
    </v-popup>
</template>

<script lang="ts">
import { ref } from 'vue';
import VPopup from "@/components/Popup.vue";
import { Polkadot, Ethereum } from '@unique-nft/utils/extension';

export default {
    components: {
        VPopup,
    },
    emits: ['closed', 'wallet-connected'],
    setup(props, { emit }) {
        const errorMessage = ref('');

        async function connectPolkadot() {
            try {
                const { accounts } = await Polkadot.enableAndLoadAllWallets();
                if (accounts.length > 0) {
                    emit('wallet-connected', { type: 'polkadot', account: accounts[0] });
                    emit('closed');
                } else {
                    errorMessage.value = '在 Polkadot 扩展中未找到账户。';
                }
            } catch (e: any) {
                if (e.extensionNotFound) {
                    errorMessage.value = '请安装兼容 polkadot.js 的扩展。';
                } else if (e.accountsNotFound) {
                    if (e.userHasWalletsButHasNoAccounts) {
                        errorMessage.value = '请在您的钱包中创建一个账户。';
                    } else if (e.userHasBlockedAllWallets) {
                        errorMessage.value = '请至少授权访问您的一个账户。';
                    }
                } else {
                    errorMessage.value = `连接到 Polkadot 扩展失败: ${e.message}`;
                }
            }
        }

        async function connectMetamask() {
            try {
                const { address, chainId } = await Ethereum.requestAccounts();
                emit('wallet-connected', { type: 'metamask', account: { address, chainId } });
                emit('closed');
            } catch (e: any) {
                if (e.extensionNotFound) {
                    errorMessage.value = '请安装 MetaMask 扩展。';
                } else if (e.userRejected) {
                    errorMessage.value = '用户拒绝了访问。';
                } else {
                    errorMessage.value = `连接到 MetaMask 扩展失败: ${e.message}`;
                }
            }
        }

        return {
            connectPolkadot,
            connectMetamask,
            errorMessage,
        };
    },
};
</script>

<style scoped>
.wallet-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.wallet-options button {
    padding: 10px;
    font-size: 16px;
    cursor: pointer;
}

.error-message {
    color: red;
    margin-top: 10px;
}
</style>