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

- לא כותבים קוד אפליקציה לפני אישור של SPEC, DESIGN ו־DATA-MODEL.
- `src/scenes/primitives/` מייבאים מודולים שעדיין לא קיימים כאן (model, materials, fixtures, palette, ui/links). הם ייכתבו מחדש לפי DATA-MODEL, בלי להעתיק מ־Hanchayit-GH.
