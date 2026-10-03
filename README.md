# Outpatient Clinics Dashboard

Open `index.html` in Chrome/Edge (just double-click, no server or build step needed; internet is required for the CDN libraries).

## Structure
```
index.html            page markup only
css/styles.css        custom styles
js/
  tailwind-config.js  Tailwind theme colours
  state.js            global state variables
  utils.js            toast, chart helper, aggregateByMonth()
  demo-data.js        demo dataset generator
  data-import.js      Excel/CSV import  <-- edit this if your export format changes
  filters.js          filters, tabs, refresh
  views/              one file per tab (overview, doctors, patients, raw-data)
  upload-ui.js        upload modal + drag & drop
  quality-report.js   data-quality report shown after each upload
  export.js           CSV export / print
  main.js             startup
```
Scripts are plain (not ES modules) on purpose: ES modules don't run from `file://`.
Load order matters and is listed at the bottom of `index.html`.

## Every quarter
Click "رفع ملف" and pick the new export. Months, period label and filters all adapt to the data.

## If your export columns change
Open `js/data-import.js` and edit the `FIELDS` table at the top: add the new column title to the
`aliases` list of the matching field. Matching is exact (ignoring spaces, ة/ه, ى/ي, hamza, case).
