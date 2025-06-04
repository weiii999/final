  let video;
  let handpose;
  let predictions = [];

  let optionCount = 4;
  let optionLabels = ["教學原理", "平面設計", "程式設計", "2D繪圖"];
  let optionList = [];
  let boxes = [];
  let boxLabels = ["顧大維老師", "陳慶帆老師", "賴婷鈴老師", "林逸農老師"];
  let hoveredBox = -1;

  let showResult = false;
  let correctCount = 0;

  function setup() {
    createCanvas(windowWidth, windowHeight);
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.style('transform', 'scale(-1, 1)');
    video.hide();

    handpose = ml5.handpose(video, modelReady);
    handpose.on("predict", results => {
      predictions = results;
    });

    // 上方四個選項
    let optionWidth = 120, optionHeight = 60, optionGap = 60;
    let totalOptionWidth = optionWidth * optionCount + optionGap * (optionCount - 1);
    let optionStartX = (width - totalOptionWidth) / 2;
    let optionY = 100;
    optionList = [];
    for (let i = 0; i < optionCount; i++) {
      optionList.push({
        text: optionLabels[i],
        x: optionStartX + i * (optionWidth + optionGap),
        y: optionY,
        width: optionWidth,
        height: optionHeight,
        dragging: false,
        offsetX: 0,
        offsetY: 0,
        dropped: false,
        boxIndex: null
      });
    }

    // 下方四個半透明方框
    let boxWidth = 150, boxHeight = 100, boxGap = 60;
    let totalBoxWidth = boxWidth * optionCount + boxGap * (optionCount - 1);
    let boxStartX = (width - totalBoxWidth) / 2;
    let boxY = height - boxHeight - 60;
    boxes = [];
    for (let i = 0; i < optionCount; i++) {
      boxes.push({
        x: boxStartX + i * (boxWidth + boxGap),
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        label: boxLabels[i]
      });
    }
  }

  function modelReady() {
    console.log("Handpose model loaded!");
  }

  function draw() {
    background(0); // 改為黑色背景

    const scaleFactor = 2;
    const videoWidth = video.width * scaleFactor;
    const videoHeight = video.height * scaleFactor;
    const xOffset = (width - videoWidth) / 2;
    const yOffset = (height - videoHeight) / 2;

    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, width - xOffset - videoWidth, yOffset, videoWidth, videoHeight);
    pop();

    drawBoxes();
    drawOptions();
    drawKeypoints();
    handleDragging();

    // 判斷是否全部選項都已放入方框且只顯示一次結果
    if (!showResult && optionList.every(opt => opt.dropped)) {
      showResult = true;
      correctCount = checkAnswers();
    }

    if (showResult) {
      drawResult();
    }

    drawQuestion();
  }

  function drawQuestion() {
    push();
    fill(255);
    noStroke();
    let cardWidth = 420, cardHeight = 60;
    let cardX = (width - cardWidth) / 2;
    let cardY = 20;
    rect(cardX, cardY, cardWidth, cardHeight, 15);
    textAlign(CENTER, CENTER);
    textSize(28);
    textFont('sans-serif');
    fill(30, 60, 120);
    text("請將課程與任課老師進行配對", width / 2, cardY + cardHeight / 2);
    pop();
  }

  function drawBoxes() {
    hoveredBox = -1;
    textAlign(CENTER, TOP);
    textSize(22);
    textFont('sans-serif');
    for (let i = 0; i < boxes.length; i++) {
      let box = boxes[i];
      push();
      let hasOption = optionList.some(opt => opt.dropped && opt.boxIndex === i);
      if (hasOption) {
        fill(0, 200, 100, 80);
      } else {
        fill(100, 100, 100, 80);
      }
      stroke(30, 60, 120);
      strokeWeight(6);
      rect(box.x, box.y, box.width, box.height, 15);

      // 白色底的標籤
      let labelW = textWidth(box.label) + 24;
      let labelH = 32;
      let labelX = box.x + box.width / 2 - labelW / 2;
      let labelY = box.y + box.height + 4;
      fill(255);
      noStroke();
      rect(labelX, labelY, labelW, labelH, 8);

      fill(30, 60, 120);
      textAlign(CENTER, CENTER);
      textSize(22);
      textFont('sans-serif');
      text(box.label, box.x + box.width / 2, box.y + box.height + 4 + labelH / 2);
      pop();
    }
  }

  function drawOptions() {
    textFont('sans-serif');
    textAlign(CENTER, CENTER);
    textSize(22);
    for (let opt of optionList) {
      push();
      fill(255);
      stroke(30, 60, 120);
      strokeWeight(6);
      rect(opt.x, opt.y, opt.width, opt.height, 10);

      // 白色底的標籤（與方框下方老師名稱一致）
      let labelW = textWidth(opt.text) + 24;
      let labelH = 32;
      let labelX = opt.x + opt.width / 2 - labelW / 2;
      let labelY = opt.y + opt.height / 2 - labelH / 2;
      fill(255);
      noStroke();
      rect(labelX, labelY, labelW, labelH, 8);

      fill(30, 60, 120);
      text(opt.text, opt.x + opt.width / 2, opt.y + opt.height / 2);
      pop();
    }
  }

  function drawResult() {
    push();
    fill(255, 240);
    stroke(100);
    strokeWeight(3);
    let cardWidth = 320, cardHeight = 100;
    let cardX = (width - cardWidth) / 2;
    let cardY = (height - cardHeight) / 2;
    rect(cardX, cardY, cardWidth, cardHeight, 20);
    textAlign(CENTER, CENTER);
    textSize(32);
    textFont('sans-serif');
    fill(50);
    text(`答對題數：${correctCount} / 4`, width / 2, cardY + cardHeight / 2);
    pop();
  }

  function handleDragging() {
    for (let opt of optionList) {
      // 若已放入方框，直接固定在方框正中心且不可再拖曳，且不再進行任何拖曳判斷
      if (opt.dropped && opt.boxIndex !== null && boxes[opt.boxIndex]) {
        let box = boxes[opt.boxIndex];
        opt.x = box.x + (box.width - opt.width) / 2;
        opt.y = box.y + (box.height - opt.height) / 2;
        opt.dragging = false; // 強制取消拖曳狀態
        continue;
      }

      if (predictions.length > 0) {
        const scaleFactor = 2;
        const videoWidth = video.width * scaleFactor;
        const videoHeight = video.height * scaleFactor;
        const xOffset = (width - videoWidth) / 2;
        const yOffset = (height - videoHeight) / 2;

        const indexTip = predictions[0].landmarks[8];
        const indexX = width - (indexTip[0] * scaleFactor + xOffset);
        const indexY = indexTip[1] * scaleFactor + yOffset;

        // 檢查是否碰到選項
        if (!opt.dragging &&
          indexX > opt.x && indexX < opt.x + opt.width &&
          indexY > opt.y && indexY < opt.y + opt.height
        ) {
          opt.dragging = true;
          opt.offsetX = indexX - opt.x;
          opt.offsetY = indexY - opt.y;
        }

        // 拖曳中
        if (opt.dragging) {
          opt.x = indexX - opt.offsetX;
          opt.y = indexY - opt.offsetY;

          // 磁鐵吸附效果：只要中心點距離任一方框中心小於一定距離就自動吸入
          hoveredBox = -1;
          for (let i = 0; i < boxes.length; i++) {
            let box = boxes[i];
            let centerX = box.x + box.width / 2;
            let centerY = box.y + box.height / 2;
            let optCenterX = opt.x + opt.width / 2;
            let optCenterY = opt.y + opt.height / 2;
            let dx = Math.abs(optCenterX - centerX);
            let dy = Math.abs(optCenterY - centerY);
            let magnetRange = Math.max(box.width, box.height) * 0.7; // 磁鐵吸附範圍
            if (dx < magnetRange / 2 && dy < magnetRange / 2) {
              // 吸附到方框中央並固定
              opt.x = box.x + (box.width - opt.width) / 2;
              opt.y = box.y + (box.height - opt.height) / 2;
              opt.dropped = true;
              opt.boxIndex = i;
              opt.dragging = false;
              hoveredBox = i;
              break;
            }
          }
        }

        // 若食指離開選項，視為放下（但如果已吸附則已經 dropped）
        if (opt.dragging &&
          !(indexX > opt.x && indexX < opt.x + opt.width &&
            indexY > opt.y && indexY < opt.y + opt.height)
        ) {
          opt.dragging = false;
        }
      } else {
        opt.dragging = false;
      }
    }
  }

  function drawKeypoints() {
    const scaleFactor = 2;
    const videoWidth = video.width * scaleFactor;
    const videoHeight = video.height * scaleFactor;
    const xOffset = (width - videoWidth) / 2;
    const yOffset = (height - videoHeight) / 2;

    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      const indexTip = prediction.landmarks[8];
      const [x, y, z] = indexTip;
      const adjustedX = width - (x * scaleFactor + xOffset);
      const adjustedY = y * scaleFactor + yOffset;
      fill(30, 100, 255); // 藍色
      noStroke();
      ellipse(adjustedX, adjustedY, 10, 10);
    }
  }

  function checkAnswers() {
    // 對應關係：index為方框index，值為正確課程
    // 顧大維:平面設計(1), 陳慶帆:程式設計(2), 賴婷鈴:教學原理(0), 林逸農:2D繪圖(3)
    const correctMap = ["賴婷鈴老師", "顧大維老師", "陳慶帆老師", "林逸農老師"];
    const optionMap = {
      "教學原理": "賴婷鈴老師",
      "平面設計": "顧大維老師",
      "程式設計": "陳慶帆老師",
      "2D繪圖": "林逸農老師"
    };
    let count = 0;z
    for (let opt of optionList) {
      if (opt.dropped && opt.boxIndex !== null) {
        let correctLabel = correctMap[opt.boxIndex];
        let selectedLabel = optionMap[opt.text];
        if (correctLabel === selectedLabel) {
          count++;
        }
      }
    }
    return count;
  }

  function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    setup();
  }
