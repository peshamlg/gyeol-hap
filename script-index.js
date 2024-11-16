function openModal() {
  document.getElementById("rulesModal").style.display = "block";
}

function closeModal() {
  document.getElementById("rulesModal").style.display = "none";
}

function showPage(pageNum) {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll(".page-button");

  pages.forEach((page) => page.classList.remove("active"));
  buttons.forEach((button) => button.classList.remove("active"));

  document.getElementById(`page${pageNum}`).classList.add("active");
  buttons[pageNum - 1].classList.add("active");
}

// 모달 외부 클릭시 닫기
window.onclick = function (event) {
  const modal = document.getElementById("rulesModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function checkDailyCompletion() {
  const today = new Date().toLocaleDateString("ko-KR");
  const progress = JSON.parse(localStorage.getItem("dailyProgress") || "{}");

  if (progress.date === today && progress.completed) {
    const elapsedTime = progress.elapsedTime || 0;
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
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
    return true;
  }
  return false;
}
