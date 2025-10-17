
let currentUser = null
let currentQuiz = null
let currentQuestionIndex = 0
let userAnswers = []
let score = 0
const userData = JSON.parse(localStorage.getItem("quizAppUsers")) || {}
const leaderboardData = JSON.parse(localStorage.getItem("quizAppLeaderboard")) || []

// DOM Elements
const authSection = document.getElementById("auth-section")
const mainApp = document.getElementById("main-app")

// form containers
const loginContainer = document.getElementById("login-form")
const signupContainer = document.getElementById("signup-form")

// actual form elements
const loginFormEl = document.getElementById("loginForm")
const signupFormEl = document.getElementById("signupForm")

// Categories and Questions


// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
})

function initializeApp() {
  const savedUser = localStorage.getItem("currentUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    showMainApp()
  } else {
    showAuthSection()
  }
}

function setupEventListeners() {
  // Auth form switching
  document.getElementById("showSignup").addEventListener("click", (e) => {
    e.preventDefault()
    showSignupForm()
  })
  document.getElementById("showLogin").addEventListener("click", (e) => {
    e.preventDefault()
    showLoginForm()
  })

  // Form submissions
  loginFormEl.addEventListener("submit", handleLogin)
  signupFormEl.addEventListener("submit", handleSignup)

  // Navigation
  document.getElementById("homeBtn").addEventListener("click", () => showSection("home"))
  document.getElementById("profileBtn").addEventListener("click", () => showSection("profile"))
  document.getElementById("leaderboardBtn").addEventListener("click", () => showSection("leaderboard"))
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  // Quiz controls
  document.getElementById("prevBtn").addEventListener("click", previousQuestion)
  document.getElementById("nextBtn").addEventListener("click", nextQuestion)
  document.getElementById("retakeBtn").addEventListener("click", retakeQuiz)
  document.getElementById("homeBtn2").addEventListener("click", () => showSection("home"))
  document.getElementById("certificateBtn").addEventListener("click", showCertificate)

  // Certificate modal
  document.getElementById("closeCertificate").addEventListener("click", closeCertificate)
  document.getElementById("downloadCertificate").addEventListener("click", downloadCertificate)
}

// ================== AUTH ==================
function showAuthSection() {
  authSection.classList.remove("hidden")
  mainApp.classList.add("hidden")
}

function showMainApp() {
  authSection.classList.add("hidden")
  mainApp.classList.remove("hidden")
  updateWelcomeMessage()
  renderCategories()
  updateProfile()
  updateLeaderboard()
}

function showLoginForm() {
  loginContainer.classList.add("active")
  signupContainer.classList.remove("active")
}

function showSignupForm() {
  signupContainer.classList.add("active")
  loginContainer.classList.remove("active")
}

function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  if (userData[email] && userData[email].password === password) {
    currentUser = userData[email]
    localStorage.setItem("currentUser", JSON.stringify(currentUser))
    showMainApp()
    e.target.reset()
  } else {
    alert("Invalid email or password")
  }
}

function handleSignup(e) {
  e.preventDefault()
  const name = document.getElementById("signupName").value
  const email = document.getElementById("signupEmail").value
  const password = document.getElementById("signupPassword").value

  if (userData[email]) {
    alert("User already exists")
    return
  }

  const newUser = {
    name: name,
    email: email,
    password: password,
    stats: {
      totalQuizzes: 0,
      totalScore: 0,
      bestScore: 0,
      badges: [],
    },
  }

  userData[email] = newUser
  currentUser = newUser

  localStorage.setItem("quizAppUsers", JSON.stringify(userData))
  localStorage.setItem("currentUser", JSON.stringify(currentUser))

  showMainApp()
  e.target.reset()
}

function handleLogout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  showAuthSection()
  showLoginForm()
}

// ================== NAVIGATION ==================
function showSection(sectionName) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  document.getElementById(`${sectionName}-section`).classList.add("active")
  document.getElementById(`${sectionName}Btn`).classList.add("active")

  if (sectionName === "profile") {
    updateProfile()
  } else if (sectionName === "leaderboard") {
    updateLeaderboard()
  }
}

function updateWelcomeMessage() {
  document.getElementById("welcomeMessage").textContent = `Welcome back, ${currentUser.name}!`
}

