class Card {
  constructor(shape, bgColor, shapeColor) {
    this.shape = shape;
    this.bgColor = bgColor;
    this.shapeColor = shapeColor;
  }
}

class Game {
  constructor() {
    this.shapes = ["circle", "triangle", "square"];
    this.bgColors = ["black", "gray", "white"];
    this.shapeColors = ["red", "yellow", "blue"];
    this.cards = [];
    this.currentCards = [];
    this.time = 120;
    this.score = 0;
    this.round = 1;
    this.timer = null;
    this.foundSets = [];
    this.messageTimeout = null;
    this.selectedCards = [];
    this.gameOver = false;

    this.generateAllCards();
    this.setupEventListeners();
    this.startNewRound();
    this.startTimer();
  }

  generateAllCards() {
    for (let shape of this.shapes) {
      for (let bgColor of this.bgColors) {
        for (let shapeColor of this.shapeColors) {
          this.cards.push(new Card(shape, bgColor, shapeColor));
        }
      }
    }
  }

  startNewRound() {
    this.currentCards = this.getRandomCards(9);
    this.foundSets = [];
    this.selectedCards = [];
    this.renderCards();
    this.renderFoundSets();
    this.updateRemainingHint();
    document.getElementById("selectedNumbers").textContent = "없음";
  }

  getRandomCards(count) {
    let shuffled = [...this.cards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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
      this.time -= 3;
    } else if (this.checkSet(this.selectedCards)) {
      this.time += 5;
      this.score++;
      this.addFoundSet(this.selectedCards);
      this.showMessage("정답입니다!", "success");
    } else {
      this.time -= 3;
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
        this.time += 20;
        this.round++;
        this.score += 3;
        this.showMessage("정확한 결! 다음 라운드로 진행합니다.", "success");
        this.startNewRound();
      } else {
        this.time -= 5;
        this.score--;
        this.showMessage("아직 찾을 수 있는 합이 남아있습니다!");
      }
    });
  }

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.time--;
      document.getElementById("time").textContent = this.time;
      document.getElementById("score").textContent = this.score;
      document.getElementById("round").textContent = this.round;

      if (this.time <= 0) {
        clearInterval(this.timer);
        this.gameOver = true;
        alert(`게임 종료!\n완료한 라운드: ${this.round}\n점수: ${this.score}`);
        window.location.href = "index.html";
      }
    }, 1000);
  }

  updateRemainingHint() {
    const remaining = this.findAllSets().length - this.foundSets.length;
    document.getElementById(
      "remainingHint"
    ).textContent = `남은 합: ${remaining}개`;
  }
}

new Game();
