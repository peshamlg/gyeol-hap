class Card {
  constructor(shape, bgColor, shapeColor) {
    this.shape = shape;
    this.bgColor = bgColor;
    this.shapeColor = shapeColor;
  }
}

class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Game 클래스 외부에 전역 함수로 추가
function checkDailyCompletion() {
  const today = new Date().toLocaleDateString("ko-KR");
  const progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");

  if (progress.date === today && progress.completed) {
    const minutes = Math.floor(progress.elapsedTime / 60);
    const seconds = progress.elapsedTime % 60;
    const timeString = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

    alert(
      `오늘의 도전을 이미 완료했습니다!\n\n` +
        `[오늘의 기록]\n` +
        `최종 점수: ${progress.score}점\n` +
        `소요 시간: ${timeString}\n\n` +
        `내일 다시 도전해주세요!`
    );
    window.location.href = "index.html";
    return true;
  }
  return false;
}

class Game {
  constructor() {
    if (checkDailyCompletion()) return;

    this.shapes = ["circle", "triangle", "square"];
    this.bgColors = ["black", "gray", "white"];
    this.shapeColors = ["red", "yellow", "blue"];
    this.cards = [];
    this.currentCards = [];
    this.score = 0;
    this.timer = null;
    this.foundSets = [];
    this.messageTimeout = null;
    this.selectedCards = [];
    this.gameOver = false;
    this.startTime = new Date();
    this.elapsedTime = 0;
    this.stage = 1;

    this.generateAllCards();
    this.seededRandom = this.initializeSeededRandom();
    this.dailyPuzzles = this.generateDailyPuzzles();
    this.dailyAttempted = this.checkDailyAttempt();
    this.dailyProgress = this.loadDailyProgress();
    this.startTime = this.dailyProgress.startTime
      ? new Date(this.dailyProgress.startTime)
      : new Date();
    this.stage = this.dailyProgress.stage || 1;
    this.score = this.dailyProgress.score || 0;
    this.foundSets = this.dailyProgress.foundSets?.[this.stage - 1] || [];

    if (this.dailyAttempted && this.dailyProgress.completed) {
      alert("오늘은 이미 데일리 모드를 완료했습니다. 내일 다시 도전해주세요!");
      window.location.href = "index.html";
      return;
    }

    this.setupGame();
  }

  setupGame() {
    this.generateAllCards();
    this.setupEventListeners();
    this.startNewRound();
    this.startTimer();
  }

  checkDailyAttempt() {
    const lastAttempt = localStorage.getItem("lastDailyAttempt");
    const today = new Date().toLocaleDateString("ko-KR");
    return lastAttempt === today;
  }

  saveDailyAttempt() {
    const today = new Date().toLocaleDateString("ko-KR");
    localStorage.setItem("lastDailyAttempt", today);

    // 기록 저장
    const record = {
      date: today,
      score: this.score,
      time: this.elapsedTime,
    };

    const records = JSON.parse(localStorage.getItem("dailyRecords") || "[]");
    records.push(record);
    localStorage.setItem("dailyRecords", JSON.stringify(records));
  }

  generateAllCards() {
    this.cards = [];
    for (let shape of this.shapes) {
      for (let bgColor of this.bgColors) {
        for (let shapeColor of this.shapeColors) {
          this.cards.push(new Card(shape, bgColor, shapeColor));
        }
      }
    }
  }

  startNewRound() {
    this.currentCards = this.dailyPuzzles[this.stage - 1];
    this.selectedCards = [];

    // foundSets 데이터 구조 보장
    const stageFoundSets = this.dailyProgress.foundSets?.[this.stage - 1];
    this.foundSets = Array.isArray(stageFoundSets) ? stageFoundSets : [];

    this.renderCards();
    this.renderFoundSets();
    this.updateRemainingHint();
    document.getElementById("selectedNumbers").textContent = "없음";
    this.saveDailyProgress();
  }

  initializeSeededRandom() {
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    return new SeededRandom(seed);
  }

  generateDailyPuzzles() {
    const puzzles = [];
    for (let i = 0; i < 3; i++) {
      const shuffledCards = this.seededRandom.shuffle([...this.cards]);
      puzzles.push(shuffledCards.slice(0, 9));
    }
    return puzzles;
  }

