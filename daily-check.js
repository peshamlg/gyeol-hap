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
