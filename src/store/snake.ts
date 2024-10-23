import { UniqueSDK } from '@unique-nft/sdk'
import { ActionContext } from 'vuex'

interface SnakeState {
  sdk: UniqueSDK | null
  collectionId: number | null
  snakeNftId: number | null
  totalGames: number
}

const state: SnakeState = {
  sdk: null,
  collectionId: 4169,
  snakeNftId: null,
  totalGames: 0,
}

const mutations = {
  SET_SDK(state: SnakeState, sdk: UniqueSDK) {
    state.sdk = sdk
  },
  SET_COLLECTION_ID(state: SnakeState, id: number) {
    state.collectionId = id
  },
  SET_SNAKE_NFT_ID(state: SnakeState, id: number) {
    state.snakeNftId = id
  },
  INCREMENT_TOTAL_GAMES(state: SnakeState) {
    state.totalGames++
  },
}

const actions = {
  async createSnakeCollection({
    state,
    commit,
    rootState,
  }: ActionContext<SnakeState, any>) {
    if (!state.sdk) {
      console.error('SDK not initialized')
      return
    }
    const savedCollectionId = localStorage.getItem('collectionId')
    if (savedCollectionId) {
      state.collectionId = parseInt(savedCollectionId)
      return
    }

    try {
      const collectionTx = await state.sdk.collection.create({
        name: 'Snake Game Collection',
        description: 'Collection of Snake Game NFTs',
        symbol: 'SNAKE',
        tokenPrefix: 'SNK',
        properties: [{ key: 'gameVersion', value: rootState.appVersion }],
        tokenPropertyPermissions: [
          {
            key: 'TotalScore',
            permission: {
              mutable: true,
              collectionAdmin: true,
              tokenOwner: true,
            },
          },
          {
            key: 'GamesPlayed',
            permission: {
              mutable: true,
              collectionAdmin: true,
              tokenOwner: true,
            },
          },
        ],
      })

      console.log(
        'Snake Collection created with ID:',
        collectionTx.result.collectionId
      )
      localStorage.setItem('collectionId', collectionTx.result.collectionId.toString())

      commit('SET_COLLECTION_ID', collectionTx.result.collectionId)
    } catch (error) {
      console.error('Error creating collection:', error)
    }
  },

  async initializeSDK({ commit, rootState }) {
    const sdk = rootState.unique.uniqueChain;
    if (!sdk) {
      throw new Error('UniqueSDK not initialized in unique store');
    }
    commit('SET_SDK', sdk);
  },
  async createSnakeNFT({
    state,
    commit,
    rootState,
  }: ActionContext<SnakeState, any>) {
    // if (!state.collectionId) {
    //   console.error('Collection not created')
    //   return false
    // }

    const collectionId = 4169
    try {
      const mintTx = await rootState.unique.uniqueChain.token.mintNFTs({
        collectionId,
        tokens: [{
          owner: rootState.unique.walletAddress,
          data: {
            image: 'https://crypto-snake.vercel.app/snake.png', // Replace with your actual snake image URL
            attributes: [
              { trait_type: 'TotalScore', value: '0' },
              { trait_type: 'GamesPlayed', value: '0' },
            ]
          }
        }]
      })

      console.log('Snake NFT created with ID:', mintTx.result[0].tokenId)
      commit('SET_SNAKE_NFT_ID', mintTx.result[0].tokenId)
      localStorage.setItem('snakeNftId', mintTx.result[0].tokenId.toString())
      return true
    } catch (error) {
      console.error('Error creating Snake NFT:', error)
      return false
    }
  },

  async updateSnakeNFT({
    state,
    commit,
    rootState,
  }: ActionContext<SnakeState, any>) {
    if (!state.sdk || !state.collectionId || !state.snakeNftId) {
      console.error(
        'SDK not initialized, collection not created, or NFT not minted'
      )
      return
    }

    try {
      await state.sdk.token.setProperties({
        collectionId: state.collectionId,
        tokenId: state.snakeNftId,
        properties: [
          { key: 'Total Score', value: rootState.score.toString() },
          { key: 'Games Played', value: (state.totalGames + 1).toString() },
        ],
      })

      console.log('Snake NFT updated')
      commit('INCREMENT_TOTAL_GAMES')
    } catch (error) {
      console.error('Error updating Snake NFT:', error)
    }
  },

  async initializeSnakeNFT({ commit }) {
    const savedSnakeNftId = localStorage.getItem('snakeNftId');
    if (savedSnakeNftId) {
      commit('SET_SNAKE_NFT_ID', parseInt(savedSnakeNftId));
    }
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