  renderCards() {
    const container = document.getElementById("cardsContainer");
    container.innerHTML = "";

    this.currentCards.forEach((card, index) => {
      const cardElement = document.createElement("div");
      cardElement.className = "card";
      cardElement.style.backgroundColor = card.bgColor;

      if (this.selectedCards.includes(index + 1)) {
        cardElement.classList.add("selected");
      }

      const number = document.createElement("div");
      number.className = "card-number";
      number.textContent = index + 1;

      const shape = document.createElement("div");
      shape.className = `shape ${card.shape}`;
      shape.style.backgroundColor = card.shapeColor;

      cardElement.addEventListener("click", () =>
        this.handleCardClick(index + 1)
      );

      cardElement.appendChild(number);
      cardElement.appendChild(shape);
      container.appendChild(cardElement);
    });
  }

  handleCardClick(cardNumber) {
    if (this.gameOver) return;

    const cardIndex = this.selectedCards.indexOf(cardNumber);

    if (cardIndex !== -1) {
      this.selectedCards.splice(cardIndex, 1);
    } else if (this.selectedCards.length < 3) {
      this.selectedCards.push(cardNumber);

      if (this.selectedCards.length === 3) {
        this.checkSelectedSet();
      }
    }

    document.getElementById("selectedNumbers").textContent =
      this.selectedCards.length > 0 ? this.selectedCards.join(", ") : "없음";

    this.renderCards();
  }

  checkSelectedSet() {
    if (this.isSetAlreadyFound(this.selectedCards)) {
      this.showMessage("이미 제출한 합입니다!");
    } else if (this.checkSet(this.selectedCards)) {
      this.score++;
      this.addFoundSet(this.selectedCards);
      this.showMessage("정답입니다!", "success");
    } else {
      this.score--;
      this.showMessage("틀렸습니다. 다시 시도해주세요.");
    }
    this.selectedCards = [];
    document.getElementById("selectedNumbers").textContent = "없음";
  }

  checkSet(indices) {
    const cards = indices.map((i) => this.currentCards[i - 1]);

    const isValidSet = (property) => {
      const values = cards.map((card) => card[property]);
      return new Set(values).size === 1 || new Set(values).size === 3;
    };

    return (
      isValidSet("shape") && isValidSet("bgColor") && isValidSet("shapeColor")
    );
  }

  findAllSets() {
    const sets = [];
    for (let i = 0; i < this.currentCards.length - 2; i++) {
      for (let j = i + 1; j < this.currentCards.length - 1; j++) {
        for (let k = j + 1; k < this.currentCards.length; k++) {
          if (this.checkSet([i + 1, j + 1, k + 1])) {
            sets.push([i + 1, j + 1, k + 1]);
          }
        }
      }
    }
    return sets;
  }

  isSetAlreadyFound(newSet) {
    const sortedNewSet = [...newSet].sort((a, b) => a - b);
    return this.foundSets.some(
      (existingSet) =>
        JSON.stringify(existingSet.sort()) === JSON.stringify(sortedNewSet)
    );
  }

  addFoundSet(set) {
    this.foundSets.push(set);
    this.renderFoundSets();
    this.updateRemainingHint();
    this.saveDailyProgress();
  }

  renderFoundSets() {
    const container = document.getElementById("foundSets");
    container.innerHTML = "";

    this.foundSets.forEach((set, index) => {
      const setElement = document.createElement("div");
      setElement.className = "found-set";
      setElement.textContent = `${index + 1}번째 합: ${set.join(", ")}`;
      container.appendChild(setElement);
    });
  }

  showMessage(text, type = "error") {
    const messageEl = document.getElementById("message");
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;

    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    this.messageTimeout = setTimeout(() => {
      messageEl.className = "message";
    }, 2000);
  }

