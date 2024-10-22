<template>
    <v-popup @closed="$emit('closed')">
        <template #description>
            <h2>连接钱包</h2>
            <div class="wallet-options">
                <button @click="connectPolkadot">连接 Polkadot 扩展</button>
                <!-- <button @click="connectMetamask">连接 MetaMask</button> -->
            </div>
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </template>
    </v-popup>
</template>

<script lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import VPopup from "@/components/Popup.vue";

export default {
    components: {
        VPopup,
    },
    emits: ['closed'],
    setup(props, { emit }) {
        const store = useStore();
        const errorMessage = computed(() => store.state.unique.errorMessage);

        async function connectPolkadot() {
            try {
                const walletInfo = await store.dispatch('unique/connectPolkadot');
                if (walletInfo) {
                    emit('closed');
                }
            } catch (e) {
                // Error is already handled in the store action
            }
        }

        async function connectMetamask() {
            try {
                const walletInfo = await store.dispatch('unique/connectMetamask');
                if (walletInfo) {
                    emit('closed');
                }
            } catch (e) {
                // Error is already handled in the store action
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
