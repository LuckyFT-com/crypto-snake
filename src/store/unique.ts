import { UniqueChain, Balance } from '@unique-nft/sdk'
import { Polkadot, Ethereum } from '@unique-nft/utils/extension'

export default {
  namespaced: true,
  state: () => ({
    uniqueChain: null,
    errorMessage: '',
    isWalletConnected: false,
    walletAddress: '',
    walletType: '',
    balance: null,
    balanceAvailable: null,
  }),
  getters: {},
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
    setBalance(state, balance) {
      state.balance = balance
      state.balanceAvailable =
        Number(balance.available) / Math.pow(10, Number(balance.decimals))
    },
  },
  actions: {
    async initializeSDK({ state, commit, dispatch }) {
      if (!state.isWalletConnected) return
      let uniqueChain
      if (state.walletType === 'polkadot') {
        uniqueChain = UniqueChain({
          account: { address: state.walletAddress },
          baseUrl: 'https://rest.unique.network/v2/opal',
        })
      } else if (state.walletType === 'metamask') {
        uniqueChain = UniqueChain({
          account: { address: state.walletAddress },
          baseUrl: 'https://rest.unique.network/v2/opal',
          signer: {
            type: 'ethereum',
            address: state.walletAddress,
          },
        })
      }

      if (uniqueChain) {
        commit('setUniqueChain', uniqueChain)
        await dispatch('getBalance')
      }
    },
    async connectPolkadot({ commit }) {
      try {
        const { accounts } = await Polkadot.enableAndLoadAllWallets()
        if (accounts.length > 0) {
          commit('setWalletConnection', {
            isConnected: true,
            address: accounts[0].address,
            type: 'polkadot',
          })
          // 保存钱包信息到 localStorage
          localStorage.setItem('walletType', 'polkadot')
          localStorage.setItem('walletAddress', accounts[0].address)
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
          type: 'metamask',
        })
        // 保存钱包信息到 localStorage
        localStorage.setItem('walletType', 'metamask')
        localStorage.setItem('walletAddress', address)
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
    async autoConnectWallet({ dispatch, commit }) {
      const savedWalletType = localStorage.getItem('walletType')
      const savedWalletAddress = localStorage.getItem('walletAddress')
      if (savedWalletType && savedWalletAddress) {
        try {
          if (savedWalletType === 'polkadot') {
            await dispatch('connectPolkadot')
          } else if (savedWalletType === 'metamask') {
            await dispatch('connectMetamask')
          }
          // 如果连接成功，初始化 SDK
          await dispatch('initializeSDK')
        } catch (error) {
          console.error('自动重连失败:', error)
          commit('setErrorMessage', '自动重连失败，请手动连接钱包。')
        }
      }
    },
    disconnectWallet({ commit }) {
      commit('setWalletConnection', {
        isConnected: false,
        address: '',
        type: '',
      })
      commit('setUniqueChain', null)
      // 清除 localStorage 中的钱包信息
      localStorage.removeItem('walletType')
      localStorage.removeItem('walletAddress')
    },
    async getBalance({ state, commit }) {
      if (state.uniqueChain && state.isWalletConnected) {
        try {
          const balance: Balance = await state.uniqueChain.balance.get({
            address: state.walletAddress,
          })
          console.log('balance', balance)
          commit('setBalance', balance)
        } catch (error) {
          console.error('Failed to fetch balance:', error)
          commit('setErrorMessage', 'Failed to fetch balance')
        }
      }
    },
  },
}
