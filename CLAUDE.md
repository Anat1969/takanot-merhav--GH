תקנות במרחב (takanot-merhav) היא מדריך תלת־ממדי לתוספת השנייה של תקנות התכנון והבנייה (בקשה להיתר, תנאיו ואגרות), התש"ל-1970. זו אינה Hanchayit-GH (הנחיות מרחביות אשדוד), ואין לערבב ביניהן.

## גבולות הפרויקט

- הריפו הזה הוא הפרויקט היחיד. אין לקרוא, להעתיק או להפנות לנתונים, סצנות או מסמכים של Hanchayit-GH.
- השלד הטכני (Vite, React, Three.js, חיפוש עברי, פרימיטיבים תלת־ממדיים) הועתק פעם אחת בקומיט "scaffold from Hanchayit-GH stack". מכאן הוא קוד של הפרויקט הזה בלבד.
- אם יידרש Supabase: אותו פרויקט Supabase של המשתמשת, אבל schema נפרד בשם `takanot_merhav`. אין טבלאות משותפות ואין כתיבה ל־schema של אפליקציה אחרת.

## מקור האמת

- `data/takanot.json` הוא מקור האמת היחיד. אין מספר רגולטורי (מרחק, גובה, אחוז, שטח) בקוד הסצנות או בקומפוננטות.
- `takanot-merhav.html` הוא ה־MVP העובד ומפרט ההתנהגות. ממנו חולצו PARAMS, FIX, RULES, SCENES, PARTS.
- כל פרמטר נושא `"verified": false` עד שנבדק מול הנוסח הרשמי, ומוצג בממשק עם הסימון "לאימות". רק אדם משנה ל־`true`, עם ציון מקור.

## מסמכים

- `docs/SPEC.md`: התנהגות ומסלולי משתמש.
- `docs/DESIGN.md`: מערכת העיצוב האפורה של ה־MVP.
- `docs/DATA-MODEL.md`: מבנה `data/takanot.json` וכללי האימות.

## כללי ממשק

- עברית ו־RTL. מאפייני CSS לוגיים בלבד (`margin-inline-start` ולא `margin-left`).
- ערכת צבעים בהירה וכהה. פריסת מובייל.
- גופן Rubik במשקל 300, בלי אייקונים.

## פקודות

```
npm install
npm run dev
npm test
npm run build
```

## עבודה

- SPEC, DESIGN ו־DATA-MODEL אושרו (אוקטובר 2026). גרסה 1 בנויה ופרוסה.
- מבנה הקוד:
  - `src/data/`: טעינה ובדיקה של `data/takanot.json` (zod והצלבות), עיצוב ערכים.
  - `src/scenes/`: בוני סצנות טהורים שמחזירים `SceneModel` (נפחים, קווים, מידות, תוויות). בלי three ובלי מספרי מידה: `npm run validate` נכשל על כל ליטרל מספרי שאינו 0, 1, 2 או 0.5.
  - `src/render/SceneCanvas.tsx`: רינדור ב־React Three Fiber. מאפייני מראה בלבד (צבע, צל, אנימציה).
  - `src/ui/`: הממשק. `src/search/`: חיפוש בעברית.
- סצנה חדשה: מוסיפים אותה ל־`scenes` ול־`sceneFixtures` בקובץ הנתונים, כותבים בונה ב־`src/scenes/scenes.ts`, ומוסיפים בדיקה ב־`scenes.test.ts` ששינוי ערך משנה גיאומטריה ותווית.
- לפני כל דחיפה: `npm test` ו־`npm run build`. דחיפה ל־main מפרסמת לכתובת https://anat1969.github.io/takanot-merhav--GH/

## A&I logo button
The top bar holds only the app name (links home), content navigation, and ONE logo button "אד' ענת שטיבלמן A&I" (`<ai-menu>` from https://appofapp-gh.vercel.app/ai-menu.js). Every editing and development action (העתקת קישור, שיחת הפיתוח, פרויקט המחקר, התקנת האפליקציה, edit mode, add, delete) lives only inside it, never as loose buttons. Standard: https://github.com/Anat1969/AppOfApp-GH/blob/main/docs/ai-menu-standard.md