  setupEventListeners() {
    document.getElementById("gyeol").addEventListener("click", () => {
      if (this.gameOver) return;

      const allPossibleSets = this.findAllSets();
      const foundSetsCount = this.foundSets.length;

      if (allPossibleSets.length === foundSetsCount) {
        this.score += 3;

        if (this.stage < 3) {
          this.stage++;
          this.showMessage("정확한 결! 다음 스테이지로 진행합니다.", "success");
          this.startNewRound();
        } else {
          this.gameOver = true;
          this.elapsedTime = Math.floor((new Date() - this.startTime) / 1000);
          const progress = {
            ...this.dailyProgress,
            completed: true,
            elapsedTime: this.elapsedTime,
            score: this.score,
          };
          localStorage.setItem("dailyProgress", JSON.stringify(progress));

          // 데일리 모드 기록 업데이트
          const currentRecord = JSON.parse(
            localStorage.getItem("dailyRecord") || "{}"
          );
          if (!currentRecord.time || this.elapsedTime < currentRecord.time) {
            localStorage.setItem(
              "dailyRecord",
              JSON.stringify({
                time: this.elapsedTime,
                score: this.score,
              })
            );
          }

          const minutes = Math.floor(this.elapsedTime / 60);
          const seconds = this.elapsedTime % 60;
          const timeString = `${String(minutes).padStart(2, "0")}:${String(
            seconds
          ).padStart(2, "0")}`;

          alert(
            `게임 완료!\n\n` +
              `[오늘의 기록]\n` +
              `최종 점수: ${this.score}점\n` +
              `소요 시간: ${timeString}`
          );
          window.location.href = "index.html";
        }
      } else {
        this.score--;
        this.saveDailyProgress();
        this.showMessage("아직 찾을 수 있는 합이 남아있습니다!");
      }
    });

    // 페이지 이탈 시 진행상황 저장
    window.addEventListener("beforeunload", () => {
      this.saveDailyProgress();
    });
  }

  startTimer() {
    this.timer = setInterval(() => {
      const now = new Date();
      this.elapsedTime = Math.floor((now - this.startTime) / 1000);

      const minutes = Math.floor(this.elapsedTime / 60);
      const seconds = this.elapsedTime % 60;
      document.getElementById("elapsedTime").textContent = `${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      document.getElementById("score").textContent = this.score;
      document.getElementById("stage").textContent = this.stage;
    }, 1000);
  }

  updateRemainingHint() {
    const remaining = this.findAllSets().length - this.foundSets.length;
    document.getElementById(
      "remainingHint"
    ).textContent = `남은 합: ${remaining}개`;
  }

  loadDailyProgress() {
    const today = new Date().toLocaleDateString("ko-KR");
    const progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");

    // 기본 progress 객체
    const defaultProgress = {
      date: today,
      startTime: new Date().toISOString(),
      stage: 1,
      score: 0,
      foundSets: [[], [], []],
      completed: false,
    };

    // 날짜가 다르거나 progress가 없는 경우
    if (progress.date !== today) {
      return defaultProgress;
    }

    // foundSets 데이터 구조 검증 및 복구
    if (!Array.isArray(progress.foundSets)) {
      progress.foundSets = [[], [], []];
    } else {
      // 각 스테이지의 foundSets가 배열인지 확인
      progress.foundSets = progress.foundSets.map((sets) =>
        Array.isArray(sets) ? sets : []
      );

      // 3개의 스테이지를 보장
      while (progress.foundSets.length < 3) {
        progress.foundSets.push([]);
      }
    }

    return {
      ...defaultProgress,
      ...progress,
      startTime: progress.startTime || defaultProgress.startTime,
    };
  }

  saveDailyProgress() {
    // foundSets 데이터 구조 보장
    const allFoundSets = Array.isArray(this.dailyProgress.foundSets)
      ? this.dailyProgress.foundSets
      : [[], [], []];

    // 현재 스테이지의 foundSets 업데이트
    allFoundSets[this.stage - 1] = Array.isArray(this.foundSets)
      ? this.foundSets
      : [];

    // 현재까지의 경과 시간 계산
    this.elapsedTime = Math.floor((new Date() - this.startTime) / 1000);

    const progress = {
      date: new Date().toLocaleDateString("ko-KR"),
      startTime: this.startTime.toISOString(),
      stage: this.stage,
      score: this.score,
      foundSets: allFoundSets,
      completed: this.gameOver,
      elapsedTime: this.elapsedTime,
    };

    localStorage.setItem("dailyProgress", JSON.stringify(progress));
    this.dailyProgress = progress;
  }
}

// 페이지 로드 시 완료 여부 체크
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkDailyCompletion);
} else {
  checkDailyCompletion();
}

new Game();