// ================== QUIZ ==================
function renderCategories() {
  const categoriesGrid = document.getElementById("categoriesGrid")
  categoriesGrid.innerHTML = ""

  categories.forEach((category) => {
    const categoryCard = document.createElement("div")
    categoryCard.className = "category-card"
    categoryCard.innerHTML = `
      <div class="category-header">
        <span class="category-icon">${category.icon}</span>
        <h3>${category.name}</h3>
      </div>
      <p>${category.description}</p>
      <button class="btn btn-primary">Start Quiz</button>
    `
    categoryCard.addEventListener("click", () => startQuiz(category.id))
    categoriesGrid.appendChild(categoryCard)
  })
}

function startQuiz(categoryId) {
  const categoryQuestions = quizQuestions.filter((q) => q.category === categoryId)
  currentQuiz = {
    category: categoryId,
    questions: shuffleArray([...categoryQuestions]).slice(0, 10),
  }
  currentQuestionIndex = 0
  userAnswers = []
  score = 0
  showSection("quiz")
  renderQuestion()
}
function renderQuestion() {
  const question = currentQuiz.questions[currentQuestionIndex]
  document.getElementById("questionText").textContent = question.question
  document.getElementById("questionCounter").textContent =
    `${currentQuestionIndex + 1} / ${currentQuiz.questions.length}`
  document.getElementById("currentScore").textContent = score

  const progress = ((currentQuestionIndex +1) / currentQuiz.questions.length) * 100
  document.getElementById("progressFill").style.width = `${progress}%`

  const optionsContainer = document.getElementById("optionsContainer")
  optionsContainer.innerHTML = ""
  question.options.forEach((option, index) => {
    const optionBtn = document.createElement("button")
    optionBtn.className = "option-btn"
    optionBtn.textContent = option
    optionBtn.addEventListener("click", () => selectOption(index))
    optionsContainer.appendChild(optionBtn)
  })

  document.getElementById("prevBtn").disabled = currentQuestionIndex === 0
  document.getElementById("nextBtn").textContent =
    currentQuestionIndex === currentQuiz.questions.length - 1 ? "Finish Quiz" : "Next"

  document.getElementById("questionFeedback").classList.remove("show")
}

function selectOption(selectedIndex) {
  const question = currentQuiz.questions[currentQuestionIndex]
  const options = document.querySelectorAll(".option-btn")
  options.forEach((btn) => btn.classList.remove("selected", "correct", "incorrect"))
  options[selectedIndex].classList.add("selected")
  userAnswers[currentQuestionIndex] = selectedIndex

  setTimeout(() => {
    const isCorrect = selectedIndex === question.correctAnswer
    options.forEach((btn, index) => {
      if (index === question.correctAnswer) btn.classList.add("correct")
      else if (index === selectedIndex && !isCorrect) btn.classList.add("incorrect")
    })

    const feedback = document.getElementById("questionFeedback")
    feedback.textContent = question.explanation
    feedback.className = `question-feedback show ${isCorrect ? "correct" : "incorrect"}`

    if (isCorrect) {
      score += 10
      document.getElementById("currentScore").textContent = score
    }
  }, 500)
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--
    renderQuestion()
  }
}

function nextQuestion() {
  if (currentQuestionIndex < currentQuiz.questions.length - 1) {
    currentQuestionIndex++
    renderQuestion()
  } else {
    finishQuiz()
  }
}

function finishQuiz() {
  currentUser.stats.totalQuizzes++
  currentUser.stats.totalScore += score
  if (score > currentUser.stats.bestScore) currentUser.stats.bestScore = score

  if (score === 100 && !currentUser.stats.badges.includes("Perfect Score")) {
    currentUser.stats.badges.push("Perfect Score")
  }
  if (currentUser.stats.totalQuizzes >= 10 && !currentUser.stats.badges.includes("Quiz Master")) {
    currentUser.stats.badges.push("Quiz Master")
  }

  updateLeaderboardData()
  userData[currentUser.email] = currentUser
  localStorage.setItem("quizAppUsers", JSON.stringify(userData))
  localStorage.setItem("currentUser", JSON.stringify(currentUser))

  showResults()
}

