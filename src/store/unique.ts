import { UniqueChain } from '@unique-nft/sdk'
import { Polkadot, Ethereum } from '@unique-nft/utils/extension'

export default {
  namespaced: true,
  state: () => ({
    uniqueChain: null,
    errorMessage: '',
    isWalletConnected: false,
    walletAddress: '',
    walletType: '',
  }),
  getters: {
    twoBars: (state) => state.foo.repeat(2),
  },
  mutations: {
    setUniqueChain(state, chain) {
      state.uniqueChain = chain
    },
    setErrorMessage(state, message) {
      state.errorMessage = message
    },
    setWalletConnection(state, { isConnected, address, type }) {
      state.isWalletConnected = isConnected
      state.walletAddress = address
      state.walletType = type
    },
  },
  actions: {
    async initializeSDK({ state, commit }) {
      if (state.isWalletConnected && state.walletType === 'polkadot') {
        const uniqueChain = UniqueChain({
          account: { address: state.walletAddress },
          baseUrl: 'https://rest.unique.network/v2/opal',
        })
        commit('setUniqueChain', uniqueChain)
      }
      // Add MetaMask initialization if needed
    },
    async connectPolkadot({ commit }) {
      try {
        const { accounts } = await Polkadot.enableAndLoadAllWallets()
        if (accounts.length > 0) {
          commit('setWalletConnection', { 
            isConnected: true, 
            address: accounts[0].address, 
            type: 'polkadot' 
          })
          return { type: 'polkadot', account: accounts[0] }
        } else {
          commit('setErrorMessage', '在 Polkadot 扩展中未找到账户。')
        }
      } catch (e: any) {
        if (e.extensionNotFound) {
          commit('setErrorMessage', '请安装兼容 polkadot.js 的扩展。')
        } else if (e.accountsNotFound) {
          if (e.userHasWalletsButHasNoAccounts) {
            commit('setErrorMessage', '请在您的钱包中创建一个账户。')
          } else if (e.userHasBlockedAllWallets) {
            commit('setErrorMessage', '请至少授权访问您的一个账户。')
          }
        } else {
          commit('setErrorMessage', `连接到 Polkadot 扩展失败: ${e.message}`)
        }
        throw e
      }
    },
    async connectMetamask({ commit }) {
      try {
        const { address, chainId } = await Ethereum.requestAccounts()
        commit('setWalletConnection', { 
          isConnected: true, 
          address: address, 
          type: 'metamask' 
        })
        return { type: 'metamask', account: { address, chainId } }
      } catch (e: any) {
        if (e.extensionNotFound) {
          commit('setErrorMessage', '请安装 MetaMask 扩展。')
        } else if (e.userRejected) {
          commit('setErrorMessage', '用户拒绝了访问。')
        } else {
          commit('setErrorMessage', `连接到 MetaMask 扩展失败: ${e.message}`)
        }
        throw e
      }
    },
    disconnectWallet({ commit }) {
      commit('setWalletConnection', { 
        isConnected: false, 
        address: '', 
        type: '' 
      })
      commit('setUniqueChain', null)
    },
  },
}
