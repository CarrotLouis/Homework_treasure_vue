import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    currentUser: null,
    users: JSON.parse(localStorage.getItem('treasureUsers') || '[]'),
    gameHistory: JSON.parse(localStorage.getItem('treasureHistory') || '[]'),
    difficulty: 'normal',
    soundEnabled: true
  }),
  
  actions: {
    addUser(user) {
      const newUser = {
        id: Date.now(),
        name: user.name,
        avatar: user.avatar || '🧑',
        totalScore: 0,
        gamesPlayed: 0,
        bestScore: 0,
        createdAt: new Date().toISOString()
      }
      this.users.push(newUser)
      this.saveUsers()
      return newUser
    },
    
    setCurrentUser(user) {
      this.currentUser = user
    },
    
    updateUserScore(userId, score, moves, time) {
      const user = this.users.find(u => u.id === userId)
      if (user) {
        user.totalScore += score
        user.gamesPlayed++
        if (score > user.bestScore) {
          user.bestScore = score
        }
        this.saveUsers()
        
        // 记录游戏历史
        this.gameHistory.push({
          id: Date.now(),
          userId,
          userName: user.name,
          score,
          moves,
          time,
          difficulty: this.difficulty,
          playedAt: new Date().toISOString()
        })
        this.saveHistory()
      }
    },
    
    deleteUser(userId) {
      this.users = this.users.filter(u => u.id !== userId)
      this.saveUsers()
    },
    
    saveUsers() {
      localStorage.setItem('treasureUsers', JSON.stringify(this.users))
    },
    
    saveHistory() {
      localStorage.setItem('treasureHistory', JSON.stringify(this.gameHistory))
    },
    
    setDifficulty(level) {
      this.difficulty = level
    },
    
    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    }
  },
  
  getters: {
    sortedUsers: (state) => {
      return [...state.users].sort((a, b) => b.bestScore - a.bestScore)
    },
    
    recentGames: (state) => {
      return [...state.gameHistory].sort((a, b) => 
        new Date(b.playedAt) - new Date(a.playedAt)
      ).slice(0, 10)
    }
  }
})