function showResults() {
  const correctAnswers = userAnswers.filter(
    (ans, idx) => ans === currentQuiz.questions[idx].correctAnswer
  ).length
  const accuracy = Math.round((correctAnswers / currentQuiz.questions.length) * 100)

  document.getElementById("finalScore").textContent = score
  document.getElementById("correctAnswers").textContent = correctAnswers
  document.getElementById("totalQuestions").textContent = currentQuiz.questions.length
  document.getElementById("accuracy").textContent = `${accuracy}%`

  const certificateBtn = document.getElementById("certificateBtn")
  if (accuracy >= 70) certificateBtn.style.display = "inline-block"
  else certificateBtn.style.display = "none"

  showSection("results")
}

function retakeQuiz() {
  if (currentQuiz) startQuiz(currentQuiz.category)
}

// ================== PROFILE ==================
function updateProfile() {
  document.getElementById("profileName").textContent = currentUser.name
  document.getElementById("profileEmail").textContent = currentUser.email
  document.getElementById("profileInitials").textContent = currentUser.name.charAt(0).toUpperCase()

  document.getElementById("totalQuizzes").textContent = currentUser.stats.totalQuizzes
  document.getElementById("averageScore").textContent =
    currentUser.stats.totalQuizzes > 0
      ? Math.round(currentUser.stats.totalScore / currentUser.stats.totalQuizzes) + "%"
      : "0%"
  document.getElementById("bestScore").textContent = currentUser.stats.bestScore + "%"

  const badgesContainer = document.getElementById("badgesContainer")
  badgesContainer.innerHTML = ""
  if (currentUser.stats.badges.length === 0) {
    badgesContainer.innerHTML = "<p>No badges earned yet. Keep taking quizzes!</p>"
  } else {
    currentUser.stats.badges.forEach((badge) => {
      const badgeEl = document.createElement("span")
      badgeEl.className = "badge"
      badgeEl.textContent = badge
      badgesContainer.appendChild(badgeEl)
    })
  }
}

// ================== LEADERBOARD ==================
function updateLeaderboardData() {
  const existingEntry = leaderboardData.find((e) => e.email === currentUser.email)
  if (existingEntry) {
    existingEntry.bestScore = Math.max(existingEntry.bestScore, score)
    existingEntry.totalQuizzes = currentUser.stats.totalQuizzes
  } else {
    leaderboardData.push({
      name: currentUser.name,
      email: currentUser.email,
      bestScore: score,
      totalQuizzes: currentUser.stats.totalQuizzes,
    })
  }
  leaderboardData.sort((a, b) => b.bestScore - a.bestScore)
  localStorage.setItem("quizAppLeaderboard", JSON.stringify(leaderboardData))
}

function updateLeaderboard() {
  const leaderboardList = document.getElementById("leaderboardList")
  leaderboardList.innerHTML = ""
  if (leaderboardData.length === 0) {
    leaderboardList.innerHTML = "<p>No leaderboard data yet. Be the first to take a quiz!</p>"
    return
  }
  leaderboardData.slice(0, 10).forEach((entry, index) => {
    const entryEl = document.createElement("div")
    entryEl.className = "leaderboard-entry"
    entryEl.innerHTML = `
      <div class="rank">#${index + 1}</div>
      <div class="player-info">
        <div class="player-name">${entry.name}</div>
        <div>Quizzes: ${entry.totalQuizzes}</div>
      </div>
      <div class="player-score">${entry.bestScore}%</div>
    `
    leaderboardList.appendChild(entryEl)
  })
}

// ================== CERTIFICATE ==================
function showCertificate() {
  const categoryName = categories.find((c) => c.id === currentQuiz.category).name
  const accuracy = Math.round(
    (userAnswers.filter((ans, idx) => ans === currentQuiz.questions[idx].correctAnswer).length /
      currentQuiz.questions.length) * 100
  )
  document.getElementById("certificateName").textContent = currentUser.name
  document.getElementById("certificateCategory").textContent = categoryName
  document.getElementById("certificateScore").textContent = `${accuracy}%`
  document.getElementById("certificateDate").textContent = new Date().toLocaleDateString()
  document.getElementById("certificateModal").classList.add("show")
}

function closeCertificate() {
  document.getElementById("certificateModal").classList.remove("show")
}

function downloadCertificate() {
  alert("Certificate download feature would be implemented here!")
}

// ================== UTILS ==================
function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
