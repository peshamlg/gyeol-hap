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
    this.hiddenCard = null;
    this.score = 0;
    this.round = 1;
    this.messageTimeout = null;
    this.foundTiles = new Set();
    this.possibleTiles = new Set();
    this.targetSets = 0;

    this.generateAllCards();
    this.setupEventListeners();
    this.startNewRound();
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
    this.hiddenCard = this.currentCards[4];
    this.foundTiles.clear();
    this.targetSets = this.findAllSets().length;
    this.findAllPossibleTiles();
    this.renderCards();
    this.updateFoundTiles();
    document.getElementById("targetSets").textContent = this.targetSets;
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

      if (index === 4) {
        cardElement.classList.add("hidden-card");
      } else {
        cardElement.style.backgroundColor = card.bgColor;
        const shape = document.createElement("div");
        shape.className = `shape ${card.shape}`;
        shape.style.backgroundColor = card.shapeColor;
        cardElement.appendChild(shape);
      }

      const number = document.createElement("div");
      number.className = "card-number";
      number.textContent = index + 1;

      cardElement.appendChild(number);
      container.appendChild(cardElement);
    });
  }

  findAllPossibleTiles() {
    this.possibleTiles.clear();
    const originalCard = this.currentCards[4];
    const visibleCards = this.currentCards.filter((_, index) => index !== 4);

    for (let shape of this.shapes) {
      for (let bgColor of this.bgColors) {
        for (let shapeColor of this.shapeColors) {
          const isDuplicate = visibleCards.some(
            (card) =>
              card.shape === shape &&
              card.bgColor === bgColor &&
              card.shapeColor === shapeColor
          );

          if (!isDuplicate) {
            this.currentCards[4] = new Card(shape, bgColor, shapeColor);
            if (this.findAllSets().length === this.targetSets) {
              this.possibleTiles.add(
                JSON.stringify({ shape, bgColor, shapeColor })
              );
            }
          }
        }
      }
    }

    this.currentCards[4] = originalCard;
  }

  findAllSets(fixedCard = null) {
    const currentCard = this.currentCards[4];
    if (fixedCard) {
      this.currentCards[4] = fixedCard;
    }

    const sets = [];
    for (let i = 0; i < this.currentCards.length - 2; i++) {
      for (let j = i + 1; j < this.currentCards.length - 1; j++) {
        for (let k = j + 1; k < this.currentCards.length; k++) {
          if (
            this.checkSet([
              this.currentCards[i],
              this.currentCards[j],
              this.currentCards[k],
            ])
          ) {
            sets.push([i + 1, j + 1, k + 1]);
          }
        }
      }
    }

    if (fixedCard) {
      this.currentCards[4] = currentCard;
    }
    return sets;
  }

  checkGuess(shapeGuess, bgColorGuess, shapeColorGuess) {
    if (!shapeGuess || !bgColorGuess || !shapeColorGuess) {
      this.showMessage("모든 속성을 선택해주세요!");
      return;
    }

    const visibleCards = this.currentCards.filter((_, index) => index !== 4);
    const isDuplicate = visibleCards.some(
      (card) =>
        card.shape === shapeGuess &&
        card.bgColor === bgColorGuess &&
        card.shapeColor === shapeColorGuess
    );

    if (isDuplicate) {
      this.showMessage("이미 게임판에 있는 타일입니다!");
      return;
    }

    const guessKey = JSON.stringify({
      shape: shapeGuess,
      bgColor: bgColorGuess,
      shapeColor: shapeColorGuess,
    });

    const originalCard = this.currentCards[4];
    this.currentCards[4] = new Card(shapeGuess, bgColorGuess, shapeColorGuess);
    const guessSets = this.findAllSets().length;
    this.currentCards[4] = originalCard;

    if (guessSets !== this.targetSets) {
      this.showMessage(
        `이 타일로는 ${guessSets}개의 합이 만들어집니다. (목표: ${this.targetSets}개)`
      );
      return;
    }

    if (this.foundTiles.has(guessKey)) {
      this.showMessage("이미 찾은 타일입니다!");
      return;
    }

    this.foundTiles.add(guessKey);
    this.score++;
    document.getElementById("score").textContent = this.score;
    this.showMessage("가능한 타일을 찾았습니다!", "success");
    this.updateFoundTiles();
  }

  updateFoundTiles() {
    const container = document.getElementById("foundTiles");
    container.innerHTML = "";

    Array.from(this.foundTiles).forEach((tileStr) => {
      const tile = JSON.parse(tileStr);
      const tileElement = document.createElement("div");
      tileElement.className = "found-set";

      // 카드 요소 생성
      const cardElement = document.createElement("div");
      cardElement.className = "card";
      cardElement.style.backgroundColor = tile.bgColor;

      // 도형 요소 생성
      const shape = document.createElement("div");
      shape.className = `shape ${tile.shape}`;
      shape.style.backgroundColor = tile.shapeColor;

      cardElement.appendChild(shape);
      tileElement.appendChild(cardElement);
      container.appendChild(tileElement);
    });

    // 가능한 타일의 개수와 찾은 타일의 개수를 줄바꿈하여 표시
    document.getElementById(
      "totalSets"
    ).innerHTML = `가능한 타일: ${this.possibleTiles.size}개<br>찾은 타일: ${this.foundTiles.size}개`;
  }

  checkSet(cards) {
    const isValidSet = (property) => {
      const values = cards.map((card) => card[property]);
      return new Set(values).size === 1 || new Set(values).size === 3;
    };

    return (
      isValidSet("shape") && isValidSet("bgColor") && isValidSet("shapeColor")
    );
  }

  updateTotalSets() {
    const totalSets = this.findAllSets().length;
    document.getElementById("totalSets").textContent = `총 합: ${totalSets}개`;
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
    document.getElementById("submitGuess").addEventListener("click", () => {
      const shapeGuess = document.getElementById("shapeGuess").value;
      const bgColorGuess = document.getElementById("bgColorGuess").value;
      const shapeColorGuess = document.getElementById("shapeColorGuess").value;
      this.checkGuess(shapeGuess, bgColorGuess, shapeColorGuess);
    });

    document.getElementById("gyeol").addEventListener("click", () => {
      if (this.foundTiles.size === this.possibleTiles.size) {
        this.score++;
        this.round++;
        this.showMessage("정확한 결! 다음 라운드로 진행합니다.", "success");
        this.startNewRound();
      } else {
        this.showMessage("아직 찾지 못한 타일이 있습니다!");
      }
    });
  }
}

new Game();
