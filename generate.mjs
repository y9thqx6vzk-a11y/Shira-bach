import fs from 'fs';
import path from 'path';

const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

function isImage(file) {
  return validExts.includes(path.extname(file).toLowerCase());
}

function getMimeType(file) {
  const ext = path.extname(file).toLowerCase().replace('.', '');
  return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
}

// איסוף קטגוריות ותמונות
const categories = [];
const items = fs.readdirSync('.', { withFileTypes: true });

// 1. בדיקת תמונות שנמצאות ישירות בתיקייה הראשית
const rootImages = items
  .filter(item => item.isFile() && isImage(item.name))
  .map(item => item.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (rootImages.length > 0) {
  categories.push({
    title: 'שירה בסרטים וסדרות',
    images: rootImages
  });
}

// 2. בדיקת תתי-תיקיות (כל תיקייה הופכת לקטגוריה עם שקופית כותרת משלה!)
const folders = items
  .filter(item => item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules')
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

for (const folder of folders) {
  const folderPath = folder.name;
  const folderImages = fs.readdirSync(folderPath)
    .filter(file => isImage(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(file => `${folderPath}/${file}`);

  if (folderImages.length > 0) {
    // מנקה מספרים מתחילת שם התיקייה (למשל "01 - שירה בסרטים" יהפוך ל-"שירה בסרטים")
    const cleanTitle = folder.name.replace(/^\d+\s*[-_.]?\s*/, '');
    categories.push({
      title: cleanTitle,
      images: folderImages
    });
  }
}

function buildHtml(embedBase64 = false) {
  let slidesHtml = '';
  let totalImages = 0;

  categories.forEach((cat, idx) => {
    slidesHtml += `
    <section class="slide topic-slide">
      <div class="topic-content">
        <span class="badge">חלק ${idx + 1} ✨</span>
        <h2>${cat.title}</h2>
        <p class="count">${cat.images.length} תמונות</p>
      </div>
    </section>\n`;

    cat.images.forEach((imgPath) => {
      totalImages++;
      let src = imgPath;
      if (embedBase64) {
        const buffer = fs.readFileSync(imgPath);
        const mime = getMimeType(imgPath);
        src = `data:${mime};base64,${buffer.toString('base64')}`;
      }
      slidesHtml += `
    <section class="slide image-slide">
      <div class="blur-bg" style="background-image: url('${src}')"></div>
      <img src="${src}" loading="lazy" alt="${cat.title}">
    </section>\n`;
    });
  });

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>מסיבת הרווקות של שירה 💍</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #000;
      color: #fff;
      font-family: 'Rubik', sans-serif;
      overflow: hidden;
      user-select: none;
    }

    /* גלילה מדויקת של מצגת */
    .slider {
      height: 100vh;
      width: 100vw;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
      scrollbar-width: none;
    }
    .slider::-webkit-scrollbar { display: none; }

    .slide {
      height: 100vh;
      width: 100vw;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    /* שקופית פתיחה */
    .intro-slide {
      background: radial-gradient(circle at center, #3b0764 0%, #09090b 85%);
      text-align: center;
      flex-direction: column;
      padding: 2rem;
    }
    .intro-slide h1 {
      font-size: clamp(3rem, 7vw, 6.5rem);
      font-weight: 900;
      background: linear-gradient(135deg, #f472b6, #fb7185, #fde047);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1.5rem;
      line-height: 1.1;
    }
    .intro-slide p {
      font-size: clamp(1.4rem, 2.5vw, 2.2rem);
      color: #e2e8f0;
    }

    /* שקופית קטגוריה / נושא */
    .topic-slide {
      background: radial-gradient(circle at center, #1e1b4b 0%, #020617 90%);
      text-align: center;
    }
    .topic-content {
      z-index: 2;
      padding: 2rem;
    }
    .badge {
      display: inline-block;
      padding: 0.6rem 1.8rem;
      border-radius: 999px;
      background: rgba(244, 114, 182, 0.15);
      border: 1px solid rgba(244, 114, 182, 0.5);
      color: #f472b6;
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 2rem;
    }
    .topic-slide h2 {
      font-size: clamp(2.8rem, 6vw, 5.5rem);
      font-weight: 900;
      color: #fff;
      text-shadow: 0 10px 30px rgba(0,0,0,0.8);
    }
    .topic-slide .count {
      margin-top: 1rem;
      font-size: 1.3rem;
      color: #94a3b8;
    }

    /* שקופית תמונה - 100% מסך מלא ללא הקטנה! */
    .image-slide {
      background-color: #000;
    }
    /* רקע מטושטש יוקרתי שממלא שוליים לתמונות אנכיות */
    .blur-bg {
      position: absolute;
      inset: -40px;
      background-size: cover;
      background-position: center;
      filter: blur(35px) brightness(0.35);
      z-index: 1;
    }
    .image-slide img {
      position: relative;
      z-index: 2;
      width: 100vw;
      height: 100vh;
      object-fit: contain; /* שומר על פרופורציות ב-100% גודל מסך */
      transition: transform 0.25s ease;
    }
    /* מצב מילוי מוחלט בלחיצה על Z */
    body.zoom-fill .image-slide img {
      object-fit: cover;
    }

    /* סרגל שליטה עליון נסתר שמופיע בהזזת עכבר */
    .controls {
      position: fixed;
      top: 1.2rem;
      left: 1.2rem;
      z-index: 100;
      display: flex;
      gap: 0.6rem;
      opacity: 0.2;
      transition: opacity 0.3s;
    }
    .controls:hover { opacity: 1; }
    .btn {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      color: #fff;
      padding: 0.6rem 1.1rem;
      border-radius: 10px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 600;
    }
    .btn:hover { background: rgba(255,255,255,0.2); }

    /* מד התקדמות תחתון */
    .progress-bar {
      position: fixed;
      bottom: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #ec4899, #eab308);
      z-index: 100;
      width: 0%;
      transition: width 0.2s ease;
    }
  </style>
</head>
<body>

  <div class="controls">
    <button class="btn" onclick="toggleFullscreen()">מסך מלא (F)</button>
    <button class="btn" onclick="toggleZoom()">התאמת תמונה (Z)</button>
  </div>

  <div class="progress-bar" id="progress"></div>

  <div class="slider" id="slider">
    <section class="slide intro-slide">
      <h1>מסיבת הרווקות של שירה 💍</h1>
      <p>המשחק מתחיל – גללו למטה או לחצו על החצים במקלדת ↓</p>
    </section>
${slidesHtml}
  </div>

  <script>
    const slider = document.getElementById('slider');
    const progress = document.getElementById('progress');

    slider.addEventListener('scroll', () => {
      const maxScroll = slider.scrollHeight - slider.clientHeight;
      const pct = maxScroll > 0 ? (slider.scrollTop / maxScroll) * 100 : 0;
      progress.style.width = pct + '%';
    });

    window.addEventListener('keydown', (e) => {
      const h = window.innerHeight;
      if (['ArrowDown', 'PageDown', 'Space', 'ArrowLeft'].includes(e.code)) {
        e.preventDefault();
        slider.scrollBy({ top: h, behavior: 'smooth' });
      } else if (['ArrowUp', 'PageUp', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        slider.scrollBy({ top: -h, behavior: 'smooth' });
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'z' || e.key === 'Z') {
        toggleZoom();
      }
    });

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }

    function toggleZoom() {
      document.body.classList.toggle('zoom-fill');
    }
  </script>
</body>
</html>`;
}

// יצירת קובץ רגיל (מושלם ל-Vercel או להרצה מתוך התיקייה)
fs.writeFileSync('index.html', buildHtml(false), 'utf8');
console.log('✅ נוצר קובץ index.html (קל ומהיר)');

// יצירת קובץ עצמאי אחד שכולל את כל התמונות בתוכו לשליחה במייל/וואטסאפ
fs.writeFileSync('shira-standalone.html', buildHtml(true), 'utf8');
console.log('✅ נוצר קובץ shira-standalone.html (קובץ אחד שמכיל את כל התמונות בפנים - לשליחה לאנשים!)');